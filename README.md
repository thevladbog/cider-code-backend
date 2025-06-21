<p align="center">
  <a href="https://github.com/thevladbog/cider-code-backend" target="blank"><img src="./public/img/BOTTLE-CODE-LOGO.png" width="600" alt="BOTTLE [CODE] Backend Logo" /></a>
</p>

# BOTTLE [CODE] Backend

## Description

Advanced NestJS backend for bottle code management system designed for tracking alcoholic beverage production, implementing comprehensive product lifecycle management, code generation, and production shift monitoring with external system integrations.

## Features

### 🏗️ Core Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with RS256 algorithm (dual-token system)
- **Validation**: Zod schemas with nestjs-zod integration
- **Documentation**: Swagger/OpenAPI with Scalar API reference
- **Logging**: Pino with Sentry integration for production monitoring
- **Testing**: Jest with comprehensive unit and integration tests

### 🔐 Authentication & Authorization

- **Dual Authentication System**:
  - **Users**: Email/password with httpOnly cookies (Admin, Supervisor, User, Guest roles)
  - **Operators**: Barcode-based authentication with Bearer tokens
- **JWT Security**: RS256 algorithm with separate public/private key pairs
- **Password Security**: Argon2 hashing with salt
- **Token Management**: Token revocation support and refresh capabilities
- **Password Recovery**: Email-based password reset with secure tokens

### 📦 Product Management

- **Product Lifecycle**: Complete GTIN/EAN code management
- **Alcohol Codes**: 19-character alcohol identification codes
- **Status Tracking**: ACTIVE, INACTIVE, PAUSED, REGISTRATION, ARCHIVED
- **Expiration Management**: Days-based expiration tracking
- **Volume & Packaging**: Decimal volume tracking with packaging details
- **Search & Filter**: Advanced product search with pagination

### 🏷️ Code Generation & Management

- **Individual Codes**: 32-character unique product codes
- **SSCC Box Codes**: 22-character shipping container codes with automatic generation
- **Status Tracking**: NEW, USED status with lifecycle management
- **Code Packaging**: Individual codes packing into boxes with SSCC assignment
- **Bulk Operations**: Mass code generation and status updates
- **Download Export**: Text file export for code lists

### 🔄 Production Shift Management

- **Shift Planning**: Date-based production planning with operator assignment
- **Real-time Tracking**: PLANNED, INPROGRESS, PAUSED, DONE, CANCELED statuses
- **Operator Integration**: Direct shift creation via EAN/GTIN scanning
- **Production Counting**: Planned vs actual production counting
- **Packaging Control**: Box packing with count tracking
- **Search & Analytics**: Comprehensive shift search and reporting

### 👷 Operator Management

- **Barcode Authentication**: Unique barcode-based operator identification
- **Shift Assignment**: Automatic operator-shift linking
- **Mobile-First**: Optimized endpoints for mobile applications
- **Production Tracking**: Real-time production progress monitoring

### 🌐 External Integrations

- **SABY System**: Delivery order management without authentication
- **Email Service**: SMTP integration with Handlebars templates
- **Sentry Monitoring**: Production error tracking and performance monitoring
- **Docker Support**: Full containerization with Traefik reverse proxy

## Tech Stack

### Core Dependencies

```json
{
  "@nestjs/core": "^11.0.1",
  "@nestjs/common": "^11.0.17",
  "@prisma/client": "^6.7.0",
  "@nestjs/jwt": "^11.0.0",
  "nestjs-zod": "^4.3.1",
  "nestjs-pino": "^4.4.0",
  "argon2": "^0.43.0",
  "nanoid": "^5.1.5"
}
```

### Development & DevOps

```json
{
  "@nestjs/swagger": "^11.1.1",
  "@sentry/nestjs": "^9.14.0",
  "semantic-release": "^24.2.3",
  "jest": "^29.7.0",
  "typescript": "^5.7.3"
}
```

## API Documentation

The API provides comprehensive Swagger documentation available at:

- **Swagger UI**: `/api` - Interactive API documentation
- **Scalar Reference**: `/api/scalar` - Modern API reference with dark theme
- **OpenAPI JSON**: `/api/json` - Machine-readable API specification
- **OpenAPI YAML**: `/api/yaml` - YAML format specification

### Main Endpoints

#### Authentication

- `POST /user` - User registration
- `POST /user/auth/sign-in` - User authentication
- `POST /user/auth/reset-password-request` - Password reset request
- `POST /user/auth/reset-password` - Password reset confirmation
- `POST /operator/login` - Operator barcode authentication

#### Product Management

- `GET /product` - List products with pagination and search
- `POST /product` - Create new product
- `GET /product/:id` - Get product details
- `PATCH /product/:id` - Update product
- `GET /product/search` - Product search

#### Code Management

- `POST /code/individual` - Generate individual codes
- `POST /code/boxes` - Generate SSCC box codes
- `POST /code/pack` - Pack codes into boxes
- `POST /code/update-status` - Update code statuses
- `GET /code/download` - Download codes as text file

#### Shift Management

- `GET /shift` - List shifts with search and filtering
- `POST /shift` - Create production shift
- `POST /shift/operator/create` - Create shift by operator (EAN scan)
- `GET /shift/:id` - Get shift details
- `PATCH /shift/:id` - Update shift status

#### SABY Integration

- `POST /saby/order/delivery/` - Create delivery order
- `GET /saby/order/delivery/` - List delivery orders
- `PUT /saby/order/delivery/change/` - Update order status

## Project Setup

### Prerequisites

- Node.js 22.14.0 or higher
- PostgreSQL database
- OpenSSL for certificate generation

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Setup environment variables**

```bash
cp .env.example .env
# Configure your DATABASE_URL, JWT settings, SMTP, Sentry DSN
```

3. **Generate certificates**

For local development:

```bash
# Unix/Linux/macOS
LOCAL='api.test.in.bottlecode.app' npm run cert:create:local

# Windows PowerShell
$env:LOCAL='api.test.in.bottlecode.app'
npm run cert:create:local
```

For JWT tokens:

```bash
npm run cert:create:jwt
```

4. **Database setup**

```bash
# Run database migrations
npm run migrate:dev

# Generate Prisma client
npm run prisma:generate

# (Optional) Seed database
npm run prisma:seed
```

## Development

### Running the application

```bash
# Development mode
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run start:prod
```

### Database Management

```bash
# Create new migration
npm run migrate:dev:create

# Apply migrations
npm run migrate:deploy

# Open Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

The application includes full Docker support with:

- Multi-stage build optimization
- Traefik reverse proxy with automatic HTTPS
- PostgreSQL with persistent volumes
- Automated certificate management via Let's Encrypt
- Health checks and restart policies

## Environment Variables

### Required Configuration

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bottlecode"

# JWT Configuration
JWT_EXPIRES="1h"
JWT_COOKIE_MAX_AGE="3600000"
JWT_PUBLIC_KEY_PATH="./config/cert/jwt_public_key.pem"
JWT_PRIVATE_KEY_PATH="./config/cert/jwt_private_key.pem"

# SMTP Configuration
MAIL_HOST="smtp.example.com"
MAIL_PORT="587"
MAIL_USER="noreply@bottlecode.app"
MAIL_PASSWORD="your-smtp-password"
MAIL_FROM="support@bottlecode.app"

# Sentry (Production)
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_TRACES_SAMPLE_RATE="0.1"
SENTRY_PROFILES_SAMPLE_RATE="0.1"

# Application
NODE_ENV="development"
PORT="3033"
CLIENT_URL="https://bottlecode.app"
```

## Architecture Overview

### Database Schema

The application uses a sophisticated relational schema with:

- **Products** with GTIN/alcohol codes and lifecycle management
- **Individual & Box Codes** with hierarchical relationship and status tracking
- **Production Shifts** with operator assignment and progress tracking
- **User & Operator** separate authentication systems
- **Email Tokens** for secure password reset
- **Revoked Tokens** for JWT security
- **SABY Orders** for external delivery integration

### Security Features

- Dual authentication systems (Users vs Operators)
- JWT with RS256 asymmetric encryption
- Password hashing with Argon2
- Token revocation and blacklisting
- Rate limiting and CORS protection
- Input validation with Zod schemas
- SQL injection prevention via Prisma

### Performance & Monitoring

- Request/response logging with correlation IDs
- Database query optimization with Prisma
- Production error tracking with Sentry
- Health checks and graceful shutdowns
- Comprehensive API documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

---

**Version**: 1.0.0-beta.16  
**Author**: Vladislav Bogatyrev  
**Documentation**: [API Docs](https://api.bottlecode.app/api) | [Scalar Reference](https://api.bottlecode.app/api/scalar)
