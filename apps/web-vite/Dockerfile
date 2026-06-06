FROM oven/bun:1.2-alpine AS base
WORKDIR /usr/src/app

# Copy package dependency descriptors to cache install step
COPY package.json bun.lock turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/schema/package.json ./packages/schema/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source directories
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY packages/schema ./packages/schema
COPY apps/web ./apps/web

# Set production env for build
ENV NODE_ENV=production

# Run Vite production build (compiles to apps/web/dist)
RUN bun run --cwd apps/web build

EXPOSE 3000
ENV PORT=3000

# Serve static directory using sirv-cli
CMD ["bun", "run", "--cwd", "apps/web", "start"]
