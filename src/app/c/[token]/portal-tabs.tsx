'use client'

import { useState } from 'react'
import { Message, Resource, Reflection } from '@/types/database'
import { CheckInForm } from './check-in-form'
import { PortalMessages } from './messages'
import { PortalResources } from './resources'
import { PortalProgress } from './progress'

interface PortalTabsProps {
  clientId: string
  messages: Message[]
  resources: Resource[]
  reflections: Reflection[]
}

export function PortalTabs({ clientId, messages, resources, reflections }: PortalTabsProps) {
  const [activeTab, setActiveTab] = useState<'checkin' | 'messages' | 'resources' | 'progress'>('checkin')

  const tabs = [
    { id: 'checkin' as const, name: 'Check-in' },
    { id: 'messages' as const, name: 'Messages', count: messages.length },
    { id: 'resources' as const, name: 'Resources', count: resources.length },
    { id: 'progress' as const, name: 'Progress' },
  ]

  return (
    <div>
      <div className="flex bg-surface border border-border rounded-lg p-1 mb-6 shadow-card">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-secondary text-white'
                : 'text-muted hover:text-primary'
            }`}
          >
            {tab.name}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-muted'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'checkin' && <CheckInForm clientId={clientId} />}
      {activeTab === 'messages' && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <PortalMessages messages={messages} />
        </div>
      )}
      {activeTab === 'resources' && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <PortalResources resources={resources} />
        </div>
      )}
      {activeTab === 'progress' && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <PortalProgress reflections={reflections} />
        </div>
      )}
    </div>
  )
}
