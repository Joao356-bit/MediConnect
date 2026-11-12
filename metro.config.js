const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Permite que o Metro reconheça arquivos WebAssembly (.wasm).
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

// Configura os cabeçalhos necessários para o SQLite na web.
const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;

  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
