/**
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
    readResources: (args) => {
      console.log('read', args);
      return []
    },
    writeResources: (args) => {
      console.log('write', args);
    }
  };
}
