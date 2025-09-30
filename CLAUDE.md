# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

v0.diy is an open-source clone of v0.dev that enables AI-powered React component generation using natural language. It's built with Next.js 15, React 19, and integrates with the v0 SDK for AI functionality.

## Development Commands

```bash
# Development
pnpm dev                 # Start dev server with Turbopack
pnpm build              # Run migrations and build for production
pnpm start              # Start production server

# Database
pnpm db:generate        # Generate migration files from schema changes
pnpm db:migrate         # Apply pending migrations to database
pnpm db:studio          # Open Drizzle Studio for database inspection
pnpm db:push            # Push schema changes directly to database

# Code Quality
pnpm lint               # Run Biome linter
pnpm lint:fix           # Fix auto-fixable lint issues
pnpm format             # Format code with Biome
pnpm check              # Run all checks (lint + format)
pnpm check:fix          # Fix all auto-fixable issues
```

## Required Environment Variables

```bash
V0_API_KEY=v0_sk_...                                    # v0.dev API key from https://v0.dev/chat/settings/keys
AUTH_SECRET=your-secret-here                            # Generate with: openssl rand -base64 32
POSTGRES_URL=postgresql://user:pass@localhost:5432/db  # PostgreSQL connection string
```

Optional:
```bash
V0_API_URL=custom-url   # Custom v0 API base URL (defaults to v0.dev)
```

## Architecture

### Authentication & Authorization

- **NextAuth.js** v5 (beta) handles authentication with credentials provider
- **Multi-tenant system**: Guest users, regular users, and anonymous (no session)
- **Middleware** (`middleware.ts`) protects routes and handles auth redirects
- **Session-based auth** with JWT tokens stored in cookies
- Auth configuration split between:
  - `app/(auth)/auth.config.ts` - NextAuth config (non-Node.js compatible)
  - `app/(auth)/auth.ts` - Full auth setup with bcrypt (Node.js only)

### Database Schema & Ownership Model

The app uses a **hybrid ownership model** where:
- Chat data lives in v0 API (accessed via v0-sdk)
- Ownership mappings are stored in local PostgreSQL database
- Database tables (`lib/db/schema.ts`):
  - `users` - User accounts with email/password
  - `chat_ownerships` - Maps v0 chat IDs to user IDs
  - `anonymous_chat_logs` - Tracks anonymous chats by IP for rate limiting

Database operations via Drizzle ORM:
- `lib/db/connection.ts` - Database connection setup
- `lib/db/queries.ts` - Query functions for chat ownership and user operations
- `lib/db/migrate.ts` - Migration runner

### Rate Limiting & Entitlements

Rate limits defined in `lib/entitlements.ts`:
- **Anonymous users**: 3 messages/day (tracked by IP)
- **Guest users**: 5 messages/day
- **Regular users**: 50 messages/day

Rate limiting enforced in `app/api/chat/route.ts` using:
- `getChatCountByUserId()` for authenticated users
- `getChatCountByIP()` for anonymous users

### API Architecture

Core API routes in `app/api/`:
- `chat/route.ts` - Main chat endpoint (POST) for creating/continuing chats
  - Handles both streaming (`experimental_stream`) and sync responses
  - Creates ownership mappings after chat creation
  - Implements rate limiting based on user type
- `chats/route.ts` - List all chats for authenticated user
- `chats/[chatId]/route.ts` - Get specific chat details
- `chats/[chatId]/visibility/route.ts` - Update chat visibility
- `chat/fork/route.ts` - Fork existing chat
- `chat/delete/route.ts` - Delete chat
- `chat/ownership/route.ts` - Manage chat ownership

### v0 SDK Integration

The app integrates v0 SDK for AI functionality:
- Client created in `app/api/chat/route.ts` with optional custom baseUrl
- Supports both streaming and non-streaming responses
- Uses `@v0-sdk/react` for React components
- Uses `@ai-sdk/react` for streaming UI patterns

### Component Structure

```
components/
├── ai-elements/         # v0 SDK UI components (conversation, code-block, etc.)
├── chat/                # Chat-related components
├── chats/               # Chats list components
├── home/                # Homepage components
├── providers/           # Context providers (auth, theme)
├── shared/              # Shared/reusable components
├── ui/                  # Base UI components (shadcn/ui style)
├── auth-form.tsx        # Login/register form
├── message-renderer.tsx # Renders chat messages with markdown
├── shared-components.tsx # Common components (sidebar, header, etc.)
├── theme-toggle.tsx     # Dark mode toggle
└── user-nav.tsx         # User navigation dropdown
```

### App Router Structure

```
app/
├── (auth)/              # Auth route group
│   ├── login/           # Login page
│   ├── register/        # Register page
│   └── auth.ts          # NextAuth setup
├── api/                 # API routes (see above)
├── chats/               # Chat pages
│   ├── [chatId]/        # Individual chat view
│   └── page.tsx         # Chats list page
├── globals.css          # Global styles with Tailwind
├── layout.tsx           # Root layout with providers
└── page.tsx             # Homepage (anonymous chat creation)
```

### Path Aliases

TypeScript path alias configured:
- `@/*` maps to project root

### Styling & Code Quality

- **Tailwind CSS 4** for styling with utility classes
- **Biome** for linting and formatting (replaces ESLint/Prettier)
  - Double quotes for strings
  - 2 space indentation
  - 80 character line width
  - Semicolons always required
  - Strict linting rules enabled
- **Geist font** for typography
- **next-themes** for dark mode support

### Error Handling

Custom error system in `lib/errors.ts`:
- `ChatSDKError` class for API errors
- Error codes for rate limits, permissions, etc.
- `.toResponse()` method for consistent error responses

### Environment Validation

`lib/env-check.ts` validates required environment variables:
- `checkRequiredEnvVars()` returns list of missing vars
- `hasAllRequiredEnvVars()` boolean check
- Used in `components/env-setup.tsx` to show setup UI when vars missing

## Working with Database

When modifying schema:
1. Edit `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply migration
4. For local dev, `pnpm db:push` can skip migration files

Migrations stored in `lib/db/migrations/` and auto-run during build.

## Testing Considerations

- Guest/anonymous users identified by email regex in `lib/constants.ts`
- `/ping` route available for health checks (used by Playwright)
- Development environment check via `isDevelopmentEnvironment` in `lib/constants.ts`