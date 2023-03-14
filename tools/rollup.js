import { rollup } from "rollup";
import typescript from '@rollup/plugin-typescript';
import setupFileInliner from "./rollup-plugin-inline-file.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from 'url';
import generateMetadata from "../src/meta/metadata.js";
import { readFile, writeFile } from "fs/promises";
import importBase64 from "./rollup-plugin-base64.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  const packageJsonFile = await readFile(resolve(__dirname, '../package.json'));
  const packageJson = JSON.parse(packageJsonFile.toString());

  const metadata = await generateMetadata(packageJson);
  await writeFile(resolve(__dirname, `../builds/test/${packageJson.meta.path}.meta.js`), metadata);

  const inlineFile = await setupFileInliner(packageJson);

  const bundle = await rollup({
    input: resolve(__dirname, '../src/main/Main.js'),
    plugins: [
      typescript(),
      inlineFile({
        include: ["**/*.html", "**/*.css"],
      }),
      importBase64({ include: ["**/*.png", "**/*.gif", "**/*.wav", "**/*.woff", "**/*.woff2"] }),
      inlineFile({
        include: "**/package.json",
        wrap: false,
        transformer(input) {
          const data = JSON.parse(input);
          return `export default ${JSON.stringify(data.meta, undefined, 1)};`;
        }
      }),
      inlineFile({
        include: "**/*.json",
        exclude: "**/package.json",
        wrap: false,
        transformer(input) {
          return `export default ${input};`;
        }
      })
    ]
  });

  const bundledResult = await bundle.write({
    banner: metadata,
    // file: '../builds/test/rollupOutput.js',
    name: "bundle.js",
    dir: resolve(__dirname, '../builds/test/'),
    format: "iife",
    generatedCode: { constBindings: false }
  });
})();
