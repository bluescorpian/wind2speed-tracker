export let authState: { loggedIn: boolean } = $state({
	loggedIn: false,
});

export function getPassword(): string | null {
	return localStorage.getItem("password");
}

export function setPassword(password: string) {
	debugger;
	localStorage.setItem("password", password);
}

export async function checkSavedPassword(): Promise<boolean> {
	const savedPassword = localStorage.getItem("password");
	if (savedPassword !== null) {
		const formData = new URLSearchParams({
			password: savedPassword,
		});
		return fetch(import.meta.env.VITE_API_URL + "/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		})
			.then(async (res) => {
				if (res.status === 200) {
					authState.loggedIn = true;
					return true;
				} else {
					throw res;
				}
			})
			.catch((err) => {
				localStorage.removeItem("password");
				return false;
			});
	}
	return false;
}
