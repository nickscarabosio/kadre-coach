'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CheckInFormProps {
  clientId: string
}

export function CheckInForm({ clientId }: CheckInFormProps) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    energy_level: 5,
    goal_progress: '' as 'yes' | 'partial' | 'no' | '',
    action_items_completed: '' as 'all' | 'most' | 'some' | 'none' | '',
    accountability_score: 5,
    win: '',
    challenge: '',
    notes: '',
  })

  const handleSubmit = async () => {
    if (!formData.goal_progress || !formData.action_items_completed) {
      setError('Please complete all required fields')
      return
    }

    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('reflections').insert({
      client_id: clientId,
      energy_level: formData.energy_level,
      goal_progress: formData.goal_progress,
      action_items_completed: formData.action_items_completed,
      accountability_score: formData.accountability_score,
      win: formData.win || null,
      challenge: formData.challenge || null,
      notes: formData.notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check-in Complete!</h2>
        <p className="text-zinc-400">
          Thanks for sharing. Your coach will review your update soon.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-blue-500' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              How&apos;s your energy level this week? (1-10)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({ ...formData, energy_level: num })}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.energy_level === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>Low energy</span>
              <span>High energy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Did you make progress toward your goal?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'yes', label: 'Yes', color: 'bg-green-600' },
                { value: 'partial', label: 'Partially', color: 'bg-yellow-600' },
                { value: 'no', label: 'No', color: 'bg-red-600' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal_progress: option.value as 'yes' | 'partial' | 'no' })}
                  className={`py-4 rounded-lg text-sm font-medium transition-colors ${
                    formData.goal_progress === option.value
                      ? `${option.color} text-white`
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!formData.goal_progress}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              How many action items did you complete?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'all', label: 'All of them' },
                { value: 'most', label: 'Most of them' },
                { value: 'some', label: 'Some of them' },
                { value: 'none', label: 'None of them' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, action_items_completed: option.value as 'all' | 'most' | 'some' | 'none' })}
                  className={`py-4 rounded-lg text-sm font-medium transition-colors ${
                    formData.action_items_completed === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Rate your accountability this week (1-10)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({ ...formData, accountability_score: num })}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.accountability_score === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>Could improve</span>
              <span>Crushed it</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!formData.action_items_completed}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              What was your biggest win this week?
            </label>
            <textarea
              value={formData.win}
              onChange={(e) => setFormData({ ...formData, win: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Share something you're proud of..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              What challenged you this week?
            </label>
            <textarea
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="What obstacles did you face?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Anything else you want to share? (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Additional thoughts..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
