# ---- Base Stage ----
FROM node:22-alpine AS base

# Declare build-time arguments
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_IPDATA_API_KEY
# Add more ARGs if you have other NEXT_PUBLIC_* vars

# Set them as environment variables (default values in base)
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL
ENV NEXT_PUBLIC_IPDATA_API_KEY=$NEXT_PUBLIC_IPDATA_API_KEY

# ---- Dependencies Stage ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Builder Stage ----
FROM base AS builder
WORKDIR /app

# Re-declare ARGs (they don’t carry over automatically)
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_IPDATA_API_KEY

# Set them as ENV so Next.js can access them at build time
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL
ENV NEXT_PUBLIC_IPDATA_API_KEY=$NEXT_PUBLIC_IPDATA_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uncomment to disable Next.js telemetry
# ENV NEXT_TELEMETRY_DISABLED=1

RUN echo "Building with NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL" && \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Runner Stage ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Re-declare ARGs if you want them available at runtime
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_IPDATA_API_KEY

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL
ENV NEXT_PUBLIC_IPDATA_API_KEY=$NEXT_PUBLIC_IPDATA_API_KEY

# Uncomment to disable Next.js telemetry at runtime
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy Next.js standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by Next.js standalone output
CMD ["node", "server.js"]
