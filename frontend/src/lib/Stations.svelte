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
	import DownloadModal from "./DownloadModal.svelte";

	let stations: StationStats[] = $state([]);
	let downloadOpen: boolean = $state(false);
	let downloadStation: StationStats | null = $state(null);
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
					><strong>Total Entries</strong>: {station.totalEntries}</ListGroupItem
				>
			</ListGroup>
			<CardFooter>
				<Button
					color="secondary"
					outline
					disabled={!station.months?.length}
					onclick={() => {
						downloadStation = station;
						downloadOpen = true;
					}}>Download</Button
				>
			</CardFooter>
		</Card>
	</Col>
{/each}
{#if downloadStation}
	<DownloadModal bind:isOpen={downloadOpen} station={downloadStation}
	></DownloadModal>
{/if}
