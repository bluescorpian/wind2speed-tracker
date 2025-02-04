import { TableDataItem } from "./wind2speed.ts";

const kv = await Deno.openKv(Deno.env.get("KV_STORE") || undefined);

const list = kv.list<TableDataItem>({ prefix: ["windHistoryData"] });
for await (const entry of list) {
	console.log(entry.key);
	console.log(entry.value);
}
