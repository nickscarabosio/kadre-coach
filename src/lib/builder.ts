/**
 * Builder.io (visual CMS) config.
 * Set NEXT_PUBLIC_BUILDER_PUBLIC_API_KEY in .env — get it from
 * https://www.builder.io/c/docs/using-your-api-key
 */
export const BUILDER_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_BUILDER_PUBLIC_API_KEY ?? ''

export const BUILDER_MODEL_PAGE = 'page'

export function getBuilderApiKey(): string {
  if (!BUILDER_PUBLIC_API_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_BUILDER_PUBLIC_API_KEY. Add it to .env — get your key at https://www.builder.io/c/docs/using-your-api-key'
    )
  }
  return BUILDER_PUBLIC_API_KEY
}
