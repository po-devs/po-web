module.exports = {
  "entry": "./app/assets/javascript/frontend.js",
  output: {
    path: __dirname + "/public/javascript",
    filename: "bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css/, loader: "style!css"}
    ]
  }
}