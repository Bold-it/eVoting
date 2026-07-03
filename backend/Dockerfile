FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Generate Prisma client for production
RUN npx prisma generate

# Copy built output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
