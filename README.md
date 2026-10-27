# TaskFlow — Modern Full-Stack Task Manager

A clean, responsive, and production-grade full-stack task management website designed to help individuals and teams organize daily priorities with ease. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL** for persistent, real-time-ready database storage.

---

## 1. Project Overview

TaskFlow delivers a seamless task management experience with a real backend and persistent database. Unlike frontend-only demos or applications with volatile in-memory storage, TaskFlow connects directly to a Supabase PostgreSQL instance. All task creations, updates, completions, and deletions persist across page refreshes and application deployments.

---

## 2. Features

- **Add Tasks**: Quickly record tasks with a required title and optional detailed description.
- **View All Tasks**: Comprehensive dashboard with live task list and timestamp indicators.
- **Toggle Status**: Instantly switch tasks between Pending and Completed with optimistic UI updates.
- **Edit Tasks**: Update task titles and descriptions in-place via an accessible modal dialog.
- **Delete Tasks**: Remove tasks with safety confirmation prompts.
- **Live Counter Cards**: Real-time summary metrics showing:
  - Total Tasks count
  - Completed Tasks count with completion percentage bar
  - Pending Tasks count
- **Search & Filtering**:
  - Full-text search across titles and descriptions
  - Filter by status tabs: `All`, `Pending`, `Completed`
  - Sort by `Newest First`, `Oldest First`, or `Alphabetical`
- **Responsive Design**: Polished user experience across mobile phones, tablets, and wide-screen desktops.
- **Feedback & Notifications**: Floating toast notifications for every user action, error states, and empty state guides.

---

## 3. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (v16 App Router) | Server and Client Components, fast rendering, Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end static typing for robust development |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (v4) | Utility-first, responsive, and accessible styling |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icons |
| **Backend API** | Next.js Route Handlers | RESTful API endpoints with server-side validation |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Managed PostgreSQL with Row Level Security (RLS) |
| **Testing** | Node.js Test Runner | Automated validation, schema, and API tests |
| **Deployment** | [Vercel](https://vercel.com/) | Global edge hosting with automated CI/CD |
| **Version Control** | Git & GitHub | Source control and release tracking |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   (Next.js App Router: React 19 Client & Server Components)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Route Handlers                   │
│   • GET    /api/tasks        • PATCH  /api/tasks/[id]       │
│   • POST   /api/tasks        • DELETE /api/tasks/[id]       │
│   • GET    /api/tasks/[id]                                  │
│   [Server-Side Input Validation, Sanitization, Error Handling]│
└──────────────────────────────┬──────────────────────────────┘
                               │ Supabase JS Client / HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                      │
│   • Table: public.tasks (UUID, title, description, status)  │
│   • Indexes: idx_tasks_created_at, idx_tasks_is_completed   │
│   • Triggers: handle_updated_at                             │
│   • Policies: Row Level Security (RLS)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Application Screenshots

> *Add application screenshots below to showcase the user interface in your repository:*

### Desktop Dashboard
```markdown
![TaskFlow Desktop Dashboard](./public/screenshots/desktop-dashboard.png)
```
*(To capture: Open the live application on desktop, take a screenshot of the main dashboard with sample tasks, and save to `public/screenshots/desktop-dashboard.png`)*

### Mobile View
```markdown
![TaskFlow Mobile Responsive View](./public/screenshots/mobile-view.png)
```
*(To capture: Open DevTools in device emulation mode (iPhone / Pixel), capture full page, and save to `public/screenshots/mobile-view.png`)*

### Task Edit Modal
```markdown
![TaskFlow Edit Modal](./public/screenshots/edit-modal.png)
```
*(To capture: Click the "Edit" button on any task card and capture the modal dialog)*

---

## 6. Live Vercel Deployment URL

- **Production URL**: Deployment in progress / available upon Vercel link configuration.
- **Status**: Ready for production deployment on Vercel.

---

## 7. GitHub Repository URL

- **Repository**: [https://github.com/N-SAICHARAN-18/task-manager-fullstack](https://github.com/N-SAICHARAN-18/task-manager-fullstack)
- **Default Branch**: `main`

---

## 8. Prerequisites

Ensure you have the following installed locally:
- **Node.js**: v20.x or v22.x LTS ([Download Node.js](https://nodejs.org/))
- **npm**: v10.x or higher (bundled with Node.js)
- **Git**: Installed and configured ([Download Git](https://git-scm.com/))
- A free [Supabase](https://supabase.com/) account
- A free [Vercel](https://vercel.com/) account

---

## 9. Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/N-SAICHARAN-18/task-manager-fullstack.git
   cd task-manager-fullstack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 10. Environment Variable Configuration

Create a local environment file `.env.local` by copying the template:

```bash
cp .env.example .env.local
```

Fill in your Supabase connection parameters:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
# Optional: Service Role key if elevated server operations are needed
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

> **Security Note:** Never commit `.env.local` or real API keys to version control. The `.gitignore` file is pre-configured to exclude sensitive environment files.

---

## 11. Supabase Project Creation and Database Setup

1. **Create a Supabase Project:**
   - Log in to [database.new](https://database.new) or [supabase.com](https://supabase.com).
   - Click **New project**, choose an organization, set a project name (e.g. `task-manager`), and set a strong database password.
   - Choose the region nearest to your target users and click **Create new project**.

2. **Run the Database Setup Script:**
   - In your Supabase dashboard, open the **SQL Editor** from the left navigation bar.
   - Click **New query**.
   - Copy and paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) into the editor.
   - Click **Run** (or press `Ctrl + Enter`).
   - The query creates:
     - The `public.tasks` table
     - Automatic `updated_at` trigger
     - Performance indexes on `created_at` and `is_completed`
     - Row Level Security (RLS) policies allowing read/write operations
     - Default starter seed tasks

3. **Retrieve API Credentials:**
   - Go to **Project Settings** -> **API** (or **Data API**).
   - Copy the **Project URL** -> set as `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy the **anon (public)** key -> set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 12. Local Development Commands

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will hot-reload automatically as you edit files.

---

## 13. API Endpoint Documentation

All endpoints return JSON responses with appropriate HTTP status codes.

### 1. Retrieve All Tasks
- **Endpoint**: `GET /api/tasks`
- **Description**: Returns all tasks ordered by `created_at DESC`.
- **Response `200 OK`**:
  ```json
  {
    "tasks": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Complete project documentation",
        "description": "Write comprehensive README and API docs",
        "is_completed": false,
        "created_at": "2026-10-27T14:00:00Z",
        "updated_at": "2026-10-27T14:00:00Z"
      }
    ],
    "count": 1,
    "configured": true
  }
  ```

### 2. Create a Task
- **Endpoint**: `POST /api/tasks`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "Deploy to Vercel",
    "description": "Configure environment variables and push to main"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Task created successfully",
    "task": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "title": "Deploy to Vercel",
      "description": "Configure environment variables and push to main",
      "is_completed": false,
      "created_at": "2026-10-27T14:10:00Z",
      "updated_at": "2026-10-27T14:10:00Z"
    }
  }
  ```
- **Error Response `400 Bad Request`**:
  ```json
  {
    "error": "Task title is required and cannot be empty."
  }
  ```

### 3. Retrieve Individual Task
- **Endpoint**: `GET /api/tasks/[id]`
- **Response `200 OK`**:
  ```json
  {
    "task": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Complete project documentation",
      "description": "Write comprehensive README",
      "is_completed": false,
      "created_at": "2026-10-27T14:00:00Z",
      "updated_at": "2026-10-27T14:00:00Z"
    }
  }
  ```
- **Error Response `404 Not Found`**:
  ```json
  {
    "error": "Task with ID \"...\" was not found."
  }
  ```

### 4. Update a Task
- **Endpoint**: `PATCH /api/tasks/[id]`
- **Headers**: `Content-Type: application/json`
- **Request Body** (partial updates accepted):
  ```json
  {
    "is_completed": true
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Task updated successfully",
    "task": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Complete project documentation",
      "description": "Write comprehensive README",
      "is_completed": true,
      "created_at": "2026-10-27T14:00:00Z",
      "updated_at": "2026-10-27T14:15:00Z"
    }
  }
  ```

### 5. Delete a Task
- **Endpoint**: `DELETE /api/tasks/[id]`
- **Response `200 OK`**:
  ```json
  {
    "message": "Task deleted successfully",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```

---

## 14. Testing and Production Build Commands

### Run Automated Tests
```bash
npm test
```
Executes the test suite checking API validation logic, database SQL schema integrity, and environment configuration templates.

### Run Code Linter
```bash
npm run lint
```
Checks for ESLint rule compliance and code quality.

### Build Production Bundle
```bash
npm run build
```
Creates an optimized production bundle with TypeScript type-checking and Turbopack asset optimization.

### Run Production Server Locally
```bash
npm start
```
Launches the built application on [http://localhost:3000](http://localhost:3000).

---

## 15. Vercel Deployment Instructions

### Method A: Deploy via Vercel Dashboard (Recommended)
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the `task-manager-fullstack` repository.
4. Keep the Framework Preset as **Next.js**.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase Anon API Key
6. Click **Deploy**. Vercel will build and assign a live production URL (e.g. `https://task-manager-fullstack.vercel.app`).

### Method B: Deploy via Vercel CLI
```bash
# 1. Login to Vercel
vercel login

# 2. Link and deploy
vercel

# 3. Add production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Deploy to production
vercel --prod
```

---

## 16. Project Folder Structure

```
task-manager-fullstack/
├── .env.example               # Environment variables template
├── .gitignore                 # Excludes secrets, node_modules, and build files
├── AGENTS.md                  # Next.js agents reference guide
├── next.config.ts             # Next.js compiler and feature flags
├── package.json               # Dependencies and npm script definitions
├── tsconfig.json              # TypeScript compiler configuration
├── public/                    # Static assets
│   ├── favicon.ico
│   └── screenshots/           # Application screenshots
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts          # GET /api/tasks & POST /api/tasks
│   │   │       └── [id]/
│   │   │           └── route.ts      # GET, PATCH, DELETE /api/tasks/[id]
│   │   ├── globals.css        # Global CSS & Tailwind imports
│   │   ├── layout.tsx         # Root HTML layout and metadata
│   │   └── page.tsx           # Full Task Manager dashboard page
│   └── lib/
│       └── supabase.ts        # Supabase client singleton & TypeScript models
├── supabase/
│   └── schema.sql             # PostgreSQL schema, RLS policies & seed data
└── tests/
    └── api-validation.test.mjs # Automated unit and validation test suite
```

---

## 17. Security Considerations

- **No Secrets in Source Code**: Credentials (`.env.local`) are strictly git-ignored and never committed.
- **Server-Side Validation**: All incoming task titles are validated and sanitized on the server before insertion. Empty or oversized titles (> 255 characters) are rejected with HTTP 400.
- **Row Level Security (RLS)**: PostgreSQL tables in Supabase enforce security policies at the database layer.
- **Safe Database IDs**: Uses standard UUIDs (`gen_random_uuid()`) to prevent predictable ID enumeration attacks.
- **Client Sanitization**: UI sanitizes and trims user inputs prior to submission.

---

## 18. Common Errors and Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **"Database not configured" banner** | Missing Supabase environment variables | Create `.env.local` and add valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| **"relation public.tasks does not exist"** | SQL schema has not been executed | Open Supabase SQL Editor and run `supabase/schema.sql`. |
| **CORS error on API requests** | Calling external domains directly | Use the built-in Next.js `/api/tasks` route handlers which run server-to-server. |
| **Build fails on date evaluation** | Reading dynamic client dates during prerender | Use `React.useSyncExternalStore` or client-side `useEffect` for runtime date formatting. |
| **Changes not reflected after deploy** | Environment variables not set in Vercel | Add the variables in Vercel Project Settings -> Environment Variables and redeploy. |

---

## 19. Future Improvements

- [ ] **User Authentication**: Add Supabase Auth (Email, GitHub, Google OAuth) for multi-tenant private task lists.
- [ ] **Due Dates & Reminders**: Calendar picker with deadline alerts and overdue highlights.
- [ ] **Task Categories & Tags**: Color-coded category tags (e.g. `Work`, `Personal`, `Urgent`).
- [ ] **Drag & Drop Reordering**: Reorder tasks using `@dnd-kit` or Framer Motion.
- [ ] **Dark Mode Toggle**: Persistent theme switcher with system preference detection.

---

## 20. License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial use.
