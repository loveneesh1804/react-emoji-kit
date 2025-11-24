import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";

export default [
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.cjs.js", format: "cjs", sourcemap: false },
      { file: "dist/index.esm.js", format: "esm", sourcemap: false },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ extensions: [".js", ".ts", ".tsx"] }),
      commonjs(),
      postcss({
        inject: true,
        minimize: true,
        modules: false,
        extensions: [".css"],
      }),
      json(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist/types",
      }),
      terser(),
    ],
    external: ["react", "react-dom"],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/types/index.d.ts" }],
    plugins: [dts()],
    external: [/\.css/],
  },
];
