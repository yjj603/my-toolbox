import typescript from "rollup-plugin-typescript2";
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: "./src/index.ts",
    plugins: [
        resolve(),
        typescript(),
    ],
    output: [
        {
            format: "cjs",
            file: "lib/bundle.cjs.js"
        },
        {
            format: "es",
            file: "lib/bundle.esm.js"
        }
    ]
}
