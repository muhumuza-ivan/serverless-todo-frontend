import { useState, type FormEvent } from 'react'
import { Button, Card, Flex, Heading, TextField } from '@aws-amplify/ui-react'
import { createTask, type Task } from './api'
import { fromLocalInput, today } from './time'

interface Props {
  onCreated: (task: Task) => void
  onError: (message: string) => void
}

export function CreateTaskForm({ onCreated, onError }: Props) {
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today())
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    try {
      const task = await createTask({
        description: description.trim(),
        date: date || undefined,
        deadline: fromLocalInput(deadline),
      })
      setDescription('')
      setDeadline('')
      onCreated(task)
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variation="outlined">
      <form onSubmit={submit}>
        <Heading level={5} marginBottom="small">New task</Heading>
        <Flex direction={{ base: 'column', medium: 'row' }} alignItems={{ medium: 'flex-end' }} gap="small">
          <TextField
            label="Description"
            placeholder="What needs doing?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            isRequired
            flex="2"
          />
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} flex="1" />
          <TextField
            label="Deadline"
            descriptiveText="Optional: defaults to 5 minutes from now"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            flex="1.3"
          />
          <Button type="submit" variation="primary" isLoading={saving} isDisabled={!description.trim()}>
            Add task
          </Button>
        </Flex>
      </form>
    </Card>
  )
}
