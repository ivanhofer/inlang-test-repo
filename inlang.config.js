/**
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
  const plugin = await env.$import("https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1.0.0/dist/index.js");

  const pluginConfig = {
    pathPattern: "./src/i18n/{language}/index.json",
  };

  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
    readResources: (args) =>
      plugin.readResources({ ...args, ...env, pluginConfig }),
    writeResources: (args) =>
      plugin.writeResources({ ...args, ...env, pluginConfig }),
  };
}
