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

interface User {
	metric: string;
	minSpeed: number;
}

interface Stats {
	lr: string;
	wds: number[];
	wdsm: number[];
	wddf: number;
	wda: number;
	wdlr: number;
	wdrh: number;
	wdrl: number;
	wdn: string;
	wsa: number;
	wsh: number;
	wsl: number;
	wcl: number;
	sol: number;
	uvh: number;
	hum: number;
	tmp: number;
	prs: number;
	dew: number;
	ran: number;
	isr: number;
	vol: number;
	wslr: number;
	lrp: number;
	DInterval: number;
	lro: number;
	lrod: number;
}

interface Station {
	nam: string;
	cod: string;
	DInterval: number;
	id: number;
	wlm: number;
	wlmType: number;
	wlmdt: string;
	wlmMin: number;
	wlmMax: number;
	tide: number;
	tideDates: string[];
	tideValues: number[];
	tideNow: number;
	hasSensors: boolean;
	hasRainSensor: boolean;
}

interface Globals {
	DIntervalPeriod: number;
	DIntervalAVGS: number;
	RecCountForAvgs: number;
}

export interface TableDataItem {
	id: number;
	stationId: number;
	obsTimeLocal: string;
	winddirHigh: number;
	winddirLow: number;
	winddirAvg: number;
	windspeedHigh: number;
	windspeedAvg: number;
	windspeedLow: number;
	humidityAvg: number;
	tempAvg: number;
	pressureAvg: number;
}

export interface WindData {
	user: User;
	stats: Stats;
	station: Station;
	globals: Globals;
	tableData: TableDataItem[];
}
