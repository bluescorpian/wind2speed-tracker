import { WindData } from "../types.d.ts";

export async function getWSData(stationId: number): Promise<WindData> {
	const response = await fetch(
		"https://wind2speed.africa/apidata/wsdata/" + stationId,
		{
			headers: {
				"content-type": "application/json",
			},
			method: "GET",
		}
	);
	const eventData = await response.json();
	let data: WindData;
	data = JSON.parse(eventData.data) as WindData;

	return data;
}
