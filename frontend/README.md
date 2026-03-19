# 🚀 TaskForge — SaaS Project Management Platform

TaskForge is a modern SaaS project management platform designed to help teams collaborate, organize projects, and manage work efficiently.

The platform provides a workspace-based collaboration environment where teams can create projects, manage tasks, track progress, communicate in real time, and monitor activity across their organization.

TaskForge is built using a scalable full-stack architecture with modern technologies such as Node.js, Express, MongoDB, Next.js, and WebSockets, providing a fast and production-ready collaboration system.

🧠 Key Features

TaskForge provides a complete collaboration environment for teams.

Core Platform Features

🏢 Multi-Workspace SaaS Architecture

📊 Workspace Dashboard

📁 Project Management

📋 Task Management System

🗂 Kanban Drag & Drop Board

📅 Calendar Task Scheduling

👥 Team & Role Management

🔔 Real-Time Notifications

📜 Activity Timeline & Logs

💬 Workspace Chat System

📎 File Attachments

🔎 Global Search System

💳 Billing & Usage Overview

🏗 System Architecture

The platform follows a hierarchical collaboration model.

User
 ↓
Workspace
 ↓
Project
 ↓
Tasks
 ↓
Subtasks
 ↓
Comments

Additional system modules:

Notifications

Activity Logs

Chat System

Global Search

Billing System

📊 Dashboard

The dashboard acts as the central productivity hub of the platform.

Features

Workspace overview

Project statistics

Task progress tracking

Recent activity feed

Quick navigation shortcuts

Productivity insights

📁 Project Management

Projects organize collaborative work inside workspaces.

Features

Create projects

Update project details

Delete projects

Assign project members

Track project progress

📋 Task Management

Tasks represent units of work within projects.

Features

Create tasks

Assign tasks

Update task details

Delete tasks

Attach files

Track status

Task Workflow
TODO → IN_PROGRESS → DONE

Each task includes:

Assignee

Creator

Attachments

Status

Timestamps

🗂 Kanban Board

The Kanban board allows teams to manage tasks visually.

Features

Drag & drop tasks

Status based workflow

Visual progress tracking

Quick task updates

📅 Calendar Task Scheduling

TaskForge includes a calendar view for deadline management.

Features

Monthly calendar layout

View tasks by due date

Navigate between months

Click task to open details

Deadline visualization

👥 Team Management

Workspace teams support role-based access control.

Roles
Role	Description
Owner	Full workspace control
Admin	Manage members & projects
Member	Work on projects
Viewer	Read-only access
Features

Invite members

Change roles

Remove members

Pending invite management

🔔 Notification System

A full notification system keeps users informed about important events.

Triggers

Task assignments

Comments

Mentions

System events

Features

Read / unread notifications

Real-time delivery

Notification metadata

📜 Activity Logging

All major actions are recorded in an activity timeline.

Examples:

Workspace created

Project created

Task updated

Member role changed

Comment added

This provides a complete audit trail for collaboration.

💬 Real-Time Communication

The platform supports real-time collaboration using WebSockets.

Features

Workspace chat

Project discussions

Instant updates

Live collaboration

🔎 Global Search

Global search allows users to quickly find information across the platform.

Entity	Search Fields
Tasks	title, description
Projects	name, description
Members	username, email
💳 Billing System (v1)

The billing system currently supports usage tracking and plan overview.

Features

Workspace plan overview

Member usage tracking

Usage limits

Upgrade plan placeholder

Payment method UI

Future versions will include full payment integration.

🛠 Tech Stack
Backend

Node.js

Express.js

MongoDB

Mongoose

Socket.IO

JWT Authentication

Multer (File Upload)

Frontend

Next.js 14

TypeScript

TailwindCSS

React Hooks

Axios

React Hot Toast

📂 Project Structure
taskforge
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── middlewares
│   ├── utils
│   └── server.js
│
├── frontend
│   ├── app
│   ├── components
│   ├── services
│   ├── lib
│   └── styles
│
└── README.md

🔐 Security Features

Security protections implemented:

JWT authentication

Role-based authorization

Rate limiting

MongoDB query sanitization

Secure file uploads

HTTP header protection

📸 Screenshots 

You can add screenshots of:

Dashboard

Kanban board

Task page

Calendar view

Workspace settings

Example:

![Dashboard](./screenshots/dashboard.png)
🚀 Future Improvements

Planned enhancements include:

Advanced analytics dashboard

AI productivity assistant

Mobile responsive improvements

Advanced reporting system

Payment gateway integration

Workspace templates

👨‍💻 Author

Yash Redkar

Full Stack Developer
Node.js | Express | MongoDB | Next.js | SaaS Architecture