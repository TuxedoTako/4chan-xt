/**
 * I don't know why I didn't get the UMD to work, and this is probably not the best solution, but it works.
 * @type {import("rollup").Plugin}
 */
export default {
  name: "inlineFile",

  transform(code, id) {
    if (id.includes('@fortawesome')) {
      const name = id.match(/[\\\/]fa([^\.]+)\.js$/)[1];

      return {
        code: // `// ${name}\n` +
          `const ${name}Svg = '${code.match(/svgPathData = '([^']+)';/)[1]}';\n` +
          `const ${name}W = ${code.match(/width = (\d+);/)[1]}, ${name}H = ${code.match(/height = (\d+);/)[1]};`+
          `export { ${name}Svg as svgPathData, ${name}W as width, ${name}H as height };`,
        map: { mappings: '' },
      };
    }
  }
};
