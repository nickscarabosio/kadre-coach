'use client'

import { useState } from 'react'
import { CheckSquare, Loader2, Unlink } from 'lucide-react'
import { connectTodoist, disconnectTodoist, triggerTodoistSync } from './actions'

interface TodoistConnectProps {
  isConnected: boolean
  syncEnabled: boolean
}

export function TodoistConnect({ isConnected, syncEnabled }: TodoistConnectProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await connectTodoist(token.trim())
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Todoist connected successfully!')
      setToken('')
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError(null)
    const result = await disconnectTodoist()
    if (result.error) setError(result.error)
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSuccess(null)
    const result = await triggerTodoistSync()
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`Sync complete: ${result.pushed ?? 0} pushed, ${result.pulled ?? 0} pulled`)
    }
    setSyncing(false)
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Todoist Connected</p>
            <p className="text-xs text-emerald-600">
              {syncEnabled ? 'Two-way sync is active' : 'Connected but sync is paused'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
          >
            <Unlink className="w-4 h-4" />
            Disconnect
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Connect Todoist to sync your tasks bidirectionally. Tasks created in either app will appear in both.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="todoist-token" className="block text-sm font-medium text-primary mb-1">
            API Token
          </label>
          <input
            id="todoist-token"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your Todoist API token"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
          />
          <p className="mt-1 text-xs text-muted">
            Find your token in Todoist &rarr; Settings &rarr; Integrations &rarr; Developer
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          className="px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? 'Connecting...' : 'Connect Todoist'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  )
}
