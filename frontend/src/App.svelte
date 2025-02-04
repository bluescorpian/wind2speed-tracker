<script lang="ts">
	import { Col, Container, Row } from "@sveltestrap/sveltestrap";
	import SelectTrackedStatiosn from "./lib/SelectTrackedStations.svelte";
	import Stations from "./lib/Stations.svelte";
</script>

<main>
	<Container class="mt-5" sm
		><Row>
			<Col sm="12" md={{ size: 4, offset: 4 }}
				><SelectTrackedStatiosn /></Col
			>
		</Row>
		<Row>
			<Col sm="12" md={{ size: 9, offset: 2 }}
				><Row class="g-3"><Stations /></Row></Col
			></Row
		>
	</Container>
</main>
