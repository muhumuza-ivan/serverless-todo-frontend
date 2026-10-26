import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from 'aws-amplify/auth'

/** Name under which the tasks REST API is registered with Amplify. */
export const TASKS_API = 'tasks'

const env = import.meta.env

const missing = (['VITE_REGION', 'VITE_USER_POOL_ID', 'VITE_USER_POOL_CLIENT_ID', 'VITE_API_URL'] as const)
  .filter((key) => !env[key])
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}. See .env.example.`)
}

/**
 * Registers the Cognito User Pool and the tasks REST API with Amplify. All values come from
 * build-time environment variables, from the SAM-defined Amplify secrets (or .env.local locally).
 */
export function configureAmplify() {
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: env.VITE_USER_POOL_ID,
          userPoolClientId: env.VITE_USER_POOL_CLIENT_ID,
          loginWith: { email: true },
          signUpVerificationMethod: 'code',
          userAttributes: { email: { required: true } },
          passwordFormat: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialCharacters: false,
          },
        },
      },
      API: {
        REST: {
          [TASKS_API]: {
            endpoint: env.VITE_API_URL.replace(/\/$/, ''),
            region: env.VITE_REGION,
          },
        },
      },
    },
    {
      API: {
        REST: {
          // The API's Cognito authorizer validates the ID token (it carries the email claim).
          headers: async (): Promise<Record<string, string>> => {
            const { tokens } = await fetchAuthSession()
            const idToken = tokens?.idToken?.toString()
            return idToken ? { Authorization: idToken } : {}
          },
        },
      },
    },
  )
}
