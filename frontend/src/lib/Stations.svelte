<script lang="ts">
	import {
		Button,
		Card,
		CardFooter,
		CardHeader,
		Col,
		ListGroup,
		ListGroupItem,
	} from "@sveltestrap/sveltestrap";

	import moment from "moment";
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
		entries: number;
		latestEntryTimestamp: number;
	}

	let stations: Station[] = $state([]);
	$effect(() => {
		fetch(import.meta.env.VITE_API_URL + "/stations")
			.then(async (res) => {
				const data = await res.json();
				stations = data;
			})
			.catch((err) => {
				console.error(err);
			});
	});
</script>

{#each stations as station}
	<Col sm="12" md="4">
		<Card>
			<CardHeader
				><strong>{station.nam}</strong> ({station.id})</CardHeader
			>
			<ListGroup flush={true}>
				<ListGroupItem
					><strong>Last Updated</strong>: {moment(
						station.latestEntryTimestamp
					).fromNow()}</ListGroupItem
				>
				<ListGroupItem
					><strong>Total Entries</strong>: {station.entries}</ListGroupItem
				>
			</ListGroup>
			<CardFooter><Button>CSV</Button></CardFooter>
		</Card>
	</Col>
{/each}
