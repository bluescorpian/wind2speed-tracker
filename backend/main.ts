import { StationStats, type TableDataItem } from "../types.d.ts";
import { getWSData } from "./wind2speed.ts";
import { Application, Router } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { stringify } from "jsr:@std/csv/stringify";

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
	const latestEntryTimestamp = stationStats.value?.latestEntryTimestamp || 0;

	const newTableData = data.tableData.filter(
		(entry) =>
			parseObsTimeLocal(entry.obsTimeLocal).getTime() >
			latestEntryTimestamp
	);

	if (newTableData.length) {
		const transaction = kv.atomic();

		for (const entry of newTableData) {
			transaction.set(
				["windHistoryData", data.station.id, entry.id],
				entry
			);
		}
		transaction.set(["station", data.station.id], {
			...data.station,
			entries: (stationStats.value?.entries ?? 0) + newTableData.length,
			latestEntryTimestamp: parseObsTimeLocal(
				newTableData[0].obsTimeLocal
			).getTime(),
		});
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

router.post("/tracked-stations", async (ctx) => {
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

router.get("/wind-history/:stationId/csv", async (ctx) => {
	const stationId = Number(ctx.params.stationId);
	const entries = await kv.list<TableDataItem>({
		prefix: ["windHistoryData", stationId],
	});
	const data: TableDataItem[] = [];
	for await (const entry of entries) {
		data.push(entry.value);
	}
	const csv = await stringify(
		data as unknown as readonly Record<string, unknown>[],
		{
			headers: true,
			columns: [
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
			],
		}
	);
	ctx.response.headers.set("Content-Type", "text/csv");
	const date = new Date().toISOString().split("T")[0];
	ctx.response.headers.set(
		"Content-Disposition",
		`attachment; filename="wind-history-${stationId}-${date}.csv"`
	);
	ctx.response.body = csv;
});

const app = new Application();
app.use(oakCors({ origin: Deno.env.get("ORIGIN") || "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

export default app;
