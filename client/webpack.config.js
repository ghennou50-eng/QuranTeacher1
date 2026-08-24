const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.js",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "assets/js/[name].[contenthash].js",
    clean: true,
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  resolve: {
    extensions: [".js", ".jsx"]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html"
    })
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, "public")
    },
    historyApiFallback: true,
    port: 3000,
    open: true
  },

  optimization: {
    splitChunks: {
      chunks: "all"
    }
  }
};