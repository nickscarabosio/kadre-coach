import Link from 'next/link'
import { Rss, BookOpen } from 'lucide-react'

const items = [
  { name: 'Updates', href: '/updates', icon: Rss },
  { name: 'Syntheses', href: '/syntheses', icon: BookOpen },
]

export default function UpdatesHubPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">Updates</h1>
      <p className="text-muted mb-8">Choose an option below</p>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-primary-5 transition-colors"
            >
              <div className="p-2 rounded-lg bg-secondary-10">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <span className="font-medium text-primary">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
