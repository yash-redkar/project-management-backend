# TeamForge Frontend 🎨

Frontend application for **TeamForge**, a full-stack SaaS project management platform.

This frontend handles the user interface for authentication, dashboard views, workspaces, projects, tasks, chat, notifications, activity tracking, search, and calendar-based task planning.

---

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Axios
- Framer Motion
- Recharts
- React Hot Toast
- Socket.IO Client
- @hello-pangea/dnd

---

## Frontend Responsibilities

- Authentication UI flow
- Protected dashboard and routing
- Workspace and project navigation
- Task creation and task details UI
- Subtasks, comments, and attachments UI
- Kanban board interface
- Notifications and activity pages
- Workspace chat and project chat UI
- Search / command palette
- Calendar task view
- Settings page UI

---

## Folder Structure

```bash
frontend/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── hooks/
│
├── public/
├── package.json
└── README.md
```

## Environment Setup

Create a .env.local file in the frontend folder based on .env.example.

### Example
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

## Notes

- The frontend uses a shared Axios client for API communication.
- Authentication requests use the backend API with credentials enabled.
- Realtime features are powered through Socket.IO client integration.
- Drag-and-drop task workflow is implemented using @hello-pangea/dnd.

## Current Status

### Completed

- Auth UI
- Dashboard UI
- Workspace flow
- Project flow
- Task flow
- Kanban board
- Search / command palette
- Notifications page
- Activity page
- Workspace chat
- Project chat
- Calendar page core UI

### In Progress

- Settings page polish
- Responsiveness improvements
- UI consistency cleanup

### Planned

- AI Assistant UI
- Billing page
- Theme switching


## 👨‍💻Author

**Yash Redkar**
