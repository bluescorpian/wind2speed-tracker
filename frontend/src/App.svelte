<script lang="ts">
	import { Col, Container, Row } from "@sveltestrap/sveltestrap";
	import SelectTrackedStatiosn from "./lib/SelectTrackedStations.svelte";
	import Stations from "./lib/Stations.svelte";
</script>

<main>
	<Container sm>
		<Row
			><Col sm="12" md={{ offset: 4, size: 5 }}
				><h1 class="m-4">wind2speed-tracker</h1></Col
			></Row
		>
		<Row>
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
