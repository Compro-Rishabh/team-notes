# Team Notes — Daily Standup Management App

A modern, production-ready full-stack Daily Standup Management web application built with React 19, Firebase, and deployable on Vercel. Designed for teams to track daily standups, manage members, and collaborate efficiently.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)

---

## Features

- **Google OAuth Login** — Secure authentication via Google sign-in
- **Team Member Management** — Add, edit, activate/deactivate, and remove team members
- **Daily Standup Tracking** — Track tasks per member with checklist-style bullet items
- **Date Navigation** — Browse standups by date with a date picker
- **Auto-Save** — Changes are debounced and auto-saved to Firestore
- **Keyboard Shortcuts** — `Ctrl+S` to save, `Ctrl+Shift+E` to expand all, `Ctrl+Shift+C` to collapse all
- **Search & Filter** — Search standups by member name, email, or task content
- **Progress Tracking** — Visual progress bar showing task completion
- **Drag & Drop** — Reorder tasks with `@dnd-kit`
- **Responsive UI** — Animated, mobile-friendly interface with Framer Motion transitions
- **Expand/Collapse All** — Quickly toggle visibility of all standup cards

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Zustand |
| **Database** | Firebase Firestore |
| **Authentication** | Google OAuth 2.0 (`@react-oauth/google`) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Drag & Drop** | @dnd-kit |
| **Routing** | React Router v7 |
| **Notifications** | React Hot Toast |
| **Deployment** | Vercel |
| **Alternate Backend** | Google Apps Script + Google Sheets |

---

## Project Structure

```
team-notes/
├── public/                  # Static assets
├── backend/
│   └── google-apps-script.js  # Alternative Google Sheets backend
├── src/
│   ├── animations/          # Framer Motion animation variants
│   ├── components/          # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── BulletList.tsx
│   │   ├── Button.tsx
│   │   ├── DatePicker.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SaveIndicator.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StandupCard.tsx
│   │   └── TeamManagement.tsx
│   ├── hooks/               # Custom React hooks (auto-save, keyboard shortcuts)
│   ├── layouts/             # App layout wrapper
│   ├── pages/               # Route pages (Dashboard, Login)
│   ├── services/            # API layer & Firebase config
│   ├── store/               # Zustand global state
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions (date helpers, ID generation)
│   ├── App.tsx              # Root component with routing
│   └── main.tsx             # Entry point
├── vite.config.ts
├── vercel.json              # Vercel deployment config with SPA rewrites
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled
- A Google Cloud OAuth 2.0 Client ID

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd team-notes

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Firestore** in the Firebase console
3. Create two collections: `members` and `standups`
4. Set up Firestore security rules appropriate for your team
5. Copy your Firebase config values into the `.env` file

### Firestore Data Model

**Members Collection** (`members`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Member display name |
| `email` | string | Member email |
| `active` | boolean | Whether the member is active |
| `createdAt` | string | ISO timestamp |

**Standups Collection** (`standups`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `date` | string | Date in `YYYY-MM-DD` format |
| `memberId` | string | Reference to member |
| `section` | string | `todo` / `yesterday` / `today` / `blockers` / `notes` |
| `bulletText` | string | Task/note text content |
| `isMarked` | boolean | Completion status |
| `order` | number | Sort order within section |
| `updatedAt` | string | ISO timestamp |

---

## Alternative Backend (Google Apps Script)

An alternative backend using Google Sheets is available in `backend/google-apps-script.js`.

### Setup

1. Create a new Google Sheet with two sheets: **Members** and **Standups**
2. Add headers to Members: `id, name, email, active, createdAt`
3. Add headers to Standups: `id, date, memberId, section, bulletText, order, updatedAt`
4. Open **Extensions > Apps Script** and paste the code
5. Deploy as a Web App (Execute as: Me, Access: Anyone)
6. Use the deployment URL as your API endpoint

---

## Deployment (Vercel)

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Add the environment variables in the Vercel dashboard
4. Deploy — the `vercel.json` handles SPA routing and security headers

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + S` | Save standups |
| `Ctrl/⌘ + Shift + E` | Expand all members |
| `Ctrl/⌘ + Shift + C` | Collapse all members |

---

## License

This project is private and not licensed for public distribution.
- **State Management:** Zustand
- **Backend API:** Google Apps Script
- **Storage:** Google Sheets
- **Authentication:** Google OAuth
- **Deployment:** Vercel

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `VITE_API_URL` - Your deployed Google Apps Script URL

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:5173` and your Vercel domain to Authorized JavaScript origins
6. Copy the Client ID to your `.env`

### 4. Google Sheets Backend Setup

1. Create a new [Google Sheet](https://sheets.google.com)
2. Create two sheets named **"Members"** and **"Standups"**
3. Add headers to **Members** sheet (Row 1): `id | name | email | active | createdAt`
4. Add headers to **Standups** sheet (Row 1): `id | date | memberId | section | bulletText | order | updatedAt`
5. Go to **Extensions > Apps Script**
6. Paste the code from `backend/google-apps-script.js`
7. Replace `YOUR_SPREADSHEET_ID` with your Sheet's ID (from the URL)
8. Deploy: **Deploy > New Deployment > Web App**
   - Execute as: Me
   - Who has access: Anyone
9. Copy the deployment URL to your `.env` as `VITE_API_URL`

### 5. Run Development Server

```bash
npm run dev
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

The `vercel.json` is already configured for SPA routing.

## Project Structure

```
src/
├── animations/     # Framer motion animation configs
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── layouts/        # Page layouts
├── pages/          # Route pages
├── services/       # API service layer
├── store/          # Zustand state management
├── types/          # TypeScript types
└── utils/          # Utility functions

backend/
└── google-apps-script.js  # Google Apps Script backend code
```

## Features

- **Daily Standup Dashboard** - Expandable cards for each team member
- **Bullet-based Notes** - Notion-like editing (Enter to add, Backspace to remove)
- **Sections** - Yesterday, Today, Blockers, Additional Notes
- **Team Management** - Add/edit/remove members with active toggle
- **Auto-save** - Debounced saving with visual indicator
- **Duplicate Previous Day** - Quick copy of yesterday's notes
- **Progress Tracking** - Team completion stats and blocker count
- **Keyboard Shortcuts** - Ctrl+S save, Ctrl+Shift+E expand, Ctrl+Shift+C collapse
- **Google Auth** - Secure login with session persistence
- **Mobile Responsive** - Works on all screen sizes
- **Modern UI** - Glass effects, smooth animations, premium aesthetic

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save all standups |
| `Ctrl+Shift+E` | Expand all cards |
| `Ctrl+Shift+C` | Collapse all cards |
| `Enter` | Add new bullet point |
| `Backspace` (empty) | Remove bullet point |
| `↑/↓` | Navigate between bullets |
