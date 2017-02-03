const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require("path");

module.exports = {
  context: path.join(__dirname, 'app/assets/javascript'),
  entry: {
    frontend: "./frontend.js",
    teambuilder: "./teambuilder.js"
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
    new webpack.optimize.CommonsChunkPlugin("common"),
    new webpack.ProvidePlugin({ $: 'jquery', jquery: 'jquery', jQuery: 'jquery' }),
    new CopyWebpackPlugin([{
      context: __dirname,
      from: "node_modules/jquery/dist/jquery.min.js",
    }])
  ],
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js'
    }
  },
  externals: {
    jquery: 'jQuery'
  }
}
