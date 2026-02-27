'use client'

import { useState } from 'react'
import { ProgramAssignment } from '@/types/database'
import { updateProgramAssignment, deleteProgramAssignment } from './actions'
import { GripVertical, Trash2, ChevronDown, ChevronUp, Video, FileText, CheckSquare } from 'lucide-react'

interface AssignmentCardProps {
  assignment: ProgramAssignment
  dragHandleProps?: Record<string, unknown>
}

const typeIcons: Record<string, React.ReactNode> = {
  task: <CheckSquare className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  resource: <FileText className="w-4 h-4" />,
  reflection: <FileText className="w-4 h-4" />,
  quiz: <CheckSquare className="w-4 h-4" />,
}

const typeLabels: Record<string, string> = {
  task: 'Task',
  video: 'Video',
  resource: 'Resource',
  reflection: 'Reflection',
  quiz: 'Quiz',
}

export function AssignmentCard({ assignment, dragHandleProps }: AssignmentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(assignment.title)
  const [description, setDescription] = useState(assignment.description || '')
  const [assignmentType, setAssignmentType] = useState(assignment.assignment_type)
  const [responseType, setResponseType] = useState(assignment.response_type)
  const [videoUrl, setVideoUrl] = useState(assignment.video_url || '')
  const [resourceUrl, setResourceUrl] = useState(assignment.resource_url || '')
  const [resourceName, setResourceName] = useState(assignment.resource_name || '')
  const [delayDays, setDelayDays] = useState(assignment.delay_days)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await updateProgramAssignment(assignment.id, {
      title,
      description: description || undefined,
      assignment_type: assignmentType,
      response_type: responseType,
      video_url: videoUrl || undefined,
      resource_url: resourceUrl || undefined,
      resource_name: resourceName || undefined,
      delay_days: delayDays,
    })
    setSaving(false)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('Delete this assignment?')) {
      await deleteProgramAssignment(assignment.id)
    }
  }

  return (
    <div className="bg-primary-5 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <div {...dragHandleProps} className="text-muted hover:text-primary cursor-grab">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="w-6 h-6 rounded bg-secondary-10 flex items-center justify-center text-secondary shrink-0">
          {typeIcons[assignment.assignment_type] || typeIcons.task}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">{assignment.title}</p>
          <p className="text-xs text-muted">
            {typeLabels[assignment.assignment_type] || 'Task'}
            {assignment.delay_days > 0 && ` · Day ${assignment.delay_days}`}
          </p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted hover:text-primary">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={handleDelete} className="text-muted hover:text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {!editing ? (
            <>
              {assignment.description && (
                <p className="text-sm text-muted">{assignment.description}</p>
              )}
              {assignment.video_url && (
                <p className="text-xs text-secondary truncate">Video: {assignment.video_url}</p>
              )}
              {assignment.resource_url && (
                <p className="text-xs text-secondary truncate">Resource: {assignment.resource_name || assignment.resource_url}</p>
              )}
              <button onClick={() => setEditing(true)} className="text-xs text-secondary hover:text-secondary/80">Edit</button>
            </>
          ) : (
            <div className="space-y-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Title"
              />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={assignmentType} onChange={e => setAssignmentType(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40">
                  <option value="task">Task</option>
                  <option value="reflection">Reflection</option>
                  <option value="resource">Resource</option>
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                </select>
                <select value={responseType} onChange={e => setResponseType(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40">
                  <option value="text">Text Response</option>
                  <option value="file">File Upload</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="none">No Response</option>
                </select>
              </div>
              {assignmentType === 'video' && (
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Video URL" />
              )}
              {assignmentType === 'resource' && (
                <div className="grid grid-cols-2 gap-2">
                  <input value={resourceName} onChange={e => setResourceName(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Resource name" />
                  <input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Resource URL" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted">Delay (days from phase start)</label>
                <input type="number" min={0} value={delayDays} onChange={e => setDelayDays(parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-muted hover:text-primary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-secondary text-white rounded-md hover:bg-secondary/90 disabled:bg-secondary/50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
