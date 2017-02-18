// Hack for Ubuntu on Windows: interface enumeration fails with EINVAL, so return empty.
try {
  require('os').networkInterfaces();
} catch (e) {
  require('os').networkInterfaces = () => ({});
}

var fs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const path = require("path");

module.exports = {
  context: path.join(__dirname, 'app/assets'),
  entry: {
    //teambuilder: "./javascript/teambuilder.js",
    frontend: "./javascript/frontend.js",
    battlewindow: "./javascript/battles/simplebattlewindow.js"
  },
  output: {
    path: path.join(__dirname, "public/"),
    filename: "javascript/[name].js"
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: "css-loader",
          fallback: "style-loader"
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          use:"css-loader!less-loader",
          fallback: "style-loader"
        })
      },
      { 
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
        use: "file-loader?publicPath=../&name=./files/[hash].[ext]" 
      },
      { 
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
        use: "url-loader?publicPath=../&name=./files/[hash].[ext]&limit=10000&mimetype=application/font-woff" 
      },
      {
        test: /\.png$/,
        use: "url-loader?publicPath=../&name=./files/[hash].[ext]&limit=10000&mimetype=image/png"
      }
    ]
  },
  plugins: [
    //new webpack.optimize.CommonsChunkPlugin("common"),
    new webpack.ProvidePlugin({ $: 'jquery', jquery: 'jquery', jQuery: 'jquery' }),
    new ExtractTextPlugin("stylesheets/styles.css"),
    new CopyWebpackPlugin([{
      context: __dirname,
      from: "node_modules/jquery/dist/jquery.min.js",
      to: "javascript"
    }, {
      from: "images",
      to: "images"
    }, {
      from: "sounds",
      to: "sounds"
    }, {
      from: "fonts",
      to: "fonts"
    }])/* Still causes problems with arrow functions, waiting for a more stable version
     of uglifyJS.
    new UglifyJSPlugin() */
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
