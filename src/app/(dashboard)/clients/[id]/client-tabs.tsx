'use client'

import { useState } from 'react'
import { Reflection, SessionNote, Message } from '@/types/database'
import { format } from 'date-fns'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ClientTabsProps {
  clientId: string
  reflections: Reflection[]
  sessionNotes: SessionNote[]
  messages: Message[]
}

export function ClientTabs({ clientId, reflections, sessionNotes, messages }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<'reflections' | 'notes' | 'messages'>('reflections')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const tabs = [
    { id: 'reflections' as const, name: 'Check-ins', count: reflections.length },
    { id: 'notes' as const, name: 'Session Notes', count: sessionNotes.length },
    { id: 'messages' as const, name: 'Messages', count: messages.length },
  ]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSendingMessage(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSendingMessage(false)
      return
    }

    await supabase.from('messages').insert({
      coach_id: user.id,
      client_id: clientId,
      content: newMessage,
    })

    setNewMessage('')
    setSendingMessage(false)
    router.refresh()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.name}
            <span className="ml-2 text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'reflections' && (
          <div className="space-y-4">
            {reflections.length > 0 ? (
              reflections.map((reflection) => (
                <div key={reflection.id} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">
                      {format(new Date(reflection.created_at), 'MMM d, yyyy')}
                    </span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      reflection.goal_progress === 'yes'
                        ? 'bg-green-500/10 text-green-400'
                        : reflection.goal_progress === 'partial'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {reflection.goal_progress === 'yes' ? 'On track' : reflection.goal_progress === 'partial' ? 'Partial progress' : 'Off track'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Energy</p>
                      <p className="text-lg font-semibold text-white">{reflection.energy_level}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Accountability</p>
                      <p className="text-lg font-semibold text-white">{reflection.accountability_score}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Actions</p>
                      <p className="text-lg font-semibold text-white capitalize">{reflection.action_items_completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Goal Progress</p>
                      <p className="text-lg font-semibold text-white capitalize">{reflection.goal_progress}</p>
                    </div>
                  </div>
                  {reflection.win && (
                    <div className="mb-2">
                      <p className="text-xs text-zinc-500 uppercase mb-1">Win</p>
                      <p className="text-zinc-300">{reflection.win}</p>
                    </div>
                  )}
                  {reflection.challenge && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Challenge</p>
                      <p className="text-zinc-300">{reflection.challenge}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-center py-8">No check-ins yet</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            {sessionNotes.length > 0 ? (
              sessionNotes.map((note) => (
                <div key={note.id} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">{note.title}</h3>
                    <span className="text-sm text-zinc-400">
                      {format(new Date(note.session_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-center py-8">No session notes yet</p>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                    <p className="text-zinc-300">{message.content}</p>
                    <p className="text-xs text-zinc-500 mt-2">
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-center py-8">No messages yet</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
