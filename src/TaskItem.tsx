import { useState } from 'react'
import { Badge, Button, Card, Flex, Text, TextField } from '@aws-amplify/ui-react'
import { deleteTask, updateTask, type Task, type UpdateTaskInput } from './api'
import { formatDateTime, formatDuration, fromLocalInput, toLocalInput } from './time'

interface Props {
  task: Task
  now: number
  onChanged: () => void
  onError: (message: string) => void
}

const BADGE = { Pending: 'info', Completed: 'success', Expired: 'error' } as const

export function TaskItem({ task, now, onChanged, onError }: Props) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [description, setDescription] = useState(task.description)
  const [date, setDate] = useState(task.date)
  const [deadline, setDeadline] = useState(toLocalInput(task.deadline))

  const msLeft = task.deadlineEpoch * 1000 - now
  const canReopen = task.status === 'Completed' && msLeft > 60_000

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      setEditing(false)
      onChanged()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function save() {
    const changes: UpdateTaskInput = {}
    if (description.trim() !== task.description) changes.description = description.trim()
    if (date !== task.date) changes.date = date
    if (task.status === 'Pending' && deadline !== toLocalInput(task.deadline)) changes.deadline = fromLocalInput(deadline)
    if (Object.keys(changes).length === 0) {
      setEditing(false)
      return
    }
    run(() => updateTask(task.taskId, changes))
  }

  function startEditing() {
    setDescription(task.description)
    setDate(task.date)
    setDeadline(toLocalInput(task.deadline))
    setEditing(true)
  }

  return (
    <Card variation="outlined" padding="medium">
      {editing ? (
        <Flex direction="column" gap="small">
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          <Flex gap="small" direction={{ base: 'column', medium: 'row' }}>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} flex="1" />
            {task.status === 'Pending' && (
              <TextField label="Deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} flex="1" />
            )}
          </Flex>
          <Flex gap="small" justifyContent="flex-end">
            <Button size="small" onClick={() => setEditing(false)} isDisabled={busy}>Cancel</Button>
            <Button size="small" variation="primary" onClick={save} isLoading={busy} isDisabled={!description.trim()}>Save</Button>
          </Flex>
        </Flex>
      ) : (
        <Flex direction={{ base: 'column', medium: 'row' }} justifyContent="space-between" alignItems={{ medium: 'center' }} gap="small">
          <Flex direction="column" gap="xxs">
            <Flex alignItems="center" gap="small">
              <Badge size="small" variation={BADGE[task.status]}>{task.status}</Badge>
              <Text fontWeight="bold" textDecoration={task.status === 'Completed' ? 'line-through' : undefined}>
                {task.description}
              </Text>
            </Flex>
            <Text fontSize="small" color="font.secondary">
              {task.date} · deadline {formatDateTime(task.deadline)}
              {task.status === 'Pending' && (msLeft > 0 ? ` · expires in ${formatDuration(msLeft)}` : ' · expiring…')}
            </Text>
          </Flex>
          <Flex gap="xs" wrap="wrap">
            {task.status === 'Pending' && (
              <Button size="small" variation="primary" isLoading={busy}
                onClick={() => run(() => updateTask(task.taskId, { status: 'Completed' }))}>
                Complete
              </Button>
            )}
            {canReopen && (
              <Button size="small" isLoading={busy} onClick={() => run(() => updateTask(task.taskId, { status: 'Pending' }))}>
                Reopen
              </Button>
            )}
            {task.status !== 'Expired' && (
              <Button size="small" onClick={startEditing} isDisabled={busy}>Edit</Button>
            )}
            <Button size="small" variation="destructive" isDisabled={busy}
              onClick={() => confirm(`Delete "${task.description}"?`) && run(() => deleteTask(task.taskId))}>
              Delete
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  )
}
