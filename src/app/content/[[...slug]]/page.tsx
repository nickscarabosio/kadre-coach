import { fetchOneEntry, isPreviewing } from '@builder.io/sdk-react/edge'
import { notFound } from 'next/navigation'
import { BuilderContentRenderer } from '@/components/builder-content'
import { BUILDER_MODEL_PAGE, BUILDER_PUBLIC_API_KEY } from '@/lib/builder'

interface PageProps {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Builder.io visual CMS page route.
 * - /content → urlPath /content
 * - /content/about → urlPath /content/about
 * Create pages in Builder.io and target them by URL path to show them here.
 */
export default async function BuilderContentPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const pathSegment = slug?.length ? `/${slug.join('/')}` : ''
  const urlPath = `/content${pathSegment}`

  if (!BUILDER_PUBLIC_API_KEY) {
    return (
      <main className="min-h-screen bg-background p-6">
        <BuilderContentRenderer content={null} forceRender />
      </main>
    )
  }

  const content = await fetchOneEntry({
    model: BUILDER_MODEL_PAGE,
    apiKey: BUILDER_PUBLIC_API_KEY,
    userAttributes: { urlPath },
  })

  const preview = isPreviewing(resolvedSearchParams as any)

  if (!content && !preview) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <BuilderContentRenderer content={content} forceRender={preview} />
    </main>
  )
}
