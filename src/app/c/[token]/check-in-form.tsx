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
      <div className="bg-surface border border-border rounded-xl p-8 text-center shadow-card">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Check-in Complete!</h2>
        <p className="text-muted">
          Thanks for sharing. Your coach will review your update soon.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-secondary' : 'bg-primary-5'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
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
                      ? 'bg-secondary text-white'
                      : 'bg-primary-5 text-muted hover:bg-primary-10'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>Low energy</span>
              <span>High energy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Did you make progress toward your goal?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'yes', label: 'Yes', activeClass: 'bg-emerald-600 text-white' },
                { value: 'partial', label: 'Partially', activeClass: 'bg-amber-500 text-white' },
                { value: 'no', label: 'No', activeClass: 'bg-red-500 text-white' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal_progress: option.value as 'yes' | 'partial' | 'no' })}
                  className={`py-4 rounded-lg text-sm font-medium transition-colors ${
                    formData.goal_progress === option.value
                      ? option.activeClass
                      : 'bg-primary-5 text-muted hover:bg-primary-10'
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
            className="w-full py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-primary-5 disabled:text-muted text-white font-medium rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
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
                      ? 'bg-secondary text-white'
                      : 'bg-primary-5 text-muted hover:bg-primary-10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-3">
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
                      ? 'bg-secondary text-white'
                      : 'bg-primary-5 text-muted hover:bg-primary-10'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>Could improve</span>
              <span>Crushed it</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!formData.action_items_completed}
              className="flex-1 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-primary-5 disabled:text-muted text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              What was your biggest win this week?
            </label>
            <textarea
              value={formData.win}
              onChange={(e) => setFormData({ ...formData, win: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
              rows={3}
              placeholder="Share something you're proud of..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              What challenged you this week?
            </label>
            <textarea
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
              rows={3}
              placeholder="What obstacles did you face?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Anything else you want to share? (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
              rows={2}
              placeholder="Additional thoughts..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
