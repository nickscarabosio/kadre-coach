import Link from 'next/link'
import { CheckSquare, BookOpen, Library, FileEdit } from 'lucide-react'

const items = [
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Programs', href: '/programs', icon: BookOpen },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Forms', href: '/forms', icon: FileEdit },
]

export default function ActionHubPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">Action</h1>
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
