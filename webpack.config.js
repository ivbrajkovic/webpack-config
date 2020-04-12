// Webpack module

const { resolve, join } = require("path");
const webpack = require("webpack");

/********************************************************
 * Main path entryes
 */
const distDir = resolve(__dirname, "dist");
const baseDir = resolve(__dirname, "frontend");
const srcDir = resolve(baseDir, "");
const entryFiles = {
  main: resolve(baseDir, "index.js"),
  // fa: './src/vendor/fa.js'
};
const templateHtml = resolve(baseDir, "template.html");
const entryHtml = join(".", "index.html"); // ATTENTION

module.exports = (env) => {
  /********************************************************
   * Variables
   */
  const mode = env.mode === "production" ? "production" : "development";
  const production = env.mode === "production";
  const development = env.mode === "development";
  const devtools =
    // env.devtools || (development ? 'eval-source-map' : 'source-map');
    env.devtools || (development ? "eval-cheap-module-source-map" : false);
  const analyze = env.analyze || false;

  /********************************************************
   * Log variables
   */
  console.log("mode:", mode);
  console.log("analyze:", analyze);
  console.log("devtools:", devtools);

  /********************************************************
   * Plugin array
   */
  const plugins = [];
  if (production) {
    /********************************************************
     * Production plugins
     */
    plugins.push(
      // Clean dist folder
      new (require("clean-webpack-plugin").CleanWebpackPlugin)(),
      // Generate html file
      new (require("html-webpack-plugin"))({
        template: templateHtml,
        filename: entryHtml, // ATTENTION
        minify: {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
        },
      }),
      // Extract CSS
      new (require("mini-css-extract-plugin"))({
        filename: "style.[contenthash].css",
        chunkFilename: "[id].[contenthash].css",
      })
      // Copy asset to dist
      // new CopyWebpackPlugin([
      //   {
      //     from: path.resolve(__dirname, '../src/assets/'),
      //     to: path.resolve(__dirname, '../dist/assets/')
      //   }
      // ])
    );
  } else {
    /********************************************************
     * Development plugins
     */
    plugins.push(
      // Hot module reload
      // new webpack.HotModuleReplacementPlugin(),
      // Generate html
      new (require("html-webpack-plugin"))({
        template: templateHtml,
        filename: entryHtml, // ATTENTION
      })
      // Clear console on compile
      // new (require('clean-terminal-webpack-plugin'))({
      //   // onlyInWatchMode: false,
      //   skipFirstRun: true,
      //   beforeCompile: true
      // })
    );
  }

  /********************************************************
   * Bundle analyzer plugins
   */
  if (analyze) {
    plugins.push(
      new (require("webpack-bundle-analyzer").BundleAnalyzerPlugin)({
        analyzerMode: "static",
        reportFilename: "./report.html",
        //openAnalyzer: false
      })
      // new (require('webpack-visualizer-plugin'))()
    );
  }

  /********************************************************
   * Return configuration object
   */
  return {
    // Do not continue build if any errors
    // bail: true,

    // webpack 4 - optimization auto
    mode: mode,

    entry: entryFiles,

    output: {
      filename: development ? "[name].bundle.js" : "[name].[contentHash].js",
      path: distDir, // ATTENTION
    },

    devtool: devtools,

    optimization: {
      usedExports: true,
      minimizer: development
        ? []
        : [
            new (require("terser-webpack-plugin"))(),
            new (require("optimize-css-assets-webpack-plugin"))(),
          ],
      splitChunks: {
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/]((react).*)[\\/]/,
            name: "react",
            chunks: "all",
          },
          commons: {
            test: /[\\/]node_modules[\\/]((?!react).*)[\\/]/,
            name: "common",
            chunks: "all",
          },
        },
      },
    },

    performance: {
      hints: production ? "warning" : false,
    },

    plugins: plugins,

    module: {
      rules: [
        {
          test: /\.(html)$/,
          use: "html-loader",
          include: srcDir,
          exclude: /node_modules/,
        },
        {
          test: /\.(js|jsx)$/,
          use: "babel-loader",
          include: srcDir,
          exclude: /node_modules/,
        },
        {
          test: /\.(sa|sc|c)ss$/i,
          // exclude: /node_modules/,
          use: [
            development
              ? "style-loader"
              : require("mini-css-extract-plugin").loader,
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [require("autoprefixer")],
              },
            },
          ],
        },
        {
          test: /\.(svg|png|jpe?g|gif)$/i,
          exclude: /node_modules/,
          use: {
            loader: "file-loader",
            options: {
              name: "[name].[hash].[ext]",
              outputPath: "imgs",
            },
          },
        },
      ],
    },

    stats: { colors: true },

    devServer: {
      // contentBase: join('.', 'dist'),
      // hot: !production,
      // hotOnly: !production,
      historyApiFallback: true,
      // port: port,
      compress: production,
      inline: !production,
      stats: {
        assets: true,
        children: false,
        chunks: false,
        hash: true,
        modules: false,
        publicPath: false,
        timings: true,
        version: false,
        warnings: true,
      },
    },

    resolve: {
      alias: {
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
        // Must be below test-utils
      },
    },
  };
};
