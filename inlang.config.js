import { build } from 'esbuild'

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
  const x = await build({ entryPoints: [`./src/i18n/${locale}/index.ts`], outfile: './out.js' })
  console.log(1, x);
  const module = await $import(/* vite-ignore */ `./out.js`);
  console.log(11, module);
  return module.default
}
