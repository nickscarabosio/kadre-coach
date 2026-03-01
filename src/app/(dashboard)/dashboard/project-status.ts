export const projectStatusLabels: Record<string, string> = {
  active: 'On-Track',
  off_track: 'Off-Track',
  needs_attention: 'Needs Attention',
  completed: 'Completed',
  idea: 'Idea',
  planning: 'Planning',
  on_hold: 'On Hold',
}

export const statusColorClasses: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  off_track: 'bg-red-50 text-red-700 border-red-200',
  needs_attention: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-secondary-10 text-secondary border-secondary-20',
  idea: 'bg-primary-5 text-muted border-border',
  planning: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-gray-50 text-gray-700 border-gray-200',
}
