'use client'

import { useState } from 'react'
import { ProgramPhase, ProgramAssignment } from '@/types/database'
import { createPhase, updatePhase, deletePhase, reorderPhases, createProgramAssignment, reorderAssignments } from './actions'
import { AssignmentCard } from './assignment-card'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface PhaseBuilderProps {
  programId: string
  initialPhases: ProgramPhase[]
  initialAssignments: ProgramAssignment[]
}

export function PhaseBuilder({ programId, initialPhases, initialAssignments }: PhaseBuilderProps) {
  const [phases, setPhases] = useState(initialPhases)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(initialPhases.map(p => p.id)))
  const [addingPhase, setAddingPhase] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [addingAssignment, setAddingAssignment] = useState<string | null>(null)
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('')
  const router = useRouter()

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  const handleCreatePhase = async () => {
    if (!newPhaseName.trim()) return
    const result = await createPhase(programId, newPhaseName.trim())
    if (result.data) {
      setPhases([...phases, result.data])
      setExpandedPhases(prev => new Set([...prev, result.data!.id]))
    }
    setNewPhaseName('')
    setAddingPhase(false)
    router.refresh()
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase and all its assignments?')) return
    await deletePhase(phaseId, programId)
    setPhases(phases.filter(p => p.id !== phaseId))
    setAssignments(assignments.filter(a => a.phase_id !== phaseId))
    router.refresh()
  }

  const handleUpdatePhaseName = async (phaseId: string, name: string) => {
    await updatePhase(phaseId, { name })
    setPhases(phases.map(p => p.id === phaseId ? { ...p, name } : p))
    setEditingPhase(null)
  }

  const handleCreateAssignment = async (phaseId: string) => {
    if (!newAssignmentTitle.trim()) return
    const result = await createProgramAssignment(phaseId, { title: newAssignmentTitle.trim() })
    if (result.data) {
      setAssignments([...assignments, result.data])
    }
    setNewAssignmentTitle('')
    setAddingAssignment(null)
    router.refresh()
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { type } = result

    if (type === 'phase') {
      const reordered = Array.from(phases)
      const [moved] = reordered.splice(result.source.index, 1)
      reordered.splice(result.destination.index, 0, moved)
      setPhases(reordered)
      await reorderPhases(programId, reordered.map(p => p.id))
    }

    if (type === 'assignment') {
      const phaseId = result.source.droppableId
      const phaseAssignments = assignments
        .filter(a => a.phase_id === phaseId)
        .sort((a, b) => a.order_index - b.order_index)

      const reordered = Array.from(phaseAssignments)
      const [moved] = reordered.splice(result.source.index, 1)
      reordered.splice(result.destination.index, 0, moved)

      const otherAssignments = assignments.filter(a => a.phase_id !== phaseId)
      setAssignments([...otherAssignments, ...reordered.map((a, i) => ({ ...a, order_index: i }))])
      await reorderAssignments(phaseId, reordered.map(a => a.id))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Phases & Assignments</h2>
        <button
          onClick={() => setAddingPhase(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Phase
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="phases" type="phase">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {phases.map((phase, phaseIndex) => {
                const phaseAssignments = assignments
                  .filter(a => a.phase_id === phase.id)
                  .sort((a, b) => a.order_index - b.order_index)
                const isExpanded = expandedPhases.has(phase.id)

                return (
                  <Draggable key={phase.id} draggableId={phase.id} index={phaseIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-surface border rounded-xl shadow-card ${snapshot.isDragging ? 'border-secondary shadow-lg' : 'border-border'}`}
                      >
                        {/* Phase header */}
                        <div className="flex items-center gap-3 p-4">
                          <div {...provided.dragHandleProps} className="text-muted hover:text-primary cursor-grab">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-secondary-10 flex items-center justify-center text-secondary font-semibold text-sm">
                            {phaseIndex + 1}
                          </div>
                          <div className="flex-1">
                            {editingPhase === phase.id ? (
                              <input
                                autoFocus
                                defaultValue={phase.name}
                                onBlur={e => handleUpdatePhaseName(phase.id, e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdatePhaseName(phase.id, e.currentTarget.value)
                                  if (e.key === 'Escape') setEditingPhase(null)
                                }}
                                className="text-primary font-semibold bg-transparent border-b border-secondary outline-none w-full"
                              />
                            ) : (
                              <button onClick={() => setEditingPhase(phase.id)} className="text-primary font-semibold hover:text-secondary text-left">
                                {phase.name}
                              </button>
                            )}
                            <p className="text-xs text-muted">
                              {phase.duration_value} {phase.duration_unit} · {phaseAssignments.length} assignments
                            </p>
                          </div>
                          <button onClick={() => togglePhase(phase.id)} className="text-muted hover:text-primary">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDeletePhase(phase.id)} className="text-muted hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Phase content */}
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <Droppable droppableId={phase.id} type="assignment">
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[4px]">
                                  {phaseAssignments.map((assignment, aIndex) => (
                                    <Draggable key={assignment.id} draggableId={assignment.id} index={aIndex}>
                                      {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps}>
                                          <AssignmentCard
                                            assignment={assignment}
                                            dragHandleProps={provided.dragHandleProps as unknown as Record<string, unknown>}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            {/* Add assignment */}
                            {addingAssignment === phase.id ? (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  autoFocus
                                  value={newAssignmentTitle}
                                  onChange={e => setNewAssignmentTitle(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateAssignment(phase.id)
                                    if (e.key === 'Escape') { setAddingAssignment(null); setNewAssignmentTitle('') }
                                  }}
                                  className="flex-1 px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                                  placeholder="Assignment title..."
                                />
                                <button onClick={() => handleCreateAssignment(phase.id)} className="px-3 py-1.5 text-xs bg-secondary text-white rounded-md hover:bg-secondary/90">Add</button>
                                <button onClick={() => { setAddingAssignment(null); setNewAssignmentTitle('') }} className="px-3 py-1.5 text-xs text-muted hover:text-primary">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingAssignment(phase.id)}
                                className="mt-2 flex items-center gap-1.5 text-xs text-secondary hover:text-secondary/80"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Assignment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add phase input */}
      {addingPhase ? (
        <div className="mt-4 flex items-center gap-2">
          <input
            autoFocus
            value={newPhaseName}
            onChange={e => setNewPhaseName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreatePhase()
              if (e.key === 'Escape') { setAddingPhase(false); setNewPhaseName('') }
            }}
            className="flex-1 px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            placeholder="Phase name..."
          />
          <button onClick={handleCreatePhase} className="px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors text-sm">Create</button>
          <button onClick={() => { setAddingPhase(false); setNewPhaseName('') }} className="px-4 py-2.5 text-sm text-muted hover:text-primary">Cancel</button>
        </div>
      ) : phases.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <p className="text-muted mb-4">No phases yet. Add your first phase to start building.</p>
          <button
            onClick={() => setAddingPhase(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add First Phase
          </button>
        </div>
      ) : null}
    </div>
  )
}
