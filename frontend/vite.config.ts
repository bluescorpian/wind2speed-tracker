import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
	base: "https://bluescorpian.github.io/wind2speed-tracker/",
	plugins: [svelte()],
});
