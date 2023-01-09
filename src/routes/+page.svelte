<script lang="ts">
	import LL, { setLocale } from '../i18n/i18n-svelte';
   import type { PageData } from './$types.js'

	export let data: PageData

	setLocale(data.locale)
</script>

<h1>{$LL.HI({name: 'inlang'})}</h1>
