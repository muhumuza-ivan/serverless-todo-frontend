import { Authenticator, Heading, View } from '@aws-amplify/ui-react'
import { TaskBoard } from './TaskBoard'

const components = {
  Header() {
    return (
      <View textAlign="center" padding="large">
        <Heading level={3}>To-Do</Heading>
      </View>
    )
  },
}

export default function App() {
  return (
    <Authenticator loginMechanisms={['email']} signUpAttributes={['email']} components={components}>
      {({ signOut, user }) => (
        <TaskBoard email={user?.signInDetails?.loginId} onSignOut={() => signOut?.()} />
      )}
    </Authenticator>
  )
}
