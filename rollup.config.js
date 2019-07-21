import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      cacheRoot: '/tmp/.rollup_plugin_typescript_cache'
    }),
    filesize()
  ],
  output: {
    file: 'www/js/bundle.js',
    format: 'iife'
  }
}
