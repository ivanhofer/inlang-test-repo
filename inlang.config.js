/**
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
    readResources: async (args) => {
      console.log('read', args);
      const x = await loadLocale(env.$import, args.config.referenceLanguage)
      console.log(x);
      return []
    },
    writeResources: (args) => {
      console.log('write', args);
    }
  };
}

// --------------------------------------------------------------------------------------------------------------------

const loadLocale = async ($import, locale) => {
  const module = await $import(/* vite-ignore */`./src/i18n/${locale}/index.ts`);
  return module.default
}
