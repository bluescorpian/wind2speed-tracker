<script lang="ts">
	import {
		Button,
		Input,
		InputGroup,
		Modal,
		ModalBody,
		ModalFooter,
		ModalHeader,
	} from "@sveltestrap/sveltestrap";
	import { authState, setPassword } from "./auth.svelte";

	let open = $state(true);
	let loggingIn = $state(false);
	let password = $state("");
	let error = $state("");
	let inputClasses = $derived.by(() => (error ? "is-invalid" : ""));

	function login(e: SubmitEvent) {
		e.preventDefault();
		loggingIn = true;

		const form = e.currentTarget as HTMLFormElement;
		const formData = new URLSearchParams(new FormData(form) as any);

		fetch(import.meta.env.VITE_API_URL + "/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		})
			.then(async (res) => {
				if (res.status === 200) {
					authState.loggedIn = true;
					setPassword(password);
					open = false;
				} else {
					error = (await res.text()) || res.statusText;
				}
			})
			.catch((err) => {
				console.error(error);
				error = err.message;
			})
			.finally(() => {
				loggingIn = false;
			});
	}
</script>

<Modal isOpen={open} centered={true}>
	<form onsubmit={login}>
		<ModalHeader>Login</ModalHeader>
		<ModalBody>
			<InputGroup class={"has-validation " + inputClasses}>
				<Input
					name="password"
					type="password"
					placeholder="Password"
					bind:value={password}
					disabled={loggingIn}
					class={inputClasses}
				/>{#if error}
					<div class="invalid-feedback">{error}</div>
				{/if}</InputGroup
			>
		</ModalBody>
		<ModalFooter>
			<Button color="primary" type="submit" disabled={loggingIn}
				>Login</Button
			>
			<Button
				color="secondary"
				type="button"
				onclick={() => (open = false)}>Guest</Button
			>
		</ModalFooter>
	</form>
</Modal>
