import { StationStats, type TableDataItem } from "../types.d.ts";
import { getWSData } from "./wind2speed.ts";
import { Application, Context, Router } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const kv = await Deno.openKv(Deno.env.get("KV_STORE") || undefined);

Deno.cron(
	"Download wind data",
	`*/${Deno.env.get("CRON_INTERVAL") || "1"} * * * *`,
	async () => {
		await downloadNextStationWindData();
	}
);
if (Deno.env.get("INITIAL_DOWNLOAD") === "true") {
	await downloadNextStationWindData();
}

async function downloadNextStationWindData() {
	const trackedStations =
		(await kv.get<number[]>(["trackedStations"])).value ?? [];
	const latestUpdatedStation =
		(await kv.get<number>(["latestUpdatedStation"])).value ?? NaN;
	const lastIndex = trackedStations.indexOf(latestUpdatedStation);
	const nextIndex =
		lastIndex + 1 >= trackedStations.length ? 0 : lastIndex + 1;
	const nextStationId = trackedStations[nextIndex];
	if (nextStationId) {
		return downloadWindData(nextStationId);
	} else {
		console.log("No tracked stations");
	}
}

async function downloadWindData(stationId: number) {
	console.log(`Downloading wind data for station ${stationId}`);
	const data = await getWSData(stationId);

	const stationStats = await kv.get<StationStats>([
		"station",
		data.station.id,
	]);
	const months = stationStats.value?.months || [];
	const latestEntryTimestamp = stationStats.value?.latestEntryTimestamp || 0;

	const newTableData = data.tableData.filter(
		(entry) =>
			parseObsTimeLocal(entry.obsTimeLocal).getTime() >
			latestEntryTimestamp
	);

	if (newTableData.length) {
		const transaction = kv.atomic();

		for (const entry of newTableData) {
			const date = parseObsTimeLocal(entry.obsTimeLocal);
			const year = date.getFullYear();
			const month = date.getMonth();

			if (!months.some((m) => m.year === year && m.month === month)) {
				months.push({ year, month });
			}

			transaction.set(
				["windHistoryData", data.station.id, year, month, entry.id],
				entry
			);
		}
		transaction.set(["station", data.station.id], {
			...data.station,
			totalEntries:
				(stationStats.value?.totalEntries ??
					(stationStats.value as any)?.entries ??
					0) + newTableData.length,
			latestEntryTimestamp: parseObsTimeLocal(
				newTableData[0].obsTimeLocal
			).getTime(),
			months,
		} as StationStats);
		transaction.set(["latestUpdatedStation"], stationId);

		const result = await transaction.commit();

		if (result.ok) {
			console.log(`Saved ${newTableData.length} new wind data entries`);
		} else {
			console.error("Failed to save wind data to KV store");
		}
	} else {
		console.log("No new wind data entries");
		kv.set(["latestUpdatedStation"], stationId);
	}
}

function parseObsTimeLocal(obsTimeLocal: string): Date {
	return new Date(obsTimeLocal + "+02:00");
}

const router = new Router();

const authMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
	if (
		(ctx.request.headers.get("Authorization") ?? "") !==
		(Deno.env.get("PASSWORD") ?? "")
	) {
		ctx.response.status = 401;
		ctx.response.body = {
			msg: "Unauthorized",
		};
		return;
	}
	await next();
};

router.post("/login", async (ctx) => {
	const body = await ctx.request.body.text();
	const formData = new URLSearchParams(body);
	const password = formData.get("password");

	if (password === (Deno.env.get("PASSWORD") || "")) {
		ctx.response.status = 200;
	} else {
		ctx.response.status = 401;
		ctx.response.body = "Incorrect password";
	}
});

router.get("/tracked-stations", async (ctx) => {
	const trackedStations = (await kv.get<number[]>(["trackedStations"])).value;
	ctx.response.body = trackedStations ?? [];
});

router.post("/tracked-stations", authMiddleware, async (ctx) => {
	try {
		const body = await ctx.request.body.text();
		const formData = new URLSearchParams(body);
		const trackedStationsStr = formData.get("trackedStations");
		const trackedStations = trackedStationsStr
			? trackedStationsStr
					.split(",")
					.map(Number)
					.filter((id) => !isNaN(id))
			: [];

		const result = await kv.set(["trackedStations"], trackedStations);
		if (result.ok) {
			ctx.response.body = { msg: "Saved Successfully", trackedStations };
		} else {
			ctx.response.status = 500;
			ctx.response.body = { msg: "Failed to save tracked stations" };
		}
	} catch (err) {
		ctx.response.status = 500;
		ctx.response.body = { msg: "Failed to save tracked stations" };
	}
});

router.post(
	"/update-station-months/:stationId",
	authMiddleware,
	async (ctx) => {
		const stationId = Number(ctx.params.stationId);
		const stationStats = await kv.get<StationStats>(["station", stationId]);
		const tableDataEntries = await kv.list<TableDataItem>({
			prefix: ["windHistoryData", stationId],
		});

		for await (const entry of tableDataEntries) {
			const date = parseObsTimeLocal(entry.value.obsTimeLocal);
			const year = date.getFullYear();
			const month = date.getMonth();

			if (
				!stationStats.value?.months.some(
					(m) => m.year === year && m.month === month
				)
			) {
				stationStats.value?.months.push({ year, month });
			}
		}
		await kv.set(["station", stationId], stationStats.value);

		ctx.response.status = 200;
	}
);

router.get("/stations", async (ctx) => {
	const stationsEntries = await kv.list<StationStats>({
		prefix: ["station"],
	});
	const stations = [];
	for await (const entry of stationsEntries) {
		stations.push(entry.value);
	}

	ctx.response.body = stations;
});

router.get("/wind-history/:stationId", async (ctx) => {
	const stationId = Number(ctx.params.stationId);
	const fileformat = ctx.request.url.searchParams.get("fileformat") || "csv";
	const year = Number(ctx.request.url.searchParams.get("year"));
	const month = Number(ctx.request.url.searchParams.get("month"));
	let datePrefix = [];
	if (year) {
		datePrefix.push(year);
		if (month) datePrefix.push(month);
	}

	const filenameParts = ["wind-history", stationId.toString()];
	if (year) {
		filenameParts.push(year.toString());
		if (month) {
			filenameParts.push(month.toString());
		}
	}
	const filename = filenameParts.join("-") + ".csv";

	const entries = await kv.list<TableDataItem>({
		prefix: ["windHistoryData", stationId, ...datePrefix],
	});

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			// Write CSV headers
			const headers = [
				"id",
				"stationId",
				"obsTimeLocal",
				"winddirHigh",
				"winddirLow",
				"winddirAvg",
				"windspeedHigh",
				"windspeedAvg",
				"windspeedLow",
				"humidityAvg",
				"tempAvg",
				"pressureAvg",
			];
			controller.enqueue(encoder.encode(headers.join(",") + "\n"));

			// Write CSV data rows
			for await (const entry of entries) {
				const row = [
					entry.value.id,
					entry.value.stationId,
					entry.value.obsTimeLocal,
					entry.value.winddirHigh,
					entry.value.winddirLow,
					entry.value.winddirAvg,
					entry.value.windspeedHigh,
					entry.value.windspeedAvg,
					entry.value.windspeedLow,
					entry.value.humidityAvg,
					entry.value.tempAvg,
					entry.value.pressureAvg,
				];
				controller.enqueue(encoder.encode(row.join(",") + "\n"));
			}

			controller.close();
		},
	});

	ctx.response.headers.set("Content-Type", "text/csv");
	ctx.response.headers.set(
		"Content-Disposition",
		`attachment; filename="${filename}"`
	);
	ctx.response.body = stream;
});

const app = new Application();
app.use(oakCors({ origin: Deno.env.get("ORIGIN") || "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

export default app;
