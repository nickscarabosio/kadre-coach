'use client'

import { useState, useRef, useEffect } from 'react'

interface ExpandableTextProps {
  text: string
  lines?: number
}

export function ExpandableText({ text, lines = 2 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight + 1)
    }
  }, [text])

  const clampClass = lines === 2 ? 'line-clamp-2' : lines === 3 ? 'line-clamp-3' : 'line-clamp-4'

  return (
    <div>
      <p
        ref={ref}
        className={`text-primary/80 whitespace-pre-wrap text-sm ${expanded ? '' : clampClass}`}
      >
        {text}
      </p>
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
