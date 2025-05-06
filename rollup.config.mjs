import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import clear from "rollup-plugin-clear";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
  },
  treeshake: false, // 禁用摇树优化
  onwarn: (msg, warn) => {
    // 循环依赖警告 不提示
    if (msg.code !== 'CIRCULAR_DEPENDENCY') {
      warn(msg)
    }
  },
  plugins: [
    json(),
    nodeResolve({
      extensions: [".js", "jsx", "ts", "tsx"],
    }),
    commonjs(),
    typescript(),
    clear({
      targets: ["dist"],
    }),
  ],
};