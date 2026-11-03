# University Management System - Server (Backend)

A scalable RESTful API built with Node.js, Express, TypeScript, Prisma ORM and PostgreSQL to power a detailed university management platform.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [API Modules](#api-modules)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Configuration](#api-configuration)
- [Folder Structure](#folder-structure)
- [Frontend Integration](#frontend-integration)
- [Contributions](#contributions)
- [How to Contribute](#how-to-contribute)
- [License](#license)
- [Contact](#contact)

---

## About the Project

**University Management System Server** is the backend API of a detailed university management platform.

The application is developed using Node.js, Express.js, TypeScript, Prisma ORM and PostgreSQL to provide a structured and maintainable backend architecture.

It handles the core business logic and data management required for university operations, including authentication, user management, academic structures, course registration, attendance, examination results, student fees and payment processing.

The API follows a modular architecture and provides centralized endpoints for the Next.js frontend application.

A key focus of this project is maintaining reliable business logic, secure authentication, structured database relationships and consistent API responses across different user roles.

---

## Project Overview

The purpose of this backend is to provide a centralized API that supports academic and administrative operations within a university.

### Project Highlights

- **RESTful API:** Organized endpoints under `/api/v1`.
- **Authentication:** Secure authentication and role-based authorization.
- **Database Management:** PostgreSQL with Prisma ORM.
- **Academic Management:** Manage departments, programs, courses, semesters and sections.
- **Student Management:** Handle student profiles, registration, attendance and academic records.
- **Instructor Management:** Support instructor applications, instructor records and academic activities.
- **Financial Management:** Handle student fees and payment records.
- **Payment Integration:** bKash payment processing.
- **Email Services:** SMTP-based email functionality.
- **Caching:** Redis integration.
- **AI Integration:** Gemini API integration.
- **Security:** Request validation, security middleware and rate limiting.

### Project Objectives

- Develop a maintainable backend architecture.
- Provide reliable REST APIs for multiple user roles.
- Maintain structured academic and administrative data.
- Implement secure authentication and authorization.
- Handle university financial operations and payments.
- Integrate external services where required.
- Support future development of university functionality.

---

## System Architecture

The backend follows a layered API architecture.

```text
                 Next.js Frontend
                        |
                        |
                  REST API Requests
                        |
                        v
                 Express.js Server
                        |
                        v
                 Middleware Layer
                        |
             Authentication & Validation
                        |
                        v
                Route Controllers
                        |
                        v
                 Service / Business
                     Logic
                        |
                        v
                   Prisma ORM
                        |
                        v
                   PostgreSQL
```

### External Integrations

```text
Express.js Backend
       |
       ├── PostgreSQL
       ├── Redis
       ├── Cloudinary
       ├── Google Authentication
       ├── Gemini AI
       ├── SMTP / Nodemailer
       └── bKash Payment Gateway
```

---

## Key Features

### 1. Authentication & Authorization

- User authentication and session management.
- JWT-based access and refresh token handling.
- Role-based access control.
- Secure password hashing using bcrypt.
- Google authentication integration.
- Authentication middleware for protected routes.
- Cookie-based authentication support.

### 2. Academic Management

- Department management.
- Academic program management.
- Course management.
- Semester management.
- Course prerequisite management.
- Section management.
- Academic structure and relationship validation.

### 3. Student Management

- Student profile management.
- Student information management.
- Student profile photo upload.
- Course registration.
- Student attendance records.
- Examination results.
- Student fee management.
- Student payment records.

### 4. Instructor Management

- Instructor applications.
- Instructor profile management.
- Instructor records.
- Course and section-related academic operations.
- Attendance and grading workflows.

### 5. Course Registration

- Course registration management.
- Course prerequisite validation.
- Academic relationship validation.
- Section-based registration workflows.
- Registration-related business logic.

### 6. Attendance Management

- Student attendance records.
- Attendance management.
- Attendance-related academic operations.

### 7. Examination & Results

- Academic result management.
- Course grade management.
- Student result records.
- Grading-related operations.

### 8. Fee & Payment Management

- Student fee management.
- Payment record management.
- Payment status handling.
- bKash payment gateway integration.
- Payment callback processing.

### 9. File & Media Management

- Image upload using Multer.
- Cloudinary integration for media management.
- Student profile photo handling.

### 10. AI Integration

- Gemini API integration.
- Dedicated AI-related API module.

### 11. Email & Background Tasks

- Email handling using Nodemailer.
- Scheduled tasks using node-cron.
- Email template rendering using EJS.

### 12. Security & Performance

- Helmet security middleware.
- Express rate limiting.
- CORS configuration.
- Cookie parsing.
- Zod request validation.
- Redis caching integration.
- Centralized application configuration.

---

## API Modules

The backend organizes its API routes under the `/api/v1` prefix.

| Module | Endpoint | Responsibility |
|---|---|---|
| Authentication | `/api/v1/auth` | Authentication and user access. |
| Exams | `/api/v1/exams` | Examination management. |
| Departments | `/api/v1/departments` | Department management. |
| Programs | `/api/v1/programs` | Academic program management. |
| Courses | `/api/v1/courses` | Course management. |
| Semesters | `/api/v1/semesters` | Semester management. |
| Course Prerequisites | `/api/v1/course-prerequisites` | Course prerequisite relationships. |
| Sections | `/api/v1/sections` | Course section management. |
| Instructor Applications | `/api/v1/instructor-applications` | Instructor application management. |
| Instructors | `/api/v1/instructors` | Instructor management. |
| Course Registrations | `/api/v1/course-registrations` | Student course registration. |
| Students | `/api/v1/students` | Student management. |
| Attendances | `/api/v1/attendances` | Attendance management. |
| Results | `/api/v1/results` | Examination result management. |
| Fees | `/api/v1/fees` | Student fee management. |
| Payments | `/api/v1/payments` | Payment processing and records. |
| Audit Logs | `/api/v1/audit-logs` | Administrative activity records. |
| Course Grades | `/api/v1/course-grades` | Course grading management. |
| AI | `/api/v1/ai` | AI-powered functionality. |

---

## Tech Stack

### Backend

- **Node.js 24** - JavaScript runtime.
- **Express.js 5** - Backend web framework.
- **TypeScript 5.9** - Type-safe development.
- **Prisma ORM 7.10** - Database access and ORM.
- **PostgreSQL** - Relational database.

### Authentication & Security

- JSON Web Token (JWT)
- bcryptjs
- Google Auth Library
- Helmet
- Express Rate Limit
- Cookie Parser
- CORS
- Zod

### Database & Caching

- PostgreSQL
- Prisma Client
- Prisma PostgreSQL Adapter
- Redis

### Third-Party Integrations

- Cloudinary
- Google Authentication
- Google Gemini API
- bKash Payment Gateway
- Nodemailer

### Utilities & Development Tools

- Multer
- EJS
- PDFKit
- node-cron
- date-fns
- tsx
- tsup
- Biome

---

## Dependencies

The following are the main production dependencies used in the backend.

### Production Dependencies

```json
{
  "@prisma/adapter-pg": "^7.10.0",
  "@prisma/client": "^7.10.0",
  "bcryptjs": "^3.0.3",
  "cloudinary": "^2.11.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.6",
  "date-fns": "^4.4.0",
  "dotenv": "^17.4.2",
  "ejs": "^6.0.1",
  "express": "^5.2.1",
  "express-rate-limit": "^8.7.0",
  "google-auth-library": "^11.0.2",
  "helmet": "^8.3.0",
  "http-status": "^2.1.0",
  "jsonwebtoken": "^9.0.3",
  "multer": "^2.3.0",
  "node-cron": "^4.6.0",
  "nodemailer": "^10.0.9",
  "pdfkit": "^0.20.2",
  "redis": "^6.2.1",
  "zod": "^4.6.4"
}
```

### Development Dependencies

The project also uses:

- @biomejs/biome
- TypeScript
- tsx
- tsup
- Prisma CLI
- Node.js type definitions

---

## Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js 24 or a compatible version.
- npm.
- PostgreSQL.
- Redis.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/AsifHossain22/University-Management-System-Server.git
```

### 2. Navigate to the Project Directory

```bash
cd University-Management-System-Server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

Use the provided `.env.example` as a reference.

```env
NODE_ENV=development
PORT=5000

FRONTEND_URL=YOUR_FRONTEND_URL

DATABASE_URL=YOUR_DATABASE_URL

JWT_ACCESS_SECRET=YOUR_JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES_IN=YOUR_ACCESS_TOKEN_EXPIRATION_TIME

JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=YOUR_REFRESH_TOKEN_EXPIRATION_TIME

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

REDIS_USER=YOUR_REDIS_USERNAME
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_HOST=YOUR_REDIS_HOST
REDIS_PORT=YOUR_REDIS_PORT

SMTP_USER=YOUR_SMTP_USERNAME
SMTP_PASSWORD=YOUR_SMTP_PASSWORD

DEMO_ADMIN_EMAIL=YOUR_DEMO_ADMIN_EMAIL
DEMO_ADMIN_PASSWORD=YOUR_DEMO_ADMIN_PASSWORD

CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

BKASH_BASE_URL=YOUR_BKASH_BASE_URL
BKASH_USERNAME=YOUR_BKASH_USERNAME
BKASH_PASSWORD=YOUR_BKASH_PASSWORD
BKASH_APP_KEY=YOUR_BKASH_APP_KEY
BKASH_APP_SECRET=YOUR_BKASH_APP_SECRET
BKASH_CALLBACK_URL=YOUR_BKASH_CALLBACK_URL
```

Replace the placeholder values with your actual credentials.

Not all integrations may be required for every development workflow, but the application configuration must contain the values required by the features you run.

**Security Note:** Never commit your `.env` file or expose private credentials in public repositories.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run Database Migrations

For local development:

```bash
npx prisma migrate dev
```

Make sure your PostgreSQL database is running and the `DATABASE_URL` is correctly configured before running migrations.

### 7. Start the Development Server

```bash
npm run dev
```

The API server runs on the configured port, which defaults to:

```text
http://localhost:5000
```

---

## Database Setup

The application uses PostgreSQL with Prisma ORM to manage relational data.

### Database Configuration

Set your PostgreSQL connection string in `.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME"
```

### Prisma Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Run development migrations:

```bash
npx prisma migrate dev
```

Deploy existing migrations in production:

```bash
npx prisma migrate deploy
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## API Configuration

All application API routes are organized under:

```text
/api/v1
```

### Example API Structure

```text
http://localhost:5000/api/v1/auth
http://localhost:5000/api/v1/students
http://localhost:5000/api/v1/instructors
http://localhost:5000/api/v1/courses
http://localhost:5000/api/v1/departments
http://localhost:5000/api/v1/programs
http://localhost:5000/api/v1/payments
```

The frontend should use the configured backend base URL to communicate with these endpoints.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with automatic reload. |
| `npm run build` | Build the application using tsup. |
| `npm run start` | Start the compiled production server. |
| `npm run format:check` | Check code formatting. |
| `npm run format:fix` | Automatically format source files. |
| `npm run lint:check` | Run Biome lint checks. |
| `npm run lint:fix` | Automatically apply supported lint fixes. |

---

## Folder Structure

The backend uses a modular architecture to organize application functionality.

```text
University-Management-System-Server/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── routes/
│   │   └── ...
│   │
│   ├── server.ts
│   └── app.ts
│
├── .env.example
├── .gitignore
├── biome.json
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

*This is a simplified architectural representation. Refer to the repository for the exact source directory structure.*

### Directory Overview

- **`prisma/`** - Database schema and migration files.
- **`src/app/config/`** - Application configuration and environment settings.
- **`src/app/middleware/`** - Authentication, validation, security and other middleware.
- **`src/app/modules/`** - Business logic and feature-specific modules.
- **`src/app/routes/`** - API route registration and organization.
- **`src/server.ts`** - Server entry point.
- **`src/app.ts`** - Express application configuration.
- **`prisma.config.ts`** - Prisma configuration.
- **`tsup.config.ts`** - Build configuration.
- **`biome.json`** - Code formatting and linting configuration.

---

## Frontend Integration

This backend is designed to work with the University Management System frontend.

**Frontend Repository:** [University Management System App](https://github.com/AsifHossain22/University-Management-System-App)

The Next.js frontend consumes the backend REST APIs to provide role-specific dashboards and application functionality.

---

## Contributions

| Contributor | Role | Contribution |
|---|---|---|
| Asif Hossain | Full Stack Developer | Backend architecture, API development, authentication, database design, business logic, third-party integrations and payment processing. |

---

## How to Contribute

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/AmazingFeature
```

3. Implement and test your changes.
4. Commit your changes.

```bash
git commit -m "Add AmazingFeature"
```

5. Push your branch.

```bash
git push origin feature/AmazingFeature
```

6. Open a Pull Request describing your changes.

---

## License

This project is licensed under the ISC License as specified in the repository's `package.json`.

See the repository for the applicable license terms.

---

## Contact

**Developer:** Asif Hossain

- **Frontend Repository:** [University-Management-System-App](https://github.com/AsifHossain22/University-Management-System-App)
- **Backend Repository:** [University-Management-System-Server](https://github.com/AsifHossain22/University-Management-System-Server)
- **Live Application:** [University Management System](https://university-management-system-app.vercel.app/)
- **Portfolio:** [web-developer-asif.netlify.app](https://web-developer-asif.netlify.app/)
- **GitHub:** [AsifHossain22](https://github.com/AsifHossain22/)
- **LinkedIn:** [Asif Hossain](https://www.linkedin.com/in/asifhossain22/)
- **Email:** [hiasifhossain22@gmail.com](mailto:hiasifhossain22@gmail.com)

---

⭐ If you find this project interesting, consider giving the repository a star!

**Designed and developed by Asif Hossain.**
