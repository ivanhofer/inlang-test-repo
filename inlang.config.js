/**
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
    readResources: async (args) => {
      console.log('read', args);
      const x = await getBaseTranslations({ baseLocale: 'en', tempPath: './node_modules/typesafe-i18n/temp-output/', outputPath: './src/i18n/', outputFormat: 'TypeScript', typesFileName: 'i18n-types', }, [])
      console.log(x);
      return []
    },
    writeResources: (args) => {
      console.log('write', args);
    }
  };
}

// --------------------------------------------------------------------------------------------------------------------

const getBaseTranslations = async (
  { baseLocale, tempPath, outputPath, outputFormat, typesFileName },
  namespaces,
) => {
  const translations =
    (await parseLanguageFile(
      outputPath,
      outputFormat,
      typesFileName,
      resolve(tempPath, `${debounceCounter}`),
      baseLocale,
    )) || {}

  // TODO: add support for namespaces
  // for await (const namespace of namespaces) {
  //   const namespaceTranslations =
  //     (await parseLanguageFile(
  //       outputPath,
  //       outputFormat,
  //       typesFileName,
  //       resolve(tempPath, `${debounceCounter}`),
  //       baseLocale,
  //       namespace,
  //     )) || {}

  //     ; (translations)[namespace] = namespaceTranslations
  // }

  return translations
}

import { resolve, sep } from 'path'
import { isTruthy } from 'typesafe-utils'
import ts from 'typescript'
import { fileEnding } from './output-handler.mjs'
import {
  containsFolders,
  createPathIfNotExits,
  deleteFolderRecursive,
  doesPathExist,
  getDirectoryStructure,
  getFiles,
  importFile,
} from './utils/file.utils.mjs'
import { logger } from './utils/logger.mjs'

/**
 * looks for the location of the compiled 'index.js' file
 * if the 'index.ts' file imports something from outside it's directory, we need to find the correct path to the base location file
 */
const detectLocationOfCompiledBaseTranslation = async (
  outputPath,
  outputFormat,
  locale,
  tempPath,
  typesFileName,
) => {
  if (!containsFolders(tempPath)) return ''

  const directory = await getDirectoryStructure(tempPath)

  if (outputFormat === 'TypeScript' && !Object.keys(directory).length) {
    logger.error(`in '${locale}'
Make sure to import the type 'BaseTranslation' from the generated '${typesFileName}${fileEnding}' file.
See the example in the official docs: https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#namespaces
`)
  }

  // contains the path from <root> to base locale file
  const outputPathParts = resolve(outputPath, locale).replace(resolve(), '').split(sep).filter(isTruthy)

  for (let i = 0; i < outputPathParts.length; i++) {
    const part = outputPathParts[i]
    const subDirectory = directory[part]
    if (subDirectory) {
      let outputPathPartsRest = [...outputPathParts].slice(i + 1)

      let isPathValid = true
      let subDirectoryOfCurrentSection = subDirectory
      const subPaths = [part]
      while (isPathValid && outputPathPartsRest.length) {
        // we need to find the full matching path
        // e.g. `src/path/i18n/en` is invalid if the base locale is located inside `src/i18n/en`
        const subSubDirectoryOfCurrentSection = subDirectoryOfCurrentSection[
          outputPathPartsRest[0]
        ]
        if (subSubDirectoryOfCurrentSection) {
          subPaths.push(outputPathPartsRest[0])
          outputPathPartsRest = outputPathPartsRest.slice(1)
          subDirectoryOfCurrentSection = subSubDirectoryOfCurrentSection
        } else {
          isPathValid = false
        }
      }

      if (isPathValid) {
        i += outputPathPartsRest.length
        return [...subPaths, ''].join('/')
      }
    }
  }

  return ''
}

const transpileTypescriptFiles = async (
  outputPath,
  outputFormat,
  languageFilePath,
  locale,
  tempPath,
  typesFileName,
) => {
  const program = ts.createProgram([languageFilePath], {
    outDir: tempPath,
    allowJs: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    sourceMap: false,
    noLib: true,
  })

  program.emit()

  const baseTranslationPath = await detectLocationOfCompiledBaseTranslation(
    outputPath,
    outputFormat,
    locale,
    tempPath,
    typesFileName,
  )

  return resolve(tempPath, baseTranslationPath, 'index.js')
}

const parseLanguageFile = async (
  outputPath,
  outputFormat,
  typesFileName,
  tempPath,
  locale,
  namespace = '',
) => {
  const fileName = namespace ? `${locale}/${namespace}` : locale
  const type = namespace ? 'namespace' : 'base locale'

  const originalPath = resolve(outputPath, fileName, `index${fileEnding}`)

  if (!(await doesPathExist(originalPath))) {
    logger.info(`could not load ${type} file '${fileName}'`)
    return null
  }

  if (outputFormat === 'JavaScript' && namespace) {
    tempPath = `${tempPath}-${namespace}`
  }

  await createPathIfNotExits(tempPath)

  const importPath = await transpileTypescriptFiles(
    outputPath,
    outputFormat,
    originalPath,
    fileName,
    tempPath,
    typesFileName,
  )

  if (!importPath) {
    return null
  }

  const languageImport = await importFile < BaseTranslation > (importPath)

  await deleteFolderRecursive(tempPath)

  if (!languageImport) {
    logger.error(`could not read default export from ${type} file '${fileName}'`)
    return null
  }

  return getDefaultExport(languageImport)
}

const getDefaultExport = (languageFile) => {
  const keys = Object.keys(languageFile)
  if (keys.includes('__esModule') || (keys.length === 1 && keys.includes('default'))) {
    return (languageFile).default
  }

  return languageFile
}

const getAllLocales = async (path) => {
  const files = await getFiles(path, 1)
  return files.filter(({ folder, name }) => folder && name === `index${fileEnding}`).map(({ folder }) => folder)
}
