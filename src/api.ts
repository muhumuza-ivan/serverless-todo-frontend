import { del, get, post, put } from 'aws-amplify/api'
import { ApiError } from 'aws-amplify/api'
import { TASKS_API } from './amplify'

export type TaskStatus = 'Pending' | 'Completed' | 'Expired'

export const STATUSES: TaskStatus[] = ['Pending', 'Completed', 'Expired']

export interface Task {
  taskId: string
  userId: string
  description: string
  date: string
  status: TaskStatus
  deadline: string
  deadlineEpoch: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  description: string
  date?: string
  deadline?: string
}

export interface UpdateTaskInput {
  description?: string
  date?: string
  status?: 'Pending' | 'Completed'
  deadline?: string
}

export async function listTasks(status: TaskStatus): Promise<Task[]> {
  return call(() => get({ apiName: TASKS_API, path: '/tasks', options: { queryParams: { status } } }))
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return call(() => post({ apiName: TASKS_API, path: '/tasks', options: { body: { ...input } } }))
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  return call(() => put({ apiName: TASKS_API, path: `/tasks/${taskId}`, options: { body: { ...input } } }))
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await del({ apiName: TASKS_API, path: `/tasks/${taskId}` }).response
  } catch (e) {
    throw await toError(e)
  }
}

async function call<T>(operation: () => { response: Promise<{ body: { json(): Promise<unknown> } }> }): Promise<T> {
  try {
    const { body } = await operation().response
    return (await body.json()) as T
  } catch (e) {
    throw await toError(e)
  }
}

/** Surfaces the API's {"message": ...} error body instead of a generic HTTP error. */
async function toError(e: unknown): Promise<Error> {
  if (e instanceof ApiError && e.response?.body) {
    try {
      const parsed = JSON.parse(e.response.body) as { message?: string }
      if (parsed.message) return new Error(parsed.message)
    } catch {
      // fall through to the generic message
    }
  }
  return e instanceof Error ? e : new Error(String(e))
}
