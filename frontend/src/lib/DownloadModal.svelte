<script lang="ts">
	import {
		ListGroup,
		ListGroupItem,
		Modal,
		ModalBody,
		ModalHeader,
		Button,
	} from "@sveltestrap/sveltestrap";
	import type { StationStats } from "../../../types";
	import moment from "moment";
	interface Props {
		station: StationStats;
		isOpen: boolean;
	}

	let { station, isOpen = $bindable() }: Props = $props();

	const years = new Set(station.months.map((m) => m.year));
</script>

<Modal {isOpen} centered={true} toggle={() => (isOpen = !isOpen)}>
	<ModalHeader>Download wind history</ModalHeader>
	<ModalBody>
		<p>{station.nam} ({station.id})</p>
		<ListGroup>
			{#each years as year}
				<ListGroupItem
					class="d-flex justify-content-between align-items-center"
					color={"primary"}
				>
					<strong>{year}</strong>
					<Button
						size="sm"
						color="primary"
						href={import.meta.env.VITE_API_URL +
							`/wind-history/${station.id}?fileformat=csv&year=${year}`}
						>CSV</Button
					>
				</ListGroupItem>
				{#each station.months
					.filter((m) => m.year === year)
					.map((m) => m.month)
					.sort((a, b) => a - b) as month}
					<ListGroupItem
						class="d-flex justify-content-between align-items-center"
					>
						<span>
							{year} / {moment().month(month).format("MMM")}
						</span>

						<Button
							size="sm"
							outline
							color="secondary"
							href={import.meta.env.VITE_API_URL +
								`/wind-history/${station.id}?fileformat=csv&year=${year}&month=${month}`}
							>CSV</Button
						>
					</ListGroupItem>
				{/each}
			{/each}
		</ListGroup>
	</ModalBody>
</Modal>
