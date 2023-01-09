/**
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
  const plugin = await env.$import(
    "https://cdn.jsdelivr.net/gh/ivanhofer/inlang-plugin-typesafe-i18n/dist/index.js"
  )

  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
    readResources: async (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
    writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
  }
}
