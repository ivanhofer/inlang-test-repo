import { loadLocaleAsync } from '../i18n/i18n-util.async.js'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data: { locale } }) => {
	await loadLocaleAsync(locale)

	return { locale }
}