# {{PROJECT_NAME}}

Monorepo template powered by Turborepo + Bun with a modern full-stack setup.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Run development server
bun run dev
```

## 📦 Stack

- **Monorepo:** Turborepo + Bun workspaces
- **Frontend:** Next.js 16 + React 19 + Radix UI + Framer Motion
- **Backend:** Elysia (Bun native) + TypeBox
- **Database:** PostgreSQL + Drizzle ORM
- **Tooling:** Biome (lint/format), TypeScript project references

## 📁 Structure

```
├── apps/
│   ├── web/          # Next.js application (port 3000)
│   ├── api/          # Elysia API server (port 3001)
│   ├── docs/         # Documentation (optional)
│   └── storybook/    # Component documentation (optional)
├── packages/
│   ├── ui/           # Shared React components
│   ├── schema/       # TypeBox schemas (shared validation)
│   ├── db/           # Database schema & Drizzle config
│   └── config/       # Shared TypeScript configs
└── scripts/
    └── init.ts       # Interactive project initializer
```

## 🛠 Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps and packages |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bun run clean` | Kill dev servers on ports 3000-3002 |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:push` | Push schema to database |

## 🔧 Customization

Run the interactive initializer to customize your project:

```bash
bun run init
```

This will let you:
- Choose which apps to include (web, api, docs, storybook)
- Choose which packages to include (ui, schema, db, config)
- Select database type (PostgreSQL, SQLite, or none)
- Set custom project name and org prefix

## 📝 Environment Variables

See `.env.example` for required variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# API
PORT=3001

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 🎯 Using as a Template

### Option 1: Copy the directory

```bash
cp -r /path/to/default /path/to/new-project
cd /path/to/new-project
bun run init
```

### Option 2: Git clone

```bash
git clone <template-repo-url> new-project
cd new-project
rm -rf .git
git init
bun run init
```

## 📄 License

MIT
