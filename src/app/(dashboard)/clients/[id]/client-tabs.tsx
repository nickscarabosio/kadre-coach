'use client'

import { useState } from 'react'
import { Reflection, SessionNote, Message, TelegramUpdate, CoachCheckIn } from '@/types/database'
import { format } from 'date-fns'
import { Send, Mic, FileText, MessageSquare as MsgIcon, Plus, X, Phone, Mail, Video, MapPin, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sendMessage, createCoachCheckIn, createSessionNote } from './actions'
import { ExpandableText } from '@/components/ui/expandable-text'

interface ClientTabsProps {
  clientId: string
  reflections: Reflection[]
  sessionNotes: SessionNote[]
  messages: Message[]
  updates: TelegramUpdate[]
  coachCheckIns: CoachCheckIn[]
}

const checkInTypeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  video: Video,
  'in-person': MapPin,
  other: MoreHorizontal,
}

export function ClientTabs({ clientId, reflections, sessionNotes, messages, updates, coachCheckIns }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'reflections' | 'notes' | 'messages'>('updates')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const router = useRouter()

  const tabs = [
    { id: 'updates' as const, name: 'Updates', count: updates.length },
    { id: 'reflections' as const, name: 'Check-ins', count: reflections.length + coachCheckIns.length },
    { id: 'notes' as const, name: 'Session Notes', count: sessionNotes.length },
    { id: 'messages' as const, name: 'Messages', count: messages.length },
  ]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSendingMessage(true)
    await sendMessage(clientId, newMessage)
    setNewMessage('')
    setSendingMessage(false)
    router.refresh()
  }

  const handleCreateCheckIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setModalLoading(true)
    const formData = new FormData(e.currentTarget)
    await createCoachCheckIn(clientId, {
      check_in_type: formData.get('check_in_type') as string,
      title: formData.get('title') as string || null,
      notes: formData.get('notes') as string || null,
      duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
      check_in_date: formData.get('check_in_date') as string,
      recording_url: formData.get('recording_url') as string || null,
    })
    setShowCheckInModal(false)
    setModalLoading(false)
    router.refresh()
  }

  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setModalLoading(true)
    const formData = new FormData(e.currentTarget)
    await createSessionNote(clientId, {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      session_date: formData.get('session_date') as string,
      recording_url: formData.get('recording_url') as string || null,
    })
    setShowNoteModal(false)
    setModalLoading(false)
    router.refresh()
  }

  // Merge reflections and coach check-ins chronologically
  const mergedCheckIns = [
    ...reflections.map(r => ({ type: 'reflection' as const, date: r.created_at, data: r })),
    ...coachCheckIns.map(c => ({ type: 'coach_check_in' as const, date: c.check_in_date, data: c })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <>
      <div className="bg-surface border border-border rounded-xl shadow-card">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {tab.name}
              <span className="ml-2 text-xs bg-primary-5 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'updates' && (
            <div className="space-y-3">
              {updates.length > 0 ? (
                updates.map((update) => {
                  const TypeIcon = update.message_type === 'voice' ? Mic : update.message_type === 'document' ? FileText : MsgIcon
                  const classColors: Record<string, string> = {
                    progress: 'bg-emerald-50 text-emerald-700',
                    blocker: 'bg-red-50 text-red-700',
                    communication: 'bg-blue-50 text-blue-700',
                    insight: 'bg-purple-50 text-purple-700',
                    admin: 'bg-primary-5 text-muted',
                  }
                  return (
                    <div key={update.id} className="bg-primary-5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-4 h-4 text-muted" />
                        {update.classification && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classColors[update.classification] || 'bg-primary-5 text-muted'}`}>
                            {update.classification}
                          </span>
                        )}
                        <span className="text-xs text-muted ml-auto">
                          {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <ExpandableText text={update.content} lines={2} />
                      {update.voice_transcript && update.voice_transcript !== update.content && (
                        <p className="text-xs text-muted mt-2 italic">Transcript: {update.voice_transcript}</p>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-muted text-center py-8">No updates for this company yet</p>
              )}
            </div>
          )}

          {activeTab === 'reflections' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCheckInModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Log Check-in
                </button>
              </div>
              <div className="space-y-4">
                {mergedCheckIns.length > 0 ? (
                  mergedCheckIns.map((item) => {
                    if (item.type === 'reflection') {
                      const reflection = item.data as Reflection
                      return (
                        <div key={reflection.id} className="bg-primary-5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full">Client Check-in</span>
                              <span className="text-sm text-muted">
                                {format(new Date(reflection.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              reflection.goal_progress === 'yes'
                                ? 'bg-emerald-50 text-emerald-700'
                                : reflection.goal_progress === 'partial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {reflection.goal_progress === 'yes' ? 'On track' : reflection.goal_progress === 'partial' ? 'Partial progress' : 'Off track'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted uppercase">Energy</p>
                              <p className="text-lg font-semibold text-primary">{reflection.energy_level}/10</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted uppercase">Accountability</p>
                              <p className="text-lg font-semibold text-primary">{reflection.accountability_score}/10</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted uppercase">Actions</p>
                              <p className="text-lg font-semibold text-primary capitalize">{reflection.action_items_completed}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted uppercase">Goal Progress</p>
                              <p className="text-lg font-semibold text-primary capitalize">{reflection.goal_progress}</p>
                            </div>
                          </div>
                          {reflection.win && (
                            <div className="mb-2">
                              <p className="text-xs text-muted uppercase mb-1">Win</p>
                              <p className="text-primary/80">{reflection.win}</p>
                            </div>
                          )}
                          {reflection.challenge && (
                            <div>
                              <p className="text-xs text-muted uppercase mb-1">Challenge</p>
                              <p className="text-primary/80">{reflection.challenge}</p>
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      const checkIn = item.data as CoachCheckIn
                      const Icon = checkInTypeIcons[checkIn.check_in_type] || MoreHorizontal
                      return (
                        <div key={checkIn.id} className="bg-violet-50 border border-violet-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                              Coach {checkIn.check_in_type}
                            </span>
                            <span className="text-sm text-muted">
                              {format(new Date(checkIn.check_in_date + 'T12:00:00'), 'MMM d, yyyy')}
                            </span>
                            {checkIn.duration_minutes && (
                              <span className="text-xs text-muted ml-auto">{checkIn.duration_minutes} min</span>
                            )}
                          </div>
                          {checkIn.title && <p className="text-primary font-medium mb-1">{checkIn.title}</p>}
                          {checkIn.notes && <p className="text-primary/80 text-sm whitespace-pre-wrap">{checkIn.notes}</p>}
                        </div>
                      )
                    }
                  })
                ) : (
                  <p className="text-muted text-center py-8">No check-ins yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Session Note
                </button>
              </div>
              <div className="space-y-4">
                {sessionNotes.length > 0 ? (
                  sessionNotes.map((note) => (
                    <div key={note.id} className="bg-primary-5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-primary font-semibold">{note.title}</h3>
                        <span className="text-sm text-muted">
                          {format(new Date(note.session_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <ExpandableText text={note.content} lines={3} />
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-8">No session notes yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="bg-secondary-10 border border-secondary-20 rounded-lg p-4">
                      <p className="text-primary/80">{message.content}</p>
                      <p className="text-xs text-muted mt-2">
                        {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-8">No messages yet</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Log Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Log Check-in</h2>
              <button onClick={() => setShowCheckInModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Type *</label>
                <select
                  name="check_in_type"
                  defaultValue="call"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="in-person">In Person</option>
                  <option value="video">Video</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title</label>
                <input
                  name="title"
                  type="text"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Weekly sync"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                  placeholder="What was discussed..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Duration (min)</label>
                  <input
                    name="duration_minutes"
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Date *</label>
                  <input
                    name="check_in_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Recording URL</label>
                <input
                  name="recording_url"
                  type="url"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="https://zoom.us/rec/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {modalLoading ? 'Saving...' : 'Log Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Session Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add Session Note</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Session title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Session Date *</label>
                <input
                  name="session_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Content *</label>
                <textarea
                  name="content"
                  rows={5}
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                  placeholder="Session notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Recording URL</label>
                <input
                  name="recording_url"
                  type="url"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="https://zoom.us/rec/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {modalLoading ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
