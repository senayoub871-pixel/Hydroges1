# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: Cookie-based session auth (bcryptjs + uuid)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── docexchange/        # DocExchange React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
└── package.json            # Root package with hoisted devDeps
```

## Application: DocExchange

Multi-company French-language document exchange platform for employees.

### Features
- **Multi-company support**: Company network number isolates each company's users and documents
- **Authentication**: Login with company network number + username + password
- **Registration**: Full employee profile with signature upload, company network number required
- **Dashboard**: Sidebar navigation with collapsible menu
- **Document Management**:
  - Create and send documents between employees
  - Upload file attachments
  - Add digital signature overlay
  - Validate documents (generates QR code)
  - Schedule document sends with date picker
  - Document statuses: draft, pending_validation, validated, sent, scheduled
- **Inbox sections**: List of docs, pending validation, sent, scheduled, inbox, drafts, project marketplace, complaints, settings

### Color Scheme
- Background: Light lavender/blue
- Primary: Deep purple (#311b92)
- Accents: Gold
- French language throughout

### Database Tables
- `users`: id, companyNetwork, firstName, lastName, jobTitle, department, email, username, passwordHash, signatureUrl
- `documents`: id, title, content, fileUrl, fileName, status, fromUserId, toUserId, hasSignature, qrCodeUrl, scheduledAt
- `sessions`: id, userId, token, expiresAt

### API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/users` - List users in same company network
- `POST /api/users/signature` - Upload signature
- `GET /api/documents?type=inbox|sent|pending_validation|drafts|scheduled` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/validate` - Validate document (generates QR code)
- `POST /api/documents/upload` - Upload file
- `GET /api/uploads/:filename` - Serve uploaded files

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
