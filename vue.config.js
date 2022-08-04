const { defineConfig } = require('@vue/cli-service')
const path = require("path");
const webpack = require("webpack");

module.exports = defineConfig({
  configureWebpack: (config) => {
    return {
      module: {
        rules: [{ test: /\.(docx|xlsx)$/i, use: [{ loader: "arraybuffer-loader" }] }],
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      ],
      resolve: {
        fallback: {
          path: require.resolve("path-browserify"),
          util: require.resolve("util/"),
          vm: require.resolve("vm-browserify"),
          stream: require.resolve("stream-browserify"),
          buffer: require.resolve("buffer/"),
        },
        modules: [__dirname, path.join(__dirname, "/src"),],
      },
    }
  },
  transpileDependencies: true,

})
