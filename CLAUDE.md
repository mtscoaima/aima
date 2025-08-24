# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MTS Message is a Next.js 15 messaging portal application built with TypeScript and Supabase, designed for SMS/MMS marketing campaigns. It includes user authentication, campaign management, AI-powered content generation, and an admin dashboard.

## Key Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Database Operations
When modifying database schema:
1. Make changes directly in Supabase SQL Editor
2. Document migrations in `/migrations/` directory
3. Test locally before applying to production

### Testing Commands
```bash
# No automated test framework configured
# Use manual testing scenarios in /docs/
npm run lint         # Check code quality
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based with custom implementation
- **Styling**: CSS Modules, Tailwind CSS 4
- **AI Integration**: OpenAI API for content generation
- **SMS/MMS**: Naver SENS API

### Directory Structure
- `/src/app/` - Next.js app router pages and API routes
  - `/api/` - Backend API endpoints (JWT auth, business logic)
  - `/admin/` - Admin dashboard pages
  - Page routes follow folder structure
- `/src/components/` - Reusable React components
- `/src/contexts/` - React contexts (Auth, Balance, Notifications)
- `/src/lib/` - Core utilities and API clients
- `/src/hooks/` - Custom React hooks
- `/migrations/` - SQL migration files

### Authentication Flow
1. Custom JWT implementation (not Supabase Auth)
2. Access tokens expire in 1 hour
3. Refresh tokens for long-term sessions
4. Automatic token refresh on 401 responses
5. Service role key used server-side only

### API Pattern
All API routes follow this structure:
```typescript
// Server-side only - uses SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, serviceRoleKey)
```

### State Management
- **AuthContext**: User authentication state
- **BalanceContext**: Credit balance tracking  
- **NotificationContext**: Real-time notifications
- Local storage for caching with fallback to API

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Server-side only key
JWT_SECRET                       # JWT signing key
NAVER_SENS_SERVICE_ID           # SMS service
NAVER_ACCESS_KEY_ID             # SMS auth
NAVER_SECRET_KEY                # SMS secret
OPENAI_API_KEY                  # AI features
ODCLOUD_SERVICE_KEY             # Business verification
TEST_CALLING_NUMBER             # Test phone number for SMS
NEXT_PUBLIC_BASE_URL            # Optional - auto-detected on Vercel
```

## Database Schema

### Core Tables
- `users` - User accounts with JSONB fields for company/tax info
- `message_templates` - SMS/MMS templates with categories (private/public)
- `campaigns` - Marketing campaigns with approval workflow
- `transactions` - Payment and credit transactions
- `sender_numbers` - Verified phone numbers for sending
- `notifications` - User notifications with read status
- `referrals` - Referral system data
- `rewards` - Reward tracking for referrals
- `inquiries` - Customer support inquiries
- `faqs` - Frequently asked questions

### JSONB Fields Pattern
User data stored as JSONB for flexibility:
- `company_info` - Business details
- `tax_invoice_info` - Tax invoice settings
- `documents` - Uploaded file references
- `agreement_info` - Terms acceptance

## Security Considerations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- All database operations through API routes
- File uploads restricted to authenticated users
- Separate storage buckets for public/private files
- Business number verification via government API

## Testing Approach

Manual testing via documented scenarios in `/docs/`:
- `quick-test-scenarios.md` - 30-minute core features
- `manual-test-guide-3weeks.md` - Comprehensive testing
- No automated test framework currently configured

## Common Development Tasks

### Adding New API Endpoint
1. Create route file in `/src/app/api/[feature]/route.ts`
2. Import Supabase client with service role key
3. Implement JWT verification middleware
4. Add proper error handling and validation

### Creating New Page
1. Add folder in `/src/app/` with `page.tsx`
2. Use existing components from `/src/components/`
3. Apply role-based access with `RoleGuard` component
4. Follow existing CSS Module patterns

### Modifying Database Schema
1. Write SQL in Supabase dashboard
2. Save migration in `/migrations/` with timestamp
3. Update TypeScript types if needed
4. Test with existing data

## Key Features

### Multi-Role System
- **General Users**: Basic messaging and campaign management
- **Salesperson**: Referral tracking and commission dashboard
- **Admin**: Full system management and oversight

### Authentication & Authorization
- Custom JWT implementation (not Supabase Auth)
- Role-based access control with `RoleGuard` component
- Social login support (Google, Kakao, Naver)
- Business verification via government API

### AI Integration
- OpenAI-powered content generation
- AI chat for marketing assistance
- Automated image editing capabilities
- Target marketing recommendations

### Payment System
- KG이니시스 payment gateway integration
- Credit-based messaging system
- Transaction history and tax invoice generation

## Important Notes

- This project uses Supabase for data storage but NOT for authentication
- JWT tokens are managed independently of Supabase Auth
- Realtime features use polling, not Supabase Realtime
- All file uploads go through Supabase Storage with policies
- The admin section requires role-based access control
- Social authentication supports multiple providers (Google, Kakao, Naver)
- Business verification is mandatory for certain features