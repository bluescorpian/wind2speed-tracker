<script lang="ts">
	import {
		Col,
		Container,
		Modal,
		ModalBody,
		ModalHeader,
		Row,
		Spinner,
	} from "@sveltestrap/sveltestrap";
	import SelectTrackedStatiosn from "./lib/SelectTrackedStations.svelte";
	import Stations from "./lib/Stations.svelte";
	import Login from "./lib/Login.svelte";
	import { checkSavedPassword } from "./lib/auth.svelte";

	let checkingPassword: boolean = $state(true);
	let foundPassword: boolean = $state(false);
	checkSavedPassword().then((fp) => {
		foundPassword = fp;
		checkingPassword = false;
	});
</script>

<main>
	<Container sm>
		<Row
			><Col sm="12" md={{ offset: 4, size: 5 }}
				><h1 class="mt-4 mb-4">wind2speed-tracker</h1></Col
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
	{#if checkingPassword}
		<Modal isOpen={checkingPassword} centered={true}>
			<ModalHeader>Logging In...</ModalHeader>
			<ModalBody>
				<Spinner></Spinner>
			</ModalBody>
		</Modal>
	{:else if !foundPassword}
		<Login></Login>
	{/if}
</main>
