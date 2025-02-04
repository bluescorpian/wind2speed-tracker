<script lang="ts">
	import { Button, Input, InputGroup } from "@sveltestrap/sveltestrap";

	let loading = $state(true);
	$effect(() => {
		fetch(import.meta.env.VITE_API_URL + "/tracked-stations")
			.then(async (res) => {
				const data = await res.json();
				trackedStationsStr = data.join(",");
			})
			.catch((err) => {
				console.error(err);
			})
			.finally(() => {
				loading = false;
			});
	});
	let trackedStationsStr: string = $state("");
	let submitted: boolean = $state(false);
	let submitting: boolean = $state(false);
	let success: boolean = $state(false);
	let msg: string | null = $state(null);
	let inputValidation = $derived(
		submitted ? (success ? "is-valid" : "is-invalid") : ""
	);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;

		const formData = new URLSearchParams(new FormData(form) as any);

		submitted = false;
		submitting = true;
		fetch(import.meta.env.VITE_API_URL + "/tracked-stations", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		})
			.then(async (res) => {
				let data;
				try {
					data = await res.json();
				} catch (_) {}
				if (!res.ok && !data) {
					msg = res.statusText;
				} else {
					msg = data.msg;
					trackedStationsStr = data.trackedStations.join(",");
				}
				success = res.ok;
				submitted = true;
			})
			.catch((err) => {
				msg = err.message;
				success = false;
				submitted = true;
			})
			.finally(() => {
				submitting = false;
			});
	}
</script>

<form onsubmit={handleSubmit}>
	<InputGroup class="mb-3 has-validation" size="sm">
		<div class={"form-floating " + inputValidation}>
			<Input
				id="trackedStations"
				name="trackedStations"
				bsSize="sm"
				class={inputValidation}
				oninput={() => (submitted = false)}
				bind:value={trackedStationsStr}
				disabled={loading}
			/>
			<label for="trackedStations">Tracked Stations</label>
		</div>

		<Button color="primary" type="submit" disabled={submitting || loading}
			>Save</Button
		>
		{#if success}
			<div class="valid-feedback">{msg}</div>
		{:else}
			<div class="invalid-feedback">{msg}</div>
		{/if}
	</InputGroup>
</form>
