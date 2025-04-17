import { rollup } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import setupFileInliner from './rollup-plugin-inline-file.js';
import faFix from './rollup-plugin-fa.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import generateMetadata from '../src/meta/metadata.js';
import { copyFile, readFile, writeFile } from 'fs/promises';
import importBase64 from './rollup-plugin-base64.js';
import generateManifestJson from '../src/meta/manifestJson.js';
import terser from '@rollup/plugin-terser';
import fixTsOutputFormat from './fix-ts-output-format.js';
import cleanup from 'rollup-plugin-cleanup';
import alias from '@rollup/plugin-alias';
import platformSpecific from './rollup-plugin-platform-specific.js';
import removeDecaffeinateComments from './rollup-plugin-remove-decaffeinate-comments.js';
import removeTestCode from './rollup-plugin-remove-test-code.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const buildDir = resolve(__dirname, '../builds/');

const minify = process.argv.includes('-min');
const noFormat = process.argv.includes('-no-format');
const platform = /** @type {'crx'|'userscript'} */ (process.argv.find(arg => arg.startsWith('-platform='))?.slice(10));
if (platform !== undefined && platform !== 'crx' && platform !== 'userscript') {
  throw new Error('incorrect value for the platform argument');
}
const buildForTest = process.argv.includes('-test');

// https://github.com/rollup/plugins/discussions/1777
const tsPlugin = typescript({
  compilerOptions: { outDir: buildDir, },
});

(async () => {
  const packageJson = JSON.parse(await readFile(resolve(__dirname, '../package.json'), 'utf-8'));

  const fileName = `${packageJson.meta.path}${minify ? '.min' : ''}.user.js`;
  const metaFileName = `${packageJson.meta.path}${minify ? '.min' : ''}.meta.js`;

  const metadata = await generateMetadata(packageJson, fileName, metaFileName);

  const license = await readFile(resolve(__dirname, '../LICENSE'), 'utf8');

  const version = JSON.parse(await readFile(resolve(__dirname, '../version.json'), 'utf-8'));

  const inlineFile = setupFileInliner(packageJson);

  const cleanupPlugin = noFormat ? undefined : cleanup({
    extensions: minify ? ['html', 'css'] : ['js', 'ts', 'tsx', 'json', 'html', 'css'],
    comments: 'all',
    lineEndings: 'unix',
    maxEmptyLines: 1,
    sourcemap: minify,
  });

  const bundle = await rollup({
    input: resolve(__dirname, '../src/main/Main.js'),
    plugins: [
      platform ? platformSpecific({
        platform,
        include: [
          // Only files that actually have platform specific code.
          "**/src/main/Main.js",
          "**/src/platform/$.ts",
          "**/src/platform/CrossOrigin.ts",
        ],
        minify
      }) : undefined,
      buildForTest ? undefined : removeTestCode({
        include: [
          // Only files that actually have test code.
          "**/src/main/Main.js",
          "**/src/classes/Post.ts",
          "**/src/Linkification/Linkify.js",
        ],
        sourceMap: minify,
      }),
      noFormat || minify ? undefined : removeDecaffeinateComments({
        include: ["**/*.js", "**/*.ts", "**/*.tsx"],
      }),
      tsPlugin,
      alias({
        entries: [
          {
            find: /^@fa\/(.*)$/,
            replacement: resolve(__dirname, '../node_modules/@fortawesome/free-regular-svg-icons/$1.js')
          },
          {
            find: /^@fas\/(.*)$/,
            replacement: resolve(__dirname, '../node_modules/@fortawesome/free-solid-svg-icons/$1.js')
          },
        ]
      }),
      minify || noFormat ? undefined : fixTsOutputFormat({
        include: ["**/*.ts", "**/*.tsx"],
      }),
      inlineFile({
        include: ["**/*.html"],
        transformer(html) {
          if (!minify) return html;

          return html.replace(/\n */g, ' ');
        },
      }),
      inlineFile({
        include: ["**/*.css"],
        transformer(css) {
          if (!minify) return css;

          return css
            // Remove whitespace after colon in css rules.
            .replace(/^ {2,}([a-z\-]+:) +/gm, '$1')
            // Remove newlines and trailing whitespace.
            .replace(/\r?\n[ \t+]*/g, '')
            // Remove last semicolon before the }.
            .replace(/;\}/g, '}')
            // Remove space between rule set and {.
            .replace(/ \{/g, '{')
            // Remove comments.
            .replace(/\/\*[^\*]*\*\//g, '')
            // Remove space before and after these characters in selectors.
            .replace(/ ([>+~]) /g, '$1');
        }
      }),
      importBase64({ include: ["**/*.png", "**/*.gif", "**/*.wav", "**/*.woff", "**/*.woff2"] }),
      inlineFile({
        include: "**/package.json",
        wrap: false,
        transformer(input) {
          const meta = JSON.parse(input).meta;
          meta.includes_only = undefined;
          meta.matches_only = undefined;
          meta.matches = undefined;
          meta.matches_extra = undefined;
          meta.exclude_matches = undefined;
          meta.grants = undefined;
          return `export default ${JSON.stringify(meta, undefined, 1)};`;
        }
      }),
      inlineFile({
        include: "**/*.json",
        exclude: "**/package.json",
        wrap: false,
        transformer(input) {
          return `export default ${input};`;
        }
      }),
      faFix,
      cleanupPlugin,
    ].filter(Boolean)
  });

  /** @type {import('rollup').OutputOptions} */
  const sharedBundleOpts = {
    format: "iife",
    generatedCode: {
      // needed for possible circular dependencies
      constBindings: false,
    },
    // Can't be none as long as the root file defined exports
    // exports: 'none',
  };

  // user script
  if (platform !== 'crx') {
    await bundle.write({
      ...sharedBundleOpts,
      banner: (metadata + license).replace(/\r\n/g, '\n'),
      // file: '../builds/test/rollupOutput.js',
      file: resolve(buildDir, fileName),
      plugins: minify ? [terser({
        format: {
          max_line_len: 1000,
          comments: /^(?: ==\/?UserScript==| @|!)|license|\bcc\b|copyright/i,
        },
      })] : [],
      sourcemap: minify,
    });

    await writeFile(resolve(buildDir, metaFileName), metadata);
  }

  // chrome extension
  if (platform !== 'userscript') {
    const crxDir = resolve(buildDir, 'crx');
    await bundle.write({
      ...sharedBundleOpts,
      banner: license.replace(/\r\n/g, '\n'),
      file: resolve(crxDir, 'script.js'),
    });

    const eventPage = await rollup({
      input: resolve(__dirname, '../src/meta/eventPage.js'),
      plugins: [
        tsPlugin,
        noFormat ? undefined : fixTsOutputFormat({ include: ["**/*.ts", "**/*.tsx"] }),
        cleanupPlugin,
      ].filter(Boolean),
    });

    await eventPage.write({
      format: 'module',
      file: resolve(crxDir, 'eventPage.js'),
    });

    await writeFile(
      resolve(crxDir, 'manifest.json'),
      generateManifestJson(packageJson, version, 2),
    );

    await writeFile(
      resolve(crxDir, 'manifestV3.json'),
      generateManifestJson(packageJson, version, 3),
    );

    for (const file of ['icon16.png', 'icon48.png', 'icon128.png']) {
      await copyFile(resolve(__dirname, '../src/meta/', file), resolve(crxDir, file));
    };
  }
})();
