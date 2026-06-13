# VitaConnect — Telehealth Platform

Next.js 14 telemedicine platform with Android Health Connect integration, PWA/TWA support, video consultations, and a complete EHR system.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Framework    | Next.js 14 (App Router)                         |
| Language     | TypeScript 5                                    |
| Database     | PostgreSQL + Prisma ORM                         |
| Auth         | NextAuth.js (Credentials + Google OAuth)        |
| Styling      | Tailwind CSS + CSS Variables                    |
| PWA          | next-pwa (Workbox)                              |
| TWA          | Android Browser Helper + Health Connect SDK     |
| Video        | Jitsi Meet External API                         |
| Real-time    | Pusher (messaging)                              |
| Payments     | Stripe                                          |
| File uploads | UploadThing                                     |
| Charts       | Recharts                                        |
| State        | Zustand + React Query + SWR                     |
| Animations   | Framer Motion                                   |
| Email        | Nodemailer (Resend/SMTP)                        |

---

## Installation

### Prerequisites
- Node.js 18.17+
- PostgreSQL 14+
- pnpm (recommended) or npm

---

## ① Install all dependencies

### Using pnpm (recommended)
```bash
pnpm install
```

### Using npm
```bash
npm install
```

### Using yarn
```bash
yarn install
```

---

## ② Install individual packages (if needed separately)

```bash
# Core Next.js
npm install next@^14.2.0 react@^18.3.0 react-dom@^18.3.0

# Database
npm install @prisma/client@^5.14.0
npm install -D prisma@^5.14.0

# Auth
npm install next-auth@^4.24.7 @auth/prisma-adapter@^2.4.1 bcryptjs@^2.4.3 --legacy-peer-deps
npm install -D @types/bcryptjs@^2.4.6 --legacy-peer-deps

# Validation
npm install zod@^3.23.8 --legacy-peer-deps

# UI Components (Radix)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tooltip lucide-react@^0.400.0 --legacy-peer-deps

# Styling utilities
npm install clsx@^2.1.1 tailwind-merge@^2.3.0 class-variance-authority@^0.7.0 --legacy-peer-deps

# Charts
npm install recharts@^2.12.7 --legacy-peer-deps

# Real-time
npm install pusher@^5.2.0 pusher-js@^8.4.0 --legacy-peer-deps

# Payments
npm install stripe@^16.0.0 @stripe/stripe-js@^4.0.0 --legacy-peer-deps

# File uploads
npm install uploadthing@^6.13.2 @uploadthing/react@^6.7.2 --legacy-peer-deps

# Email
npm install nodemailer@^6.9.14 --legacy-peer-deps
npm install -D @types/nodemailer@^6.4.15 --legacy-peer-deps

# Notifications
npm install react-hot-toast@^2.4.1 --legacy-peer-deps

# Animations
npm install framer-motion@^11.2.13 --legacy-peer-deps

# State management
npm install zustand@^4.5.4 swr@^2.2.5 @tanstack/react-query@^5.45.1 --legacy-peer-deps

# Calendar
npm install react-big-calendar@^1.13.0 moment@^2.30.1 --legacy-peer-deps

# Date utilities
npm install date-fns@^3.6.0 --legacy-peer-deps

# Video
npm install jitsi-meet-react-sdk@^2.0.0 --legacy-peer-deps

# File handling
npm install react-dropzone@^14.2.3 react-pdf@^9.1.0 html2canvas@^1.4.1 jspdf@^2.5.1 --legacy-peer-deps

# Image optimisation
npm install sharp@^0.33.4 --legacy-peer-deps

# PWA
npm install next-pwa@^5.6.0 --legacy-peer-deps

# Axios
npm install axios@^1.7.2 --legacy-peer-deps

# React Hook Form
npm install react-hook-form@^7.52.0 @hookform/resolvers@^3.6.0 --legacy-peer-deps

# TypeScript
npm install -D typescript@^5.4.5 @types/node@^20.14.9 @types/react@^18.3.3 @types/react-dom@^18.3.0 --legacy-peer-deps

# Tailwind
npm install -D tailwindcss@^3.4.4 postcss@^8.4.39 autoprefixer@^10.4.19 --legacy-peer-deps

# Seed runner
npm install -D tsx@^4.15.7 --legacy-peer-deps

# Linting
npm install -D eslint@^8.57.0 eslint-config-next@^14.2.4 --legacy-peer-deps
```

---

## ③ Environment setup

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random 32+ char string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — your app URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PUSHER_*` — from pusher.com
- `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID`

---

## ④ Database setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# OR run migrations (production)
npx prisma migrate dev --name init

# Seed with demo data
npm run db:seed

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## ⑤ Run development server

```bash
npm run dev
# → http://localhost:3000
```

---

## ⑥ Build for production

```bash
npm run build
npm start
```

---

## ⑦ Android TWA setup

See [`docs/TWA_HEALTH_CONNECT_SETUP.md`](./docs/TWA_HEALTH_CONNECT_SETUP.md) for full Android integration guide.

Quick summary:
1. Add `com.google.androidbrowserhelper:androidbrowserhelper:2.5.0` to your Android project
2. Add `androidx.health.connect:connect-client:1.1.0-alpha07`
3. Inject `HealthConnectBridge` as JavaScript interface named `HealthConnectAndroid`
4. Set up Digital Asset Links (`public/.well-known/assetlinks.json`)
5. The `useHealthConnect` hook auto-detects the bridge

---

## Demo accounts (after seeding)

| Role    | Email                              | Password    |
|---------|------------------------------------|-------------|
| Patient | patient@vitaconnect.health         | patient123  |
| Doctor  | sarah.chen@vitaconnect.health      | doctor123   |

---

## Project structure

```
telehealth/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout + fonts
│   ├── globals.css                 # Design system + CSS vars
│   ├── offline/page.tsx            # PWA offline fallback
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── health-data/page.tsx        # Health metrics + charts
│   ├── appointments/
│   │   └── new/page.tsx            # Multi-step booking
│   ├── doctors/page.tsx            # Doctor directory
│   ├── video/page.tsx              # Jitsi video consultation
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── auth/register/          # Registration endpoint
│       ├── appointments/           # CRUD appointments
│       ├── health-data/sync/       # Health Connect sync
│       ├── doctors/                # Doctor search
│       ├── notifications/          # Notification management
│       └── payments/               # Stripe checkout + webhook
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx     # Sidebar + topbar
│   │   └── Providers.tsx           # Auth + Query providers
│   ├── health/
│   │   ├── HealthOverview.tsx      # 8-metric grid
│   │   ├── HealthConnectBanner.tsx # HC connection prompt
│   │   └── RecentMetrics.tsx       # 7-day trend charts
│   ├── appointments/
│   │   └── UpcomingAppointments.tsx
│   ├── doctors/
│   │   └── DoctorSpotlight.tsx
│   └── ui/
│       └── QuickActions.tsx
├── hooks/
│   └── useHealthConnect.ts         # Full Health Connect SDK hook
├── lib/
│   ├── prisma.ts                   # DB client singleton
│   ├── auth.ts                     # NextAuth config
│   └── utils.ts                    # Helpers
├── prisma/
│   ├── schema.prisma               # Full DB schema (20 models)
│   └── seed.ts                     # Demo data seeder
├── public/
│   ├── manifest.json               # PWA manifest
│   └── .well-known/
│       └── assetlinks.json         # TWA Digital Asset Links
├── docs/
│   └── TWA_HEALTH_CONNECT_SETUP.md # Android integration guide
├── next.config.js                  # Next.js + PWA config
├── tailwind.config.js              # Design tokens
├── tsconfig.json
└── .env.example
```

---

## Health Connect data types supported

| Data Type            | Read | Write | Unit       |
|----------------------|------|-------|------------|
| HeartRate            | ✅   | ✅    | bpm        |
| Steps                | ✅   | ✅    | count      |
| BloodPressure        | ✅   | ✅    | mmHg       |
| BloodGlucose         | ✅   | ✅    | mg/dL      |
| OxygenSaturation     | ✅   | ✅    | %          |
| BodyTemperature      | ✅   | ✅    | °C         |
| SleepSession         | ✅   | ✅    | stages     |
| Weight               | ✅   | ✅    | kg         |
| ActiveCaloriesBurned | ✅   | ❌    | kcal       |
| Distance             | ✅   | ❌    | km         |
| ExerciseSession      | ✅   | ✅    | type+dur   |
| RespiratoryRate      | ✅   | ❌    | breaths/m  |
| BodyFat              | ✅   | ❌    | %          |
| Nutrition            | ✅   | ✅    | various    |
