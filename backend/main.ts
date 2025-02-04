import { getWSData } from "./wind2speed.ts";
import { Application, Router } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { stringify } from "jsr:@std/csv/stringify";
import { TableDataItem } from "./wind2speed.ts";

const kv = await Deno.openKv(Deno.env.get("KV_STORE") || undefined);

const router = new Router();

router.get("/tracked-stations", async (ctx) => {
	const trackedStations = (await kv.get<number[]>(["trackedStations"])).value;
	ctx.response.body = trackedStations ?? [];
});

router.post("/tracked-stations", async (ctx) => {
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
			ctx.response.body = "Failed to save tracked stations";
		}
	} catch (err) {
		ctx.response.status = 500;
		ctx.response.body = "Failed to save tracked stations";
	}
});

router.get("/stations", async (ctx) => {
	const stationStats: Record<
		string,
		{ stationId: number; entries: number; lastUpdated: number }
	> = {};
	const entries = await kv.list<TableDataItem>({
		prefix: ["windHistoryData"],
	});
	for await (const entry of entries) {
		const stationId = entry.key[1] as number;
		if (!stationStats[stationId]) {
			stationStats[stationId] = {
				stationId,
				entries: 1,
				lastUpdated: new Date(entry.value.obsTimeLocal).getTime(),
			};
		}
		stationStats[stationId].entries++;
		const entryTimestamp = new Date(entry.value.obsTimeLocal).getTime();
		if (entryTimestamp > stationStats[stationId].lastUpdated) {
			stationStats[stationId].lastUpdated = entryTimestamp;
		}
	}
	ctx.response.body = Object.values(stationStats);
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
app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 3000 });
app.addEventListener("listen", ({ hostname, port }) => {
	console.log(`Listening on ${hostname}:${port}`);
});

Deno.cron("Download wind data", "*/5 * * * *", async () => {
	await downloadNextStationWindData();
});

async function downloadNextStationWindData() {
	const trackedStations =
		(await kv.get<number[]>(["trackedStations"])).value ?? [];
	const lastDownloadedStation =
		(await kv.get<number>(["lastDownloadedStation"])).value ?? NaN;
	const lastIndex = trackedStations.indexOf(lastDownloadedStation);
	const nextIndex =
		lastIndex + 1 >= trackedStations.length ? 0 : lastIndex + 1;
	const nextStationId = trackedStations[nextIndex];
	return downloadWindData(nextStationId);
}

async function downloadWindData(stationId: number) {
	const data = await getWSData(stationId);

	const lastEntryTimestampEntry = await kv.get<number>([
		"lastEntryTimestamp",
		data.station.id,
	]);
	const lastEntryTimestamp = lastEntryTimestampEntry.value || 0;

	const newTableData = data.tableData.filter(
		(entry) => new Date(entry.obsTimeLocal).getTime() > lastEntryTimestamp
	);

	if (newTableData.length) {
		const transaction = kv.atomic();

		for (const entry of newTableData) {
			transaction.set(
				["windHistoryData", data.station.id, entry.id],
				entry
			);
		}
		transaction.set(
			["lastEntryTimestamp", data.station.id],
			new Date().getTime()
		);
		transaction.set(["lastDownloadedStation"], stationId);

		const result = await transaction.commit();

		if (result.ok) {
			console.log(`Saved ${newTableData.length} new wind data entries`);
		} else {
			console.error("Failed to save wind data to KV store");
		}
	} else {
		console.log("No new wind data entries");
	}
}
