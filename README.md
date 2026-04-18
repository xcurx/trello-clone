# Trello Clone

A Kanban-style project management app inspired by Trello.

## Tech Stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4
- Drag and drop: dnd-kit
- API layer: Next.js Route Handlers
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- File storage: Supabase Storage
- Utilities: date-fns, lucide-react, clsx, tailwind-merge
- Formatting and linting: Biome

## Core Features

- Boards, lists, and cards management
- Drag and drop for lists and cards
- Card details modal
- Labels, members, due date, checklist, comments
- Card covers and board backgrounds (color and image)
- Card attachments
- Board search and starring

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database
- Supabase project (for file storage)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a local `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_STORAGE_BUCKET="trello"
```

Notes:

- `SUPABASE_URL` can be used as an alternative to `NEXT_PUBLIC_SUPABASE_URL`.
- The storage bucket should be public if you want direct public URLs for uploaded files.

### 3. Generate Prisma client and prepare database

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 4. Start development server

```bash
pnpm dev
```

Open http://localhost:3000

## Useful Scripts

- `pnpm dev` - start development server
- `pnpm dev:clean` - clear `.next` and start dev server
- `pnpm build` - production build
- `pnpm start` - run production server
- `pnpm lint` - run Biome checks
- `pnpm format` - format code with Biome
- `pnpm db:generate` - generate Prisma client
- `pnpm db:push` - push Prisma schema to database
- `pnpm db:migrate` - run Prisma migrate dev
- `pnpm db:seed` - seed sample data
- `pnpm db:studio` - open Prisma Studio

## Deployment Notes (Vercel)

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Required environment variables:
	- `DATABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `SUPABASE_STORAGE_BUCKET`

## Assumptions Made

- Authentication is not implemented. A default seeded user is treated as logged in.
- The default user id is `default-user`.
- One shared workspace context is used for seeded/demo flows.
- Supabase bucket is expected to exist before uploads.
- Uploaded files are stored in Supabase and served via public URL.
- Database schema setup in local/dev is done via `pnpm db:push`.
