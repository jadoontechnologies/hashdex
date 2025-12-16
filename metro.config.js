const { getDefaultConfig } = require("expo/metro-config");

// Get default Expo Metro config
const config = getDefaultConfig(__dirname);

// ✅ Ensure Metro knows about font file extensions
if (!config.resolver.assetExts.includes("ttf")) {
  config.resolver.assetExts.push("ttf");
}
if (!config.resolver.assetExts.includes("otf")) {
  config.resolver.assetExts.push("otf");
}

// Optional: ensure .png, .jpg, etc. are still included
["png", "jpg", "jpeg", "gif", "webp"].forEach((ext) => {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
});

module.exports = config;
