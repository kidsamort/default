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

# Next.js build-time environment setup
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Run Next.js production compilation
RUN bun run --cwd apps/web build

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "--cwd", "apps/web", "start"]
