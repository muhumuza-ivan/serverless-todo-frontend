import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Flex, Heading, Loader, Tabs, Text, View } from '@aws-amplify/ui-react'
import { listTasks, STATUSES, type Task, type TaskStatus } from './api'
import { CreateTaskForm } from './CreateTaskForm'
import { TaskItem } from './TaskItem'

const REFRESH_MS = 10_000

type TasksByStatus = Record<TaskStatus, Task[]>

const EMPTY: TasksByStatus = { Pending: [], Completed: [], Expired: [] }

interface Props {
  email?: string
  onSignOut: () => void
}

export function TaskBoard({ email, onSignOut }: Props) {
  const [tasks, setTasks] = useState<TasksByStatus>(EMPTY)
  const [tab, setTab] = useState<TaskStatus>('Pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // One request per status, served by the table's status index.
  const refresh = useCallback(async () => {
    try {
      const results = await Promise.all(STATUSES.map((s) => listTasks(s)))
      setTasks({ Pending: results[0], Completed: results[1], Expired: results[2] })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, REFRESH_MS)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [refresh])

  return (
    <View maxWidth="960px" margin="0 auto" padding={{ base: 'medium', medium: 'large' }}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="large">
        <Heading level={3}>To-Do</Heading>
        <Flex alignItems="center" gap="small">
          <Text fontSize="small" color="font.secondary">{email}</Text>
          <Button size="small" onClick={onSignOut}>Sign out</Button>
        </Flex>
      </Flex>

      {error && (
        <Alert variation="error" isDismissible onDismiss={() => setError(null)} marginBottom="medium">
          {error}
        </Alert>
      )}

      <CreateTaskForm
        onCreated={() => {
          setTab('Pending')
          refresh()
        }}
        onError={setError}
      />

      <Tabs
        marginTop="large"
        value={tab}
        onValueChange={(v) => setTab(v as TaskStatus)}
        items={STATUSES.map((status) => ({
          label: `${status} (${tasks[status].length})`,
          value: status,
          content: (
            <Flex direction="column" gap="small" paddingTop="medium">
              {loading ? (
                <Loader variation="linear" />
              ) : tasks[status].length === 0 ? (
                <Text color="font.tertiary" textAlign="center" padding="large">No {status.toLowerCase()} tasks</Text>
              ) : (
                tasks[status].map((task) => (
                  <TaskItem key={`${task.taskId}-${task.updatedAt}`} task={task} now={now} onChanged={refresh} onError={setError} />
                ))
              )}
            </Flex>
          ),
        }))}
      />
    </View>
  )
}
