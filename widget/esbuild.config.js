const esbuild = require('esbuild');

async function build() {
  // UMD-like IIFE bundle (for <script> tag usage)
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/ncodes-widget.js',
    format: 'iife',
    globalName: 'NCodes',
    minify: true,
    sourcemap: true,
    target: ['es2020'],
    footer: {
      js: 'if(typeof module!=="undefined")module.exports=NCodes;',
    },
  });

  // ESM bundle (for import usage)
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/ncodes-widget.esm.js',
    format: 'esm',
    minify: true,
    sourcemap: true,
    target: ['es2020'],
  });

  console.log('Build complete: dist/ncodes-widget.js, dist/ncodes-widget.esm.js');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
