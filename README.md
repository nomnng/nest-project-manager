# Nest Project Manager

REST API for managing projects and tasks, built with NestJS. Users can register, authenticate with JWT, and manage their own projects and tasks. API documentation is available via Swagger at `/api`.

## Features

- User registration and login using JWT
- CRUD for projects
- CRUD for tasks within projects
- CRUD for subtasks under tasks
- Commenting system for tasks
- Geospatial sorting
- Stats aggregation endpoints (e.g., counts, summaries)
- MongoDB persistence via Mongoose
- Docs dynamically built by Swagger

## Prerequisites

- **Node.js**
- **npm**
- **MongoDB**

## Environment variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017/nest-project-manager
JWT_SECRET=your-long-random-secret
```

| Variable     | Required | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| `MONGO_URI`  | Yes      | MongoDB connection string                        |
| `JWT_SECRET` | Yes      | Secret used to sign and verify JWT access tokens |

## How to run

```bash
# Install dependencies
npm install

# Start in watch mode
npm run start:dev
```

The API listens on `http://localhost:3000` (or the port set in `PORT`).

- **Swagger UI:** `http://localhost:3000/api`
- **Auth:** `POST /auth/register`, `POST /auth/login`
- **Projects:** `GET|POST /projects`, `GET|PATCH|DELETE /projects/:id`
- **Tasks:** `GET|POST /projects/:projectId/tasks`, `GET|PATCH|DELETE /projects/:projectId/tasks/:id`
- **Comments:** `GET|POST /projects/:projectId/tasks/:taskId/comments`, `GET|PATCH|DELETE /projects/:projectId/tasks/:taskId/comments/:id`

Protected routes require the `Authorization: Bearer <token>` header.
