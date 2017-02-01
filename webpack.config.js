const webpack = require('webpack');
const path = require("path");

module.exports = {
  entry: {
    frontend: "./app/assets/javascript/frontend.js",
    teambuilder: "./app/assets/javascript/teambuilder.js"
  },
  output: {
    path: path.join(__dirname, "public/javascript"),
    filename: "[name].js"
  },
  devtool: "source-map",
  module: {
    loaders: [
      { test: /\.css/, loader: "style!css"}
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({ $: 'jquery', jquery: 'jquery', jQuery: 'jquery' })
  ]
}
