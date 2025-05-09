# Stage 1: Build
FROM node:22.14.0-alpine3.21 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Генерация сертификатов (скрипт должен быть прописан в package.json)
RUN npm run cert:create:jwt

RUN npm run build

# Stage 2: Runtime
FROM node:22.14.0-alpine3.21

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config/cert ./config/cert
COPY --from=builder /app/prisma ./prisma

EXPOSE 3033

CMD ["node", "dist/main.js"]