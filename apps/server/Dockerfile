FROM oven/bun:1.2-alpine AS base
WORKDIR /usr/src/app

# Copy package dependency descriptors to cache install step
COPY package.json bun.lock turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/schema/package.json ./packages/schema/
COPY apps/api/package.json ./apps/api/

# Install dependencies (workspaces resolved by Bun)
RUN bun install --frozen-lockfile

# Copy source directories
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY packages/schema ./packages/schema
COPY apps/api ./apps/api

EXPOSE 3001
ENV PORT=3001

CMD ["bun", "run", "--cwd", "apps/api", "start"]
