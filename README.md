# Daily Standup Management App

A modern, production-ready full-stack Daily Standup Management web application built with React and deployable on Vercel.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** lucide-react
- **Animations:** framer-motion
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
