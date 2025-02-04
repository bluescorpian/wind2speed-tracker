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

export interface Station {
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

export interface StationStats extends Station {
	entries: number;
	latestEntryTimestamp: number;
}
