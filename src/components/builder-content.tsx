'use client'

import { Content } from '@builder.io/sdk-react'
import Link from 'next/link'
import type { BuilderContent } from '@builder.io/sdk-react'
import { BUILDER_MODEL_PAGE, BUILDER_PUBLIC_API_KEY } from '@/lib/builder'

interface BuilderContentProps {
  content: BuilderContent | null
  /** When true, still render Content (e.g. for Builder visual editor preview) */
  forceRender?: boolean
}

/**
 * Renders Builder.io visual CMS content. Use inside a page that has already
 * fetched content (e.g. via fetchOneEntry in a Server Component).
 * Uses Next.js Link so Builder buttons/links do client-side navigation.
 */
export function BuilderContentRenderer({ content, forceRender }: BuilderContentProps) {
  if (!BUILDER_PUBLIC_API_KEY) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Builder.io not configured</p>
        <p className="mt-1 text-sm">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_BUILDER_PUBLIC_API_KEY</code> to your
          .env and get your key from{' '}
          <a
            href="https://www.builder.io/c/docs/using-your-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Builder.io
          </a>
          .
        </p>
      </div>
    )
  }

  if (!content && !forceRender) {
    return null
  }

  return (
    <Content
      content={content}
      model={BUILDER_MODEL_PAGE}
      apiKey={BUILDER_PUBLIC_API_KEY}
      linkComponent={(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const { href, ...rest } = props
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          return <Link href={href} {...rest} />
        }
        return <a {...props} />
      }}
    />
  )
}
