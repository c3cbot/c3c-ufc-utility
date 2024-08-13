import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginExecute from "vite-plugin-execute";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        vitePluginExecute({
            args: ["../copy_data.mjs"]
        })
    ],
    build: {
        // rollupOptions: {
        //     input: {
        //         popup_gui: "src/gui/main.tsx"
        //     },
        //     output: {
        //         dir: "dist",
        //         entryFileNames: (info) =>
        //             info.name === "popup_gui" ? "popup-gui.js" :
        //                 "assets/[name]-[hash].js"
        //     }
        // },
        target: [
            'chrome89',
            'firefox89',
            'edge89',
            'opera75'
        ]
    }
})
