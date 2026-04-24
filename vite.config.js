import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    base: "/frostlog/",
    plugins: [
        react(),
        viteStaticCopy({
            targets: [{ src: "assets", dest: "assets" }],
        }),
    ],
});
