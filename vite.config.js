import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
	root: ".",
	publicDir: "public",
	base: env.dev ? "/" : "/foque-slammers/", // for github pages deploy
	plugins: [
		TanStackRouterVite({ target: "solid", autoCodeSplitting: true }),
		solidPlugin(),
		tailwindcss(),
		basicSsl(),
	],
	optimizeDeps: {
		exclude: ["excalibur"],
	},
	test: {
		globals: true,
		environment: "jsdom",
	},
	build: {
		assetsInlineLimit: 0,
		sourcemap: true,
		// Vite uses rollup currently for prod builds so a separate config is needed
		// to keep vite from bundling ESM together with commonjs
		rollupOptions: {
			output: {
				format: "umd",
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
}));
