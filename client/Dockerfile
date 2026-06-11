FROM node:22-bookworm AS deps
WORKDIR /app/client
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm AS builder
WORKDIR /app/client
COPY --from=deps /app/client/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm AS runner
WORKDIR /app/client
ENV NODE_ENV=production
COPY --from=builder /app/client/node_modules ./node_modules
COPY --from=builder /app/client/.next ./.next
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/client/next.config.js ./next.config.js

EXPOSE 3000
CMD ["npm", "run", "start"]
