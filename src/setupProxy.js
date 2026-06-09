const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/ServerPrincipal",
    createProxyMiddleware({
      target: "http://168.196.132.70:8090",
      changeOrigin: true,
      headers: {
        "X-Embarcadero-App-Secret": process.env.EMS_APP_SECRET,
      },
    })
  );
};