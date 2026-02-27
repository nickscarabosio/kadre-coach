'use client'

import { useState } from 'react'
import { User, Bell, MessageSquare, FileText, Users } from 'lucide-react'
import { ProfileForm } from './profile-form'
import { NotificationSettings } from './notification-settings'
import { TelegramConnect } from './telegram-connect'
import { MessageSnippets } from './message-snippets'
import { TeamManagement } from './team-management'
import type { Coach, CoachMessageSnippet, NotificationPreferences } from '@/types/database'

interface SettingsClientProps {
  coach: Coach
  prefs: NotificationPreferences
  snippets: CoachMessageSnippet[]
}

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'snippets' as const, label: 'Message snippets', icon: FileText },
  { id: 'integrations' as const, label: 'Integrations', icon: MessageSquare },
  { id: 'team' as const, label: 'Team', icon: Users },
]

export function SettingsClient({ coach, prefs, snippets }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'snippets' | 'integrations' | 'team'>('profile')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-muted mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab Sidebar */}
        <div className="w-48 shrink-0">
          <div className="bg-surface border border-border rounded-xl shadow-card p-2 sticky top-20">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-secondary-10 text-secondary'
                      : 'text-muted hover:bg-primary-5 hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary mb-4">Profile</h2>
              <ProfileForm coach={coach} />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary mb-4">Notifications</h2>
              <NotificationSettings preferences={prefs} />
            </div>
          )}

          {activeTab === 'snippets' && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary mb-4">Message snippets</h2>
              <MessageSnippets snippets={snippets} />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                <h2 className="text-lg font-semibold text-primary mb-4">Telegram</h2>
                <TelegramConnect
                  isConnected={!!coach.telegram_chat_id}
                  username={coach.telegram_username}
                />
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary mb-4">Team</h2>
              <TeamManagement isOwner={!coach.parent_coach_id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
