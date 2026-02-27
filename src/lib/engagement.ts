/**
 * Compute engagement score (0-100) for a client from recent activity:
 * - Check-in frequency (reflections in last 4 weeks)
 * - Update frequency (telegram_updates in last 4 weeks)
 * - Task completion rate (tasks completed vs total with due date in last 4 weeks)
 */

const WEIGHTS = {
  checkIns: 0.35,
  updates: 0.35,
  tasks: 0.3,
} as const

export const WEEKS_LOOKBACK = 4

export function weeksAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n * 7)
  return d.toISOString().split('T')[0]
}

export interface EngagementInputs {
  reflectionCount: number
  updateCount: number
  tasksCompleted: number
  tasksTotal: number
}

/**
 * Returns a score 0-100. Uses soft caps: 2+ check-ins, 5+ updates, and 80%+ task completion
 * each contribute up to their weight; below that we scale linearly.
 */
export function computeEngagementScore(input: EngagementInputs): number {
  const { reflectionCount, updateCount, tasksCompleted, tasksTotal } = input

  const checkInScore = Math.min(1, reflectionCount / 2)
  const updateScore = Math.min(1, updateCount / 5)
  const taskScore = tasksTotal === 0 ? 1 : Math.min(1, tasksCompleted / Math.max(1, tasksTotal))

  const raw =
    WEIGHTS.checkIns * checkInScore +
    WEIGHTS.updates * updateScore +
    WEIGHTS.tasks * taskScore

  return Math.round(Math.min(100, Math.max(0, raw * 100)))
}
