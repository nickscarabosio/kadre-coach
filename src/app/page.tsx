import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Kadre</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Where coaching programs forge real results
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Track client progress, automate check-ins, and deliver exceptional coaching experiences. Built for coaches who want to scale without losing the personal touch.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-lg"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-lg"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-zinc-500 text-sm">
        Built by coaches, for coaches.
      </footer>
    </div>
  )
}
