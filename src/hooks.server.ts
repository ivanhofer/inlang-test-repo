import type { Handle, RequestEvent } from '@sveltejs/kit'
import { initAcceptLanguageHeaderDetector } from 'typesafe-i18n/detectors'
import { detectLocale } from './i18n/i18n-util.js'

export const handle: Handle = async ({ event, resolve }) => {
	const locale = getPreferredLocale(event)
	event.locals.locale = locale
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', locale) })
}

const getPreferredLocale = ({ request }: RequestEvent) => detectLocale(initAcceptLanguageHeaderDetector(request))
