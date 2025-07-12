# Stage 1: Build
FROM node:22.17.0-alpine3.21 AS builder

WORKDIR /app

RUN apk add --no-cache openssl

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

ARG SENTRY_DSN
ENV SENTRY_DSN=${SENTRY_DSN}

COPY package*.json ./
RUN npm ci

COPY . .

# Генерация сертификатов
RUN npm run cert:create:jwt:prod

# Генерация клиента Prisma
RUN npm run prisma:generate

# Билд
RUN npm run build


# Stage 2: Runtime
FROM node:22.17.0-alpine3.21

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config/cert ./config/cert
COPY --from=builder /app/prisma ./prisma

EXPOSE 3033

CMD ["node", "./dist/src/main.js"]