'use client'

import { useState } from 'react'
import { generateTelegramCode } from './actions'
import { MessageSquare } from 'lucide-react'

export function TelegramConnect({ isConnected, username }: { isConnected: boolean; username: string | null }) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const result = await generateTelegramCode()
    if (result.code) {
      setCode(result.code)
    }
    setLoading(false)
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <MessageSquare className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Telegram Connected</p>
          <p className="text-xs text-emerald-600">@{username}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Connect your Telegram to receive updates and manage clients via chat.
      </p>

      {code ? (
        <div className="p-4 bg-secondary-10 border border-secondary-20 rounded-lg">
          <p className="text-sm text-primary mb-2">Send this code to the Kadre bot on Telegram:</p>
          <p className="text-2xl font-mono font-bold text-secondary tracking-wider">/start {code}</p>
          <p className="text-xs text-muted mt-2">Code expires in 10 minutes</p>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Link Code'}
        </button>
      )}
    </div>
  )
}
