import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

const production = !process.env.ROLLUP_WATCH

export default [
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/helo.ts',
    plugins: [
      resolve(),
      commonjs(),
      typescript({ module: 'ESNext', sourceMap: !production }),
    ],

    output: [
      {
        file: pkg.main,
        format: 'cjs',
        banner: '#!/usr/bin/env node',
        sourcemap: !production,
      },
    ],
  },
]
