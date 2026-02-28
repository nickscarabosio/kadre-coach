const BASE_URL = 'https://api.todoist.com/rest/v2'

export interface TodoistTask {
  id: string
  content: string
  description: string
  is_completed: boolean
  priority: number // 1=normal, 4=urgent (inverse of Kadre)
  due: { date: string; datetime?: string } | null
  project_id: string | null
  section_id: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  order: number
}

/** Maps Kadre priority_level (1=highest) to Todoist priority (4=highest) */
export function toTodoistPriority(kadrePriority: number): number {
  return 5 - kadrePriority // 1→4, 2→3, 3→2, 4→1
}

/** Maps Todoist priority (4=highest) to Kadre priority_level (1=highest) */
export function toKadrePriority(todoistPriority: number): number {
  return 5 - todoistPriority // 4→1, 3→2, 2→3, 1→4
}

async function todoistFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Todoist API ${res.status}: ${text}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function listTasks(token: string): Promise<TodoistTask[]> {
  return todoistFetch<TodoistTask[]>(token, '/tasks')
}

export async function getTask(token: string, id: string): Promise<TodoistTask> {
  return todoistFetch<TodoistTask>(token, `/tasks/${id}`)
}

export async function createTask(
  token: string,
  data: {
    content: string
    description?: string
    priority?: number
    due_date?: string
    due_datetime?: string
    project_id?: string
    section_id?: string
    parent_id?: string
  }
): Promise<TodoistTask> {
  return todoistFetch<TodoistTask>(token, '/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(
  token: string,
  id: string,
  data: {
    content?: string
    description?: string
    priority?: number
    due_date?: string
    due_datetime?: string
  }
): Promise<TodoistTask> {
  return todoistFetch<TodoistTask>(token, `/tasks/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function closeTask(token: string, id: string): Promise<void> {
  return todoistFetch(token, `/tasks/${id}/close`, { method: 'POST' })
}

export async function reopenTask(token: string, id: string): Promise<void> {
  return todoistFetch(token, `/tasks/${id}/reopen`, { method: 'POST' })
}

export async function deleteTask(token: string, id: string): Promise<void> {
  return todoistFetch(token, `/tasks/${id}`, { method: 'DELETE' })
}

export async function listProjects(token: string): Promise<TodoistProject[]> {
  return todoistFetch<TodoistProject[]>(token, '/projects')
}

/** Quick check that a token is valid by fetching projects. */
export async function validateToken(token: string): Promise<boolean> {
  try {
    await listProjects(token)
    return true
  } catch {
    return false
  }
}
