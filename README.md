# Serverless To-Do: Frontend

React + TypeScript + Vite single-page app for the Serverless To-Do application, hosted on **AWS Amplify Hosting**.
The backend (Cognito, API Gateway, Lambda, DynamoDB, EventBridge Scheduler, SQS FIFO, SNS) and the Amplify app
itself are defined with AWS SAM in [serverless-todo](https://github.com/muhumuza-ivan/serverless-todo).

## Features

- Email/password sign-up and sign-in with the Amplify `Authenticator` against the Cognito User Pool
  (sign-up is auto-confirmed by the backend; no verification code).
- Create tasks with a description, date and optional deadline (defaults to 5 minutes after creation).
- View tasks by status in **Pending**, **Completed** and **Expired** tabs, with a live countdown to each deadline.
- Complete, reopen (while the deadline is still ahead), edit and delete tasks. Expired tasks are read-only.
- Tasks refresh every 10 seconds, so tasks expired by the backend move to **Expired** automatically.

## How it connects to the backend

[`src/amplify.ts`](src/amplify.ts) registers the Cognito User Pool and the `tasks` REST API with Amplify from
build-time environment variables, and attaches the user's Cognito ID token as the `Authorization` header
(validated by the API Gateway Cognito authorizer). [`src/api.ts`](src/api.ts) is the typed client for the API:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/tasks?status=Pending\|Completed\|Expired` | List the user's tasks by status |
| `POST` | `/tasks` | Create a task |
| `PUT` | `/tasks/{taskId}` | Update description, date, deadline or status |
| `DELETE` | `/tasks/{taskId}` | Delete a task |

### Environment variables

| Variable | Source (SAM stack output) |
|---|---|
| `VITE_REGION` | `Region` |
| `VITE_USER_POOL_ID` | `UserPoolId` |
| `VITE_USER_POOL_CLIENT_ID` | `UserPoolClientId` |
| `VITE_API_URL` | `ApiUrl` |

On Amplify Hosting these are Amplify **secrets**, not plain environment variables: the backend SAM template
stores them as SSM parameters under `/amplify/{appId}/{branch}/`, Amplify exposes them to the build as the
JSON `$secrets` variable, and [`amplify.yml`](amplify.yml) writes them to `.env.production` before
`vite build`. For local development, copy `.env.example` to `.env.local` and fill in the stack outputs.

## Local development

```bash
npm ci
cp .env.example .env.local   # then fill in values from the backend stack outputs
npm run dev                  # http://localhost:5173
```

`npm run build` type-checks and builds to `dist/`. [`amplify.yml`](amplify.yml) is the Amplify Hosting build spec.
