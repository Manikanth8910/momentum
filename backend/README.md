# Momentum REST API

A modular, scalable, maintainable, and secure REST API backend for the **Momentum** productivity platform, built with Node.js, Express, and MongoDB.

---

## 🏗️ Architecture & Folder Structure

This project follows a clean **Controller-Service-Model** separation:
* **Controllers** handle HTTP requests, validate input using `express-validator`, and return standardized JSON responses.
* **Services** contain all business logic, database queries, and custom error triggers.
* **Models** define Mongoose schemas, enforce validations, and configure compound and text indexes.

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── logger.js             # Winston logger configuration
│   ├── controllers/
│   │   ├── auth.controller.js    # Auth controllers (Thin)
│   │   └── task.controller.js    # Task controllers (Thin)
│   ├── middleware/
│   │   ├── auth.middleware.js           # JWT verification
│   │   ├── error.middleware.js          # Centralized error handler
│   │   ├── rateLimiter.middleware.js     # Throttling limiters
│   │   └── validation.middleware.js     # Express-validator runner
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Task.js               # Rich Task schema with drag-and-drop support
│   │   └── Activity.js           # Activity log schema
│   ├── routes/
│   │   ├── index.js              # Router aggregator (Health & Version)
│   │   ├── auth.routes.js        # Auth routing
│   │   └── task.routes.js        # Task routing
│   ├── services/
│   │   ├── auth.service.js       # Auth business logic
│   │   └── task.service.js       # Task CRUD, search, & aggregations
│   ├── utils/
│   │   ├── apiResponse.js        # Unified JSON formatter
│   │   ├── appError.js           # Custom AppError classes
│   │   └── catchAsync.js         # Async error wrapper
│   ├── validators/
│   │   ├── auth.validator.js     # Auth input schemas
│   │   └── task.validator.js     # Task input schemas
│   ├── app.js                    # Express app initialization
│   └── server.js                 # Server entry point
│
├── docs/
│   └── openapi.yaml              # Swagger / OpenAPI Specification
├── tests/
│   ├── integration/
│   │   └── task.test.js          # Integration test template
│   └── setup.js                  # Test database & server setup
│
├── .env                          # Local environment variables
├── .env.example                  # Environmental variables template
├── package.json                  # Project dependencies
└── README.md                     # Setup, testing, and deployment guide
```

---

## 🔒 Security & Performance

* **Helmet & CORS**: Protects headers and restricts cross-origin access.
* **Rate Limiting**: Throttles global requests (100 per 15 min) and restricts authentication attempts (10 per 15 min).
* **Compression**: Gzip compression via `compression` to minimize payload sizes.
* **Winston Logger**: Logs HTTP requests, warnings, errors, and lifecycle events.
* **MongoDB Indexing**:
  * Compound index on `{ createdBy: 1, status: 1, priority: 1 }` for fast dashboard queries.
  * Text index on `{ title: "text", description: "text" }` for search.
  * Index on `{ position: 1 }` to support smooth Kanban drag-and-drop reordering.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Default |
|---|---|---|
| `PORT` | The port the Express server listens on. | `5050` |
| `NODE_ENV` | Mode of operation (`development` or `production`). | `development` |
| `MONGO_URI` | MongoDB connection string. | `mongodb://localhost:27017/momentum` |
| `JWT_SECRET` | Secret key for signing JWT tokens. | *Required* |
| `CLIENT_URL` | Frontend URL allowed by CORS. | `http://localhost:3222` |

---

## 🚀 Installation & Setup

1. Install npm packages:
   ```bash
   cd backend
   npm install
   ```

2. Start the local development server (with hot-reloading):
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5050`.

---

## 🌐 API Endpoint Directory

### Health & Metadata
* `GET /health` - Database status & system uptime.
* `GET /version` - App version and environment.

### Authentication (`/api/v1/auth`)
* `POST /register` - Registers a new user.
* `POST /login` - Login, returns access token.
* `GET /me` - Retrieves current user profile.
* `PUT /me` - Updates user profile details.

### Tasks (`/api/v1/tasks`)
* `GET /` - List tasks (supports pagination, search, status, priority, category, favorite, labels, and calendar date parameters `month` & `year`).
* `POST /` - Creates a new task.
* `GET /:id` - Retrieves a single task.
* `PUT /:id` - Updates a task.
* `DELETE /:id` - Soft deletes a task.
* `PATCH /:id/status` - Updates a task's status.
* `PATCH /reorder` - Reorders multiple task positions (Kanban drag-and-drop).

### Core Aggregations & Activity
* `GET /api/v1/dashboard` - Returns total, completed, pending, overdue metrics, completion rate, priority/status breakdowns, today's tasks, upcoming tasks, and recent activity logs in a single query.
* `GET /api/v1/activity` - Returns recent task action history logs.
* `GET /api/v1/search?q=` - Searches title, description, category, and labels, returning ranked results.
