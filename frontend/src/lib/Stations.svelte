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
	import { type StationStats } from "../../../types";

	import moment from "moment";

	let stations: StationStats[] = $state([]);
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
			<CardFooter
				><Button
					href={import.meta.env.VITE_API_URL +
						`/wind-history/${station.id}/csv`}>CSV</Button
				></CardFooter
			>
		</Card>
	</Col>
{/each}
