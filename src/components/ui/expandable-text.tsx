'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface ExpandableTextProps {
  text: string
  lines?: number
  markdown?: boolean
}

export function ExpandableText({ text, lines = 2, markdown = false }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight + 1)
    }
  }, [text])

  const clampClass = lines === 2 ? 'line-clamp-2' : lines === 3 ? 'line-clamp-3' : 'line-clamp-4'

  return (
    <div>
      <div
        ref={ref}
        className={`text-primary/80 text-sm ${expanded ? '' : clampClass}`}
      >
        {markdown ? (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2 prose-headings:text-primary prose-p:text-primary/80 prose-li:text-primary/80">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
      {clamped && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-secondary hover:text-secondary/80 mt-1 font-medium"
        >
          {expanded ? 'Show less' : 'View more'}
        </button>
      )}
    </div>
  )
}
