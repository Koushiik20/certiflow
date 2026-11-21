FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

COPY src ./src

# If PostgreSQL schema is needed in build, support both
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads/certificates

EXPOSE 5000

# Auto-detect database provider based on DATABASE_URL
CMD ["sh", "-c", "if echo \"$DATABASE_URL\" | grep -q '^postgres'; then cp prisma/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate; fi && npx prisma db push && npx ts-node prisma/seed.ts && node dist/index.js"]

