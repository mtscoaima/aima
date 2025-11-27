# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version**: 2.3 (Updated 2025-11-25)
**Related Docs**: [MTS_API_통합_테스트_가이드.md](MTS_API_통합_테스트_가이드.md) | [README.md](README.md)

## Project Overview

MTS Message is a Next.js 15 messaging portal application built with TypeScript and Supabase, designed for SMS/MMS marketing campaigns. It includes user authentication, campaign management, AI-powered content generation, and an admin dashboard.

## Quick Start for New Developers

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials (see Environment Variables section)

# 3. Verify Supabase connection
# - Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
# - Test connection in Supabase dashboard

# 4. Run development server
npm run dev

# 5. Access application
# Open http://localhost:3000 in browser
# Check DevTools Console for any connection errors
```

**First-Time Setup Checklist**:
- ✅ Environment variables configured (9 required variables)
- ✅ Supabase project accessible (check dashboard)
- ✅ MTS API credentials valid (test with `TEST_CALLING_NUMBER`)
- ✅ Dev server starts without errors
- ✅ Can login with test account

## Troubleshooting Common Setup Issues

### "supabaseKey is required" or "Invalid Supabase credentials"
**Cause**: Missing or incorrect Supabase environment variables
**Solution**:
1. Verify `.env.local` file exists in project root
2. Check `NEXT_PUBLIC_SUPABASE_URL` format: `https://xxx.supabase.co`
3. Check `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon key)
4. Restart dev server: `npm run dev`
5. Clear browser cache and localStorage

### "MTS API authentication failed" or "Invalid auth code"
**Cause**: Incorrect MTS API credentials
**Solution**:
1. Verify `MTS_AUTH_CODE` in `.env.local`
2. Check `MTS_API_URL=https://api.mtsco.co.kr` (no trailing slash)
3. Check `MTS_TEMPLATE_API_URL=https://talks.mtsco.co.kr`
4. Test with registered `TEST_CALLING_NUMBER`
5. Contact MTS support to verify account status

### "Token expired" or "Invalid token" errors
**Cause**: JWT token issues or expired refresh token
**Solution**:
1. Check `JWT_SECRET` is set in `.env.local`
2. Clear browser localStorage: `localStorage.clear()` in DevTools Console
3. Re-login to get fresh tokens
4. Check AuthContext is properly wrapping your app
5. Verify API routes use `validateAuthWithSuccess()` middleware

### Build fails with "Type error" or "Property does not exist"
**Cause**: TypeScript compilation errors
**Solution**:
1. Run type check: `npx tsc --noEmit`
2. Check for missing imports or incorrect type annotations
3. Review TypeScript patterns in "TypeScript Build Considerations" section
4. If 404 page static generation error: This is known issue, verify TS errors fixed separately

### "Failed to fetch" or CORS errors
**Cause**: API route not accessible or incorrect URL
**Solution**:
1. Verify dev server is running on `http://localhost:3000`
2. Check API route path matches fetch URL
3. Open DevTools Network tab to see actual error response
4. Verify API route exports `POST` or `GET` function
5. Check for JWT auth errors (401 status)

### Database connection errors
**Cause**: RLS policies blocking access or incorrect service role key
**Solution**:
1. Use Supabase SQL Editor to test queries directly
2. Verify RLS policies allow service_role access
3. Check API routes use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
4. Never use service role key in client components (security risk!)
5. Review Database Schema section for table structure

### "Insufficient credits" or payment errors
**Cause**: User account has no credits or payment gateway issues
**Solution**:
1. Check `transactions` table for user's credit balance
2. Test payment with KG이니시스 test credentials
3. Verify `NICEPAY_*` environment variables (if using NicePay)
4. Check message costs in PricingContext
5. Admin can manually add credits via Supabase dashboard

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
npm run lint         # Run ESLint checks

# TypeScript type checking (without emitting files)
npx tsc --noEmit     # Check all TypeScript errors across project
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based with custom implementation
- **Styling**: CSS Modules, Tailwind CSS 4
- **AI Integration**: OpenAI API (GPT-4, DALL-E 3)
- **Messaging API**: MTS API (완전 전환 완료)
  - SMS/LMS/MMS (automatic type detection, image optimization)
  - Kakao AlimTalk (template-based)
  - Kakao FriendTalk (FT/FI/FW/FL/FC types, imageLink support)
  - Kakao Brand Messages (template-based, 8 types)
  - Naver TalkTalk Smart Notifications (template-based)
- **Payment Gateway**: NicePay (KG이니시스)
- **Image Processing**: Sharp (optimization, PNG→JPEG conversion, resizing)
- **File Handling**: xlsx (Excel), html2canvas
- **Charting**: Chart.js, react-chartjs-2

### Directory Structure

```
mts-message/
├── src/
│   ├── app/                  # Next.js App Router (182 API endpoints, 57 pages)
│   │   ├── api/             # Backend API endpoints
│   │   │   ├── messages/    # Message sending APIs
│   │   │   │   ├── send/route.ts          # SMS/LMS/MMS
│   │   │   │   ├── kakao/
│   │   │   │   │   ├── alimtalk/send/     # AlimTalk
│   │   │   │   │   ├── friendtalk/send/   # FriendTalk (5 types)
│   │   │   │   │   ├── brand/send/        # Brand Messages (8 types)
│   │   │   │   │   └── upload-image/      # Kakao image upload
│   │   │   │   └── naver/talk/send/       # Naver TalkTalk
│   │   │   ├── kakao/       # Kakao management (profiles, templates)
│   │   │   ├── naver/       # Naver management (partner, templates)
│   │   │   ├── auth/        # Authentication (login, register, refresh)
│   │   │   ├── users/       # User management
│   │   │   └── admin/       # Admin operations (role-protected)
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── messages/        # Message composition UI
│   │   └── my-site/         # User profile and settings
│   ├── components/          # React components (83 total)
│   │   ├── messages/        # Message composition tabs
│   │   │   ├── MessageSendTab.tsx        # SMS/MMS
│   │   │   ├── AlimtalkTab.tsx          # Kakao AlimTalk
│   │   │   ├── FriendtalkTab.tsx        # Kakao FriendTalk (FT/FI/FW/FL/FC)
│   │   │   ├── BrandTab.tsx             # Kakao Brand (8 types)
│   │   │   └── NaverTalkContent.tsx     # Naver TalkTalk
│   │   ├── modals/          # Reusable modals
│   │   │   ├── SimpleContentSaveModal.tsx  # Template save
│   │   │   ├── LoadContentModal.tsx        # Template load
│   │   │   └── TemplateVariableInputModal.tsx  # Variable editor
│   │   ├── kakao/           # Kakao-specific features
│   │   └── admin/           # Admin dashboard components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx         # JWT auth, token refresh
│   │   ├── BalanceContext.tsx      # Credit balance (polling)
│   │   ├── NotificationContext.tsx # Notifications (polling)
│   │   └── PricingContext.tsx      # Dynamic pricing
│   ├── lib/                 # Core utilities (16 modules)
│   │   ├── mtsApi.ts        # ⭐ MTS API core (2,907 lines, 19 functions)
│   │   ├── supabase.ts      # Supabase client
│   │   └── jwt.ts           # Custom JWT implementation
│   ├── utils/               # Helper utilities (11 modules)
│   │   ├── kakaoApi.ts      # Kakao API wrappers (566 lines)
│   │   └── replaceVariables.ts  # Variable substitution
│   └── hooks/               # Custom React hooks (3 hooks)
├── migrations/              # SQL migrations (17 files, timestamped)
├── docs/                    # Testing and documentation
│   ├── quick-test-scenarios.md      # 30-min test
│   └── manual-test-guide-3weeks.md  # Full test suite
└── MTS_API_통합_테스트_가이드.md   # Phase-by-phase test guide (v4.3)
```

**Key Files** (by importance):
1. **[src/lib/mtsApi.ts](src/lib/mtsApi.ts)** - MTS API integration core (19 functions)
2. **[src/components/messages/](src/components/messages/)** - Message UI tabs (5 tabs)
3. **[src/app/api/messages/](src/app/api/messages/)** - Message sending endpoints
4. **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)** - Custom JWT authentication
5. **[MTS_API_통합_테스트_가이드.md](MTS_API_통합_테스트_가이드.md)** - Testing guide

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
- **AuthContext**: User authentication state, JWT token management, auto-refresh
- **BalanceContext**: Credit balance tracking, transaction history
- **NotificationContext**: Real-time notifications with polling (30s interval)
- **PricingContext**: Dynamic pricing configuration
- Local storage for caching with fallback to API

### MTS API Integration Architecture

The application uses a **4-layer architecture** for MTS API integration:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: UI Components (User Interface)                     │
│ - MessageSendTab.tsx, AlimtalkTab.tsx, FriendtalkTab.tsx   │
│ - Handles user input, validation, file uploads              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request (with JWT)
┌────────────────────────▼────────────────────────────────────┐
│ Layer 3: API Routes (Authentication & Business Logic)       │
│ - /api/messages/send, /api/messages/kakao/*/send           │
│ - JWT validation, user authorization, cost calculation      │
└────────────────────────┬────────────────────────────────────┘
                         │ Function call
┌────────────────────────▼────────────────────────────────────┐
│ Layer 2: Wrapper Layer (Optional, Kakao-specific helpers)   │
│ - src/utils/kakaoApi.ts (simplified wrappers)              │
└────────────────────────┬────────────────────────────────────┘
                         │ Function call
┌────────────────────────▼────────────────────────────────────┐
│ Layer 1: Core MTS API Layer (MTS HTTP Client)              │
│ - src/lib/mtsApi.ts (2,907 lines, 19 functions)            │
│ - sendSMS(), sendKakaoAlimtalk(), sendKakaoFriendtalk()    │
│ - Direct HTTP calls to MTS servers with auth codes          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS Request
┌────────────────────────▼────────────────────────────────────┐
│ External: MTS API Servers                                   │
│ - api.mtsco.co.kr (main API)                               │
│ - talks.mtsco.co.kr (template API)                         │
│ - mtscard1.mtsco.co.kr:41310 (Naver CARDINFO)              │
└─────────────────────────────────────────────────────────────┘
```

**Message Flow Example** (SMS):
1. User fills form in `MessageSendTab.tsx` → clicks "Send"
2. Component calls `POST /api/messages/send` with payload
3. API route validates JWT, checks credit balance
4. API route calls `sendSMS()` from `mtsApi.ts`
5. `sendSMS()` sends HTTPS request to MTS API
6. MTS API returns result → API route logs to DB → UI shows result

### Image Handling for MTS
- **SMS/MMS Images**: Uploaded to MTS server, automatically optimized (PNG→JPEG, resize)
- **Kakao Images**: Separate upload to Kakao image server for FriendTalk/Brand messages
  - FT/FI: Single image upload (max 1)
  - FL: Per-item image upload (3-4 items, each with 1:1 ratio image)
  - FC: Per-carousel image upload (2-6 carousels, each with optional image)
  - Upload handler: `handleListItemImageUpload()`, `handleCarouselImageUpload()`
- **Sharp Processing**: Automatic format conversion, size limits enforced
- **Storage**: Supabase Storage for user-uploaded images, MTS/Kakao for message delivery

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Server-side only key
JWT_SECRET                       # JWT signing key
MTS_AUTH_CODE                   # MTS API authentication code
MTS_API_URL                     # MTS API endpoint (https://api.mtsco.co.kr)
MTS_TEMPLATE_API_URL            # MTS Template API endpoint (https://talks.mtsco.co.kr)
OPENAI_API_KEY                  # AI features
ODCLOUD_SERVICE_KEY             # Business verification
TEST_CALLING_NUMBER             # Test phone number for SMS/MMS
NEXT_PUBLIC_BASE_URL            # Optional - auto-detected on Vercel
```

## Database Schema

### Core Tables
- `users` - User accounts with JSONB fields for company/tax info
- `message_templates` - SMS/MMS templates with categories (private/public)
- `sms_message_templates` - Enhanced template system with JSONB metadata
  - Supports SMS, Kakao (AlimTalk, FriendTalk, Brand), Naver TalkTalk
  - Stores buttons, image URLs, imageLinks in metadata
- `message_logs` - Message sending history with delivery status
- `campaigns` - Marketing campaigns with approval workflow
- `transactions` - Payment and credit transactions
- `sender_numbers` - Verified phone numbers for sending
- `notifications` - User notifications with read status
- `referrals` - Referral system data
- `rewards` - Reward tracking for referrals
- `inquiries` - Customer support inquiries
- `faqs` - Frequently asked questions
- `kakao_sender_profiles` - Kakao Business sender profile management
- `kakao_templates` - Kakao message templates (AlimTalk, Brand, FriendTalk)

### JSONB Fields Pattern
User data stored as JSONB for flexibility:
- `company_info` - Business details
- `tax_invoice_info` - Tax invoice settings
- `documents` - Uploaded file references
- `agreement_info` - Terms acceptance

**Template metadata** (`sms_message_templates.metadata` JSONB):
- Kakao AlimTalk: `{ sender_key, template_code, buttons, imageUrl }`
- Kakao FriendTalk: `{ sender_key, ad_flag, buttons, imageUrl, imageLink, friendtalkMessageType, headerText, listItems, carousels, moreLink }`
- Kakao Brand: `{ sender_key, template_code, message_type, buttons, image, coupon, item }`
- Naver TalkTalk: `{ partner_key, template_code, product_code, buttons, template_type, push_notice, table_info }`

## Security Considerations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- All database operations through API routes
- File uploads restricted to authenticated users
- Separate storage buckets for public/private files
- Business number verification via government API

## Testing Approach

Manual testing via documented scenarios:
- `/docs/quick-test-scenarios.md` - 30-minute core features
- `/docs/manual-test-guide-3weeks.md` - Comprehensive testing
- `MTS_API_통합_테스트_가이드.md` - MTS API integration testing guide (v4.1, 2025-11-14)
  - Phase 1-2: SMS/LMS/MMS ✅ Completed
  - Phase 3: Kakao AlimTalk ✅ Completed (including variable templates)
  - Phase 4: Kakao FriendTalk ✅ **완전 완료 (2025-11-14)** - All 5 types real delivery verified
    - FT/FI: Text and Image types with button support (max 5 buttons, WL/AL/BK/MD types) ✅
    - FW: Wide image type (imageLink, max 2 buttons, WL/AL/BK/MD types) ✅
    - FL: Wide Item List type (header + 3-4 items with individual images/URLs, max 2 buttons, WL/AL/BK/MD types) ✅
    - FC: Carousel type (2-6 carousels with header/images, 1-2 buttons each, moreLink, WL/AL/BK/MD types) ✅
    - ✅ **2025-11-13**: Button type expansion (WL/AL/BK/MD), FL/FC item-level image upload, template save/load
    - ✅ **2025-11-14**: FL/FC ER99 error resolution (message/tran_* fields conditional handling), real delivery success
  - Phase 5: Naver TalkTalk ✅ **Completed** (UI/backend fully integrated with variable system)
  - Phase 6: Kakao Brand Messages ✅ **8 Types Implemented** (TEXT/IMAGE/WIDE verified, 5 new types structure fixed, 변수분리방식 v1.1)
    - Phase 6.0-6.4: TEXT/IMAGE/WIDE + buttons ✅ Verified (2025-11-10)
    - Phase 6.5-6.9: WIDE_ITEM_LIST/PREMIUM_VIDEO/COMMERCE/CAROUSEL_COMMERCE/CAROUSEL_FEED ✅ Structure Fixed (2025-11-12)
- No automated test framework currently configured
- Use Supabase dashboard for database verification
- Check MTS API response codes in browser DevTools

## Common Development Tasks

### Adding New API Endpoint

**Step-by-step guide**:

1. **Create route file**: `/src/app/api/[feature]/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@supabase/supabase-js';
   import { validateAuthWithSuccess } from '@/lib/jwt';

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );

   export async function POST(request: NextRequest) {
     // 1. Validate JWT token
     const authResult = validateAuthWithSuccess(request);
     if (!authResult.isValid) return authResult.errorResponse;
     const { userId, userRole } = authResult.userInfo;

     try {
       // 2. Parse request body
       const body = await request.json();

       // 3. Validate input
       if (!body.requiredField) {
         return NextResponse.json(
           { error: 'Missing required field' },
           { status: 400 }
         );
       }

       // 4. Perform database operations
       const { data, error } = await supabase
         .from('your_table')
         .insert({ ...body, user_id: userId });

       if (error) throw error;

       // 5. Return success response
       return NextResponse.json({ success: true, data });
     } catch (error) {
       console.error('API error:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

2. **Test the endpoint**:
   - Use browser DevTools Network tab or Postman
   - Include JWT token in Authorization header
   - Check response status and body

3. **Update TypeScript types** (if needed):
   - Add interface in `src/types/` or inline
   - Export types for reuse in components

### Creating New Page

**Step-by-step guide**:

1. **Create page folder**: `/src/app/[feature]/page.tsx`
   ```typescript
   'use client';

   import { useAuth } from '@/contexts/AuthContext';
   import RoleGuard from '@/components/RoleGuard';
   import styles from './page.module.css';

   export default function FeaturePage() {
     const { user } = useAuth();

     return (
       <RoleGuard allowedRoles={['USER', 'ADMIN']}>
         <div className={styles.container}>
           <h1>Feature Page</h1>
           {/* Your content */}
         </div>
       </RoleGuard>
     );
   }
   ```

2. **Create CSS Module**: `/src/app/[feature]/page.module.css`
   - Follow existing naming conventions
   - Use CSS variables for colors/spacing

3. **Add navigation link** (if needed):
   - Update sidebar/nav component
   - Add route to navigation config

4. **Test access control**:
   - Test with different user roles
   - Verify unauthenticated users are redirected

### Modifying Database Schema

**Step-by-step guide**:

1. **Write SQL in Supabase SQL Editor**:
   ```sql
   -- Example: Adding new column
   ALTER TABLE message_logs
   ADD COLUMN new_field TEXT;

   -- Example: Creating new table
   CREATE TABLE new_feature (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     data JSONB
   );

   -- Add RLS policies
   ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own records"
     ON new_feature FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. **Test SQL** in Supabase dashboard first
3. **Save migration file**: `/migrations/YYYYMMDD_feature_name.sql`
   - Format: `20251114_add_new_feature.sql`
   - Copy exact SQL from Supabase editor

4. **Update TypeScript types**:
   ```typescript
   // In src/types/database.ts or similar
   export interface NewFeature {
     id: string;
     user_id: string;
     created_at: string;
     data: Record<string, unknown>;
   }
   ```

5. **Test with existing data**:
   - Run queries in Supabase SQL Editor
   - Verify no breaking changes
   - Check RLS policies work correctly

6. **Document migration** (if part of feature phase):
   - Update `/migrations/README_*.md`
   - Note breaking changes or required actions

### Working with MTS API

**Quick reference**:

1. **All MTS functions**: `src/lib/mtsApi.ts` (19 functions)
2. **Environment variables**:
   - `MTS_AUTH_CODE` - Your MTS API key
   - `MTS_API_URL` - `https://api.mtsco.co.kr`
   - `MTS_TEMPLATE_API_URL` - `https://talks.mtsco.co.kr`
3. **Test number**: `TEST_CALLING_NUMBER` from `.env.local`
4. **Debugging**:
   - Check DevTools Network tab for request/response
   - Verify `message_logs` table for delivery status
   - Check `transactions` table for cost deduction
5. **Testing guide**: `MTS_API_통합_테스트_가이드.md`

**Available MTS functions**:
```typescript
// SMS/LMS/MMS
await sendSMS({ recipients, message, callback, imageUrl });

// Kakao AlimTalk (server-side variable substitution)
await sendKakaoAlimtalk({ recipients, templateCode, variables });

// Kakao FriendTalk (client-side variable substitution)
await sendKakaoFriendtalk({ recipients, message, buttons, imageUrl });

// Kakao Brand Messages
await sendKakaoBrandMessage({ recipients, templateCode, variables });

// Naver TalkTalk (server-side variable substitution)
await sendNaverTalk({ recipients, templateCode, templateParams });
```

### Adding New Message Type

**Complete step-by-step guide**:

1. **Create UI Tab Component**: `src/components/messages/[Type]Tab.tsx`
   - Copy existing tab as template (e.g., `FriendtalkTab.tsx`)
   - Add form fields for message-specific data
   - Handle file uploads (if needed)
   - Implement validation

2. **Add API Endpoint**: `src/app/api/messages/[type]/send/route.ts`
   ```typescript
   export async function POST(request: NextRequest) {
     const authResult = validateAuthWithSuccess(request);
     if (!authResult.isValid) return authResult.errorResponse;
     const { userId } = authResult.userInfo;

     const { recipients, message, ...otherFields } = await request.json();

     // Call MTS API function
     const result = await sendNewMessageType({
       recipients,
       message,
       ...otherFields
     });

     // Log to database
     await supabase.from('message_logs').insert({
       user_id: userId,
       message_type: 'NEW_TYPE',
       recipients: recipients.length,
       status: result.success ? 'sent' : 'failed'
     });

     return NextResponse.json(result);
   }
   ```

3. **Add MTS API Function**: `src/lib/mtsApi.ts`
   ```typescript
   export async function sendNewMessageType(params: {
     recipients: Array<{ phone: string }>;
     message: string;
     // ... other params
   }) {
     const requestBody = {
       auth_code: process.env.MTS_AUTH_CODE,
       recipients: params.recipients.map(r => ({
         number: r.phone.replace(/^0/, '82')
       })),
       message: params.message,
       // ... other fields
     };

     const response = await fetch(
       `${process.env.MTS_API_URL}/v1/new-type/send`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(requestBody)
       }
     );

     return await response.json();
   }
   ```

4. **Update Database Schema**:
   ```sql
   -- Add template support
   ALTER TABLE sms_message_templates
   ADD COLUMN IF NOT EXISTS new_type_field TEXT;

   -- Or store in metadata JSONB for complex data
   -- metadata: { buttons: [...], imageUrl: '...', ... }
   ```

5. **Add Template Save/Load Support**:
   - Update `SimpleContentSaveModal.tsx` to include new fields
   - Update `LoadContentModal.tsx` to restore new fields
   - Store complex data in `metadata` JSONB column

6. **Update TypeScript Types**:
   ```typescript
   // Add to message type enum
   export type MessageType = 'SMS' | 'ALIMTALK' | 'NEW_TYPE';

   // Add interface
   export interface NewMessageTypePayload {
     recipients: Recipient[];
     message: string;
     // ... other fields
   }
   ```

7. **⚠️ Critical: Check MTS API Documentation**:
   - Many MTS APIs require **nested object structures**
   - Example: `{ list: [...] }`, `{ commerce: {...} }`, `{ video: {...} }`
   - Verify field names (camelCase vs snake_case)
   - Check character limits and validation rules

8. **Test Thoroughly**:
   - Follow `MTS_API_통합_테스트_가이드.md`
   - Test UI validation
   - Test API endpoint with Postman
   - Test MTS API call with real phone number
   - Verify database logging
   - Check cost calculation and deduction

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

### Authentication & Security
- This project uses Supabase for data storage but NOT for authentication
- JWT tokens are managed independently of Supabase Auth
- Access tokens expire in 1 hour, refresh tokens in 7 days
- Automatic token refresh on 401 responses
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) must NEVER be exposed to client
- All database operations must go through API routes

### Realtime & Polling
- Realtime features use polling (30s interval), not Supabase Realtime
- NotificationContext polls for new notifications
- BalanceContext polls for credit balance updates
- Avoid creating additional Supabase Realtime subscriptions

### File Handling
- All file uploads go through Supabase Storage with RLS policies
- User documents in private `user-documents` bucket
- Template images in public `templates` bucket
- MTS message images processed with Sharp (PNG→JPEG, resize, optimize)
- Kakao images uploaded separately to Kakao image server

### Role-Based Access Control
- The admin section requires role-based access control via `RoleGuard` component
- User roles: `USER`, `SALESPERSON`, `ADMIN`
- Social authentication supports multiple providers (Google, Kakao, Naver)
- Business verification via government API (`ODCLOUD_SERVICE_KEY`) is mandatory for certain features

### MTS API Implementation Status
- **Completed**: SMS/LMS/MMS, Kakao AlimTalk, **Kakao FriendTalk (all 5 types: FT/FI/FW/FL/FC ✅ 2025-11-14 완전 완료)**, **Kakao Brand Messages (all 8 types ✅)**, **Naver TalkTalk ✅**
- **Real Send Verified**: SMS/LMS/MMS, AlimTalk, FriendTalk FT/FI/FW/FL/FC (모든 타입 실제 발송 성공), Brand Messages TEXT/IMAGE/WIDE
- **Structure Verified, Real Send Pending**: Brand Messages (CAROUSEL_FEED, COMMERCE, CAROUSEL_COMMERCE, PREMIUM_VIDEO, WIDE_ITEM_LIST)
- **Reference**: `MTS_API_통합_테스트_가이드.md` for detailed testing status
- **Core Module**: `src/lib/mtsApi.ts` (2,907 lines, 19 functions)
- **FriendTalk Features** (2025-11-14):
  - ✅ Button types: WL (웹링크), AL (앱링크), BK (봇키워드), MD (메시지전달)
  - ✅ FL item-level image upload with hidden file inputs and refs
  - ✅ FL item-level URL input (url_mobile required, url_pc optional)
  - ✅ FC carousel-level image upload with hidden file inputs and refs
  - ✅ FC carousel-level header input (max 20 chars)
  - ✅ Template save/load includes: friendtalkMessageType, headerText, listItems (with images/URLs), carousels (with header/images/buttons), moreLink, imageLink
  - ✅ Template data stored in `sms_message_templates.metadata` JSONB field for FW/FL/FC types
  - ✅ **FL/FC ER99 Error Resolution (2025-11-14)**: message 필드 및 tran_* 필드 조건부 처리로 실제 발송 성공
  - ✅ **2025-11-17**: Variable insertion UI integration completed
    - FT/FI/FW types now use VariableSelectModal (same UX as SMS)
    - 9 predefined variables available across 3 categories
    - Replaced manual `#{변수명}` text insertion with modal-based selection
    - Improved discoverability and reduced input errors
- **Brand Messages**: Uses Variable Separation Method v1.1 (separate `message_variable`, `button_variable`, `image_variable`, `video_variable`, `commerce_variable`, etc.)
  - ✅ **2025-11-10 업데이트**: 변수분리방식 v1.1 전환 완료, 이전 1030 에러 완전 해결
  - ✅ **실제 발송 테스트 완료**: TEXT, IMAGE, WIDE 타입 + 버튼(최대 5개) 조합 모두 성공
  - ✅ **2025-11-11 업데이트**: 신규 5개 타입 UI 구현 완료
    - WIDE_ITEM_LIST: 이미지 업로드 + imageLink UI
    - PREMIUM_VIDEO: 비디오/썸네일 업로드 UI, Supabase Storage kakao-videos 버킷
    - COMMERCE: 상품 이미지 + 상품 정보 입력 UI (commerce_title, regular_price, discount_price, discount_rate, discount_fixed)
    - CAROUSEL_COMMERCE/CAROUSEL_FEED: 기본 UI 구현
    - DB 마이그레이션: kakao_brand_templates 테이블 7개 필드 추가
    - 비디오 업로드 API: `/api/messages/kakao/upload-video` (Supabase Storage 연동)
  - ✅ **2025-11-12 Critical Fix**: 신규 5개 타입 MTS API 구조 수정 완료
    - **CAROUSEL_FEED**: 평면 배열 → `{ list: [...] }` 중첩 구조로 수정, buttons 필드 추가 (1-2개), header/content/imageUrl/imageName 필드명 변경
    - **COMMERCE**: 평면 필드 → `{ commerce: { title, regularPrice, discountPrice, ... } }` 객체로 그룹화
    - **CAROUSEL_COMMERCE**: CAROUSEL_FEED와 동일한 구조 + 각 카드 내 commerce 객체 중첩
    - **PREMIUM_VIDEO**: 평면 필드 → `{ video: { videoUrl, thumbnailUrl } }` 객체로 그룹화
    - **UI 개선**: CAROUSEL_FEED 카드별 버튼 입력 UI 추가 (1-2개, WL/AL/BK/MD 타입 선택)
    - **최소/최대 검증**: CAROUSEL 타입 2-6개 카드 제한 추가
  - ⏸️ **다음 단계**: 5개 신규 타입 템플릿 등록 UI 테스트 → MTS 검수 → 실제 발송 테스트

### Variable Substitution
- SMS/MMS: Client-side substitution with `#{variable}` syntax
- Kakao AlimTalk: Server-side substitution by MTS API (do NOT substitute on client)
- Kakao FriendTalk: Client-side substitution with `#{variable}` syntax
- Kakao Brand: Client-side substitution with `#{variable}` syntax
- Naver TalkTalk: Server-side substitution by MTS API (do NOT substitute on client)
  - Uses `templateParams` object for common variables
  - Supports per-recipient variables via `recipients[].variables`
  - UI extracts variables with regex `/#\{([^}]+)\}/g`
  - TemplateVariableInputModal provides Excel-style per-recipient variable input
- Template system supports saving content with variables intact

### Naver TalkTalk Implementation Details

**Status**: ✅ Fully Completed (2025-11-12)

**Core Components**:
1. **Backend API** - [src/app/api/messages/naver/talk/send/route.ts](src/app/api/messages/naver/talk/send/route.ts)
   - JWT authentication with `validateAuthWithSuccess()`
   - Accepts `templateParams` (common variables) and `recipients[].variables` (per-recipient)
   - Merges per-recipient variables with common variables: `{ ...templateParams, ...recipient.variables }`
   - Supports nested `attachments: { buttons: [...], sampleImageHashId }` structure
   - CARDINFO productCode routes to separate server (mtscard1.mtsco.co.kr:41310)
   - Cost: 13원 per message (CARDINFO), varies by productCode

2. **UI Component** - [src/components/messages/NaverTalkContent.tsx](src/components/messages/NaverTalkContent.tsx)
   - Template variable extraction: `/#\{([^}]+)\}/g` regex pattern
   - Common variable input UI (inline form with labeled inputs)
   - Advanced variable input modal trigger button
   - Automatic variable detection on template selection
   - Read-only template content (variables entered separately)
   - **Button URL input UI**: Templates store `buttonCode` and `buttonName` only; URLs entered at send time
   - Button structure conversion: UI buttons → `attachments: { buttons: [...] }` format
   - **Critical**: Button interface uses `buttonCode` and `buttonName` fields (NOT `name`)

3. **Variable Modal** - [src/components/modals/TemplateVariableInputModal.tsx](src/components/modals/TemplateVariableInputModal.tsx)
   - Excel-style table interface for per-recipient variables
   - Shows common variable values as placeholders
   - Only sends non-empty recipient-specific variables
   - Full CRUD on recipient variable overrides
   - Responsive design with horizontal scroll for many variables

4. **MTS API Function** - [src/lib/mtsApi.ts](src/lib/mtsApi.ts#L970-L1113) (Lines 970-1113)
   - Function: `sendNaverTalk()`
   - 100% MTS API v1.2 specification compliant
   - Supports all productCodes: INFORMATION, BENEFIT, CARDINFO
   - Nested attachments structure for buttons and images
   - Automatic phone number normalization (82 prefix)
   - messageKey generation: YYYYMMDD-일련번호

**Key Features**:
- ✅ Template-based messaging (검수 필수)
- ✅ Server-side variable substitution (MTS API handles #{variable})
- ✅ Common variables (모든 수신자 동일)
- ✅ Per-recipient variables (개별 설정)
- ✅ Button support (WEB_LINK, APP_LINK)
- ✅ Image attachment (sampleImageHashId)
- ✅ Dual server routing (CARDINFO vs others)
- ✅ Async/scheduled sending support

**Button Handling** (⚠️ Critical Implementation Detail):
1. **Template Registration**: Stores only `buttonCode` and `buttonName` (NO URLs)
   ```typescript
   interface NaverTalkTemplate {
     buttons?: Array<{
       type: 'WEB_LINK' | 'APP_LINK';
       buttonCode: string;  // Unique identifier (e.g., "BTN000001")
       buttonName: string;  // Display text (e.g., "배송 조회")
     }>;
   }
   ```

2. **Message Send**: URLs provided dynamically per message
   ```typescript
   // User enters URLs in NaverTalkContent UI
   buttonUrls[btn.buttonCode] = {
     mobileUrl: 'https://tracking.example.com/12345',  // Required
     pcUrl: 'https://tracking.example.com/12345'       // Optional for WEB_LINK
   };
   ```

3. **Why This Design?**: Enables **dynamic URLs per recipient** (e.g., unique tracking links)
   - Example from MTS docs: "배송조회 (배송사, 송장번호가 매번 다른 경우)"
   - Template defines button appearance, send-time defines button action

**Testing Status**:
- ✅ Backend API verified (100% MTS spec compliant)
- ✅ UI-Backend integration verified (완전 호환)
- ⏸️ Real message delivery test pending (MTS 템플릿 검수 필요)

**Known Limitations**:
- 테이블형(TABLE) 템플릿: UI 미구현 (backend ready, `push_notice`, `table_info` 필드)
- 이미지 업로드: UI 미구현 (backend ready, `sampleImageHashId` 필드)
- 예약 발송: UI 미구현 (backend ready, `sendDate` parameter)

## Key Documentation Files

### Project Analysis & Status
- `MTS_MESSAGE_코드베이스_분석_v4.1.md` - Comprehensive codebase analysis (v5.2, 2025-11-05)
  - Complete file inventory (349 TypeScript files)
  - API endpoint catalog (163 endpoints)
  - Implementation status matrix
  - Line-by-line code references
- `MTS_API_통합_테스트_가이드.md` - MTS API integration testing guide (v3.0)
  - Phase-by-phase testing procedures
  - Real message delivery verification
  - Known issues and workarounds
- `MTS_API_사용_현황_템플릿.txt` - MTS API usage summary
  - Quick reference for implemented features
  - API function signatures

### Migration & Schema
- `/migrations/README_PHASE2_MIGRATIONS.md` - Reservation message system migrations
- `/migrations/20251103_extend_sms_templates_for_friendtalk.sql` - FriendTalk template support

### Issue Tracking
- `MTS_브랜드메시지_에러1028_문의사항.txt` - Kakao Brand Message error troubleshooting (resolved with 변수분리방식 v1.1)
- `문서_업데이트_요약_20251103.md` - Documentation update summary

## TypeScript Build Considerations

### Known Build Issues

1. **404 Page Static Generation Error**: The build process may fail during static page generation with error about `<Html>` import from `next/document`. This is a pre-existing issue unrelated to TypeScript errors. TypeScript compilation itself passes successfully (`✓ Compiled successfully`). If encountering this error:
   - Verify TypeScript errors are fixed: `npx tsc --noEmit`
   - Check that linting passes: `npm run lint`
   - The static generation error requires separate investigation
   - Additional prerendering errors may appear (e.g., `TypeError: Cannot read properties of undefined (reading 'env')`) - these are also unrelated to TypeScript and occur during static generation phase

### Known Type Patterns
When working with MTS API or Supabase, you may encounter these TypeScript patterns:

1. **Record<string, unknown> Assignment**: When building dynamic objects, create intermediate typed variables:
   ```typescript
   // ❌ Avoid direct assignment to unknown
   requestBody.coupon_variable = {};
   requestBody.coupon_variable.url_pc = url; // Type error

   // ✅ Use intermediate variable
   const couponVar: Record<string, string | number> = {
     description: '',
     url_mobile: ''
   };
   couponVar.url_pc = url; // Type safe
   requestBody.coupon_variable = couponVar;
   ```

2. **Supabase Client Type**: For internal functions, use `any` with ESLint disable:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async function syncTemplatesInBackground(supabase: any, templates: Array<...>) {
   ```

3. **Date Constructor with Unknown Types**: Add type assertion:
   ```typescript
   // ❌ Type error with unknown
   new Date(mtsData.modifiedAt)

   // ✅ Type assertion
   new Date(mtsData.modifiedAt as string)
   ```

4. **React Ref Callbacks**: Ref callbacks must return void, not a value:
   ```typescript
   // ❌ WRONG - Returns assignment value
   ref={(el) => (fileInputRefs.current[index] = el)}

   // ✅ CORRECT - Returns void with curly braces
   ref={(el) => { fileInputRefs.current[index] = el; }}
   ```

5. **ESLint Warnings**: Comment unused variables intended for future use:
   ```typescript
   // totalCost는 향후 결제 시스템 연동 시 사용 예정
   // const totalCost = recipients.length * costPerMessage;
   ```

6. **Next.js 15 Dynamic Route Params**: In Next.js 15, `params` in dynamic routes is now a Promise:
   ```typescript
   // ❌ OLD - Next.js 14 style (causes type error)
   export async function GET(
     request: NextRequest,
     { params }: { params: { groupId: string } }
   ) {
     const { groupId } = params; // Error in Next.js 15
   }

   // ✅ NEW - Next.js 15 style
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ groupId: string }> }
   ) {
     const { groupId } = await params; // Must await
   }
   ```

### Setup & Configuration
- `README.md` - Detailed setup instructions for Supabase, Storage, Templates
- `NOTIFICATION_SETUP_GUIDE.md` - Notification system setup
- `.env.local.example` - Environment variable template

## Common Mistakes and Gotchas

### 1. Variable Substitution Timing
**Problem**: Replacing variables at the wrong layer causes errors or double-substitution.

**Rule**:
- **Client-side**: SMS/MMS, FriendTalk, Brand Messages → Use `replaceStandardVariables()` before sending
- **Server-side**: AlimTalk, Naver TalkTalk → Send raw `#{variable}`, let MTS API substitute

```typescript
// ❌ WRONG - AlimTalk (MTS will fail to find #{variable})
const message = replaceStandardVariables(template, vars);
sendKakaoAlimtalk({ message });

// ✅ CORRECT - AlimTalk
sendKakaoAlimtalk({ message: template }); // MTS substitutes server-side

// ✅ CORRECT - FriendTalk
const message = replaceStandardVariables(template, vars);
sendFriendtalk({ message }); // Already substituted
```

### 2. MTS API Nested Object Structures
**Problem**: Many MTS API parameters require nested objects, not flat fields.

**Common Cases**:
- Brand CAROUSEL_FEED: `carousel_item_variable: { list: [...] }`
- Brand COMMERCE: `commerce_variable: { commerce: {...} }`
- Brand PREMIUM_VIDEO: `video_variable: { video: {...} }`
- Naver TalkTalk: `attachments: { buttons: [...] }`

```typescript
// ❌ WRONG - Flat structure
const requestBody = {
  carousel_item_variable: [{ header, content, imageUrl }] // MTS rejects
};

// ✅ CORRECT - Nested structure
const requestBody = {
  carousel_item_variable: {
    list: [{ header, content, imageUrl, buttons }]
  }
};
```

**Always check** `/docs/연동규격서/` for exact MTS API field structure.

### 3. Missing JWT Authentication
**Problem**: Forgetting `validateAuthWithSuccess()` causes 401 errors.

```typescript
// ❌ WRONG - No auth check
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Direct DB access without userId → Security hole
}

// ✅ CORRECT - Auth first
export async function POST(request: NextRequest) {
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid) return authResult.errorResponse;
  const { userId } = authResult.userInfo;
  // Now safe to use userId
}
```

### 4. Exposing Service Role Key
**Problem**: Using `SUPABASE_SERVICE_ROLE_KEY` in client components bypasses RLS.

```typescript
// ❌ WRONG - Client component
'use client';
const supabase = createClient(url, serviceRoleKey); // Security vulnerability!

// ✅ CORRECT - Server-side only
// In API route:
const supabase = createClient(url, serviceRoleKey); // OK
```

**Never**:
- Import service role key in client components
- Log service role key in console
- Expose in browser DevTools Network tab

### 5. Image Size Limits
**Problem**: Different message types have different image size limits.

- SMS/MMS: 300KB after Sharp optimization
- Kakao FriendTalk: 500KB max
- Kakao Brand: Varies by type (typically 500KB-2MB)
- Naver: Check template requirements

**Always** use Sharp for pre-processing before upload.

### 6. Button Type Limits
**Problem**: Each message type has different button count limits and types.

- FriendTalk FT/FI: Max 5 buttons (WL/AL/BK/MD types supported)
- FriendTalk FW/FL: Max 2 buttons (WL/AL/BK/MD types supported)
- FriendTalk FC: Max 1-2 buttons **per carousel** (WL/AL/BK/MD types supported)
- Brand Messages: Max 5 buttons
- AlimTalk: Max 5 buttons

**Button Types**:
- **WL** (웹링크): Requires url_mobile (required), url_pc (optional)
- **AL** (앱링크): Requires app scheme in url_mobile (no URL format validation)
- **BK** (봇키워드): No URL required, sends keyword on click
- **MD** (메시지전달): No URL required, connects to agent

### 7. Targeting Types (Brand Messages)
**Problem**: Using 'M' or 'N' targeting without business verification fails.

```typescript
// ❌ WRONG - Production targeting without verification
targetingType: 'M' // Fails if business conditions not met

// ✅ CORRECT - Use 'I' for testing
targetingType: 'I' // Internal test, works immediately
```

**Error Codes**:
- 1028: Targeting issue (use 'I' for testing)
- 3016: Message doesn't match template (check variable structure)

### 8. Polling vs Realtime Subscriptions
**Problem**: Creating Supabase Realtime subscriptions adds connection overhead.

```typescript
// ❌ AVOID - Realtime subscriptions
const subscription = supabase
  .channel('balance')
  .on('postgres_changes', ...)
  .subscribe();

// ✅ CORRECT - Use polling pattern
const interval = setInterval(async () => {
  const { data } = await fetch('/api/balance');
  setBalance(data);
}, 30000);
```

**Why?** Polling is simpler, more deployment-compatible, and matches existing context patterns.

### 9. MTS API Endpoint Routing
**Problem**: Different message types route to different MTS servers.

```typescript
// Regular MTS API
const url = `${MTS_API_URL}/v1/kakao/alimtalk/send`;

// Template API (different host)
const url = `${MTS_TEMPLATE_API_URL}/kakao/v2/template`;

// Naver CARDINFO (special case)
if (productCode === 'CARDINFO') {
  const url = 'https://mtscard1.mtsco.co.kr:41310/v1/naver/talk/send';
}
```

**Check** mtsApi.ts lines 970-1113 for Naver routing logic.

### 10. Character Limits and Line Breaks
**Problem**: MTS API validates character counts and line break limits strictly.

- FW message: 76 chars, 1 line break
- FL header: 20 chars, no line breaks
- FL item title: 25 chars, 1 line break
- FC content: 180 chars, 2 line breaks

**UI validation** must match MTS API validation exactly.

### 11. FL/FC Type Special Requirements (Critical!)
**Problem**: FL/FC types have unique requirements that cause ER99 errors if not handled correctly.

**FL/FC are ad-only types** - They CANNOT use conversion fallback (tran_type/tran_callback/tran_message).

**Critical Requirements** (Lines 607-614, 710-715 in `src/lib/mtsApi.ts`):
```typescript
// 1. NO message field for FL/FC types
if (finalMessageType === 'FL' || finalMessageType === 'FC') {
  requestBody.ad_flag = 'Y';  // Force ad flag
  // Do NOT add message field
} else {
  requestBody.message = message;  // Only for FT/FI/FW
}

// 2. NO conversion fields for FL/FC types
if (tranType && tranMessage && finalMessageType !== 'FL' && finalMessageType !== 'FC') {
  requestBody.tran_type = tranType;
  requestBody.tran_callback = cleanCallbackNumber;
  requestBody.tran_message = tranMessage;
}
```

**Why?**
- FL/FC use `header`, `item.list`, or `carousel.list` instead of `message`
- Empty `message: ""` causes MTS API JSON parsing error (ER99)
- FL/FC are ad-only, so SMS conversion is not allowed
- Including tran_* fields causes MTS API to reject the request

**UI Requirements**:
- Auto-set adFlag='Y' when FL/FC selected (useEffect in FriendtalkTab.tsx Line 135-139)
- Disable ad flag checkbox for FL/FC types
- Show notice: "* FL/FC 타입은 광고 발송만 가능합니다"

**Error Code**: ER99 (UnhandledDataProgressException) typically indicates wrong field structure or unnecessary fields.

### 12. Brand Message COMMERCE Type Variable Structure (Critical!)
**Problem**: COMMERCE type sends 1030 (InvalidParameterException) even with correct data.

**Root Cause**: `*_variable` field naming must match MTS API documentation exactly.

**Required Structure** (from MTS 변수분리방식 v1.1 docs):
```typescript
const requestBody = {
  // 1. message_variable: REQUIRED even if template has no variables
  message_variable: { "변수": "변수" }, // At least one key-value pair

  // 2. button_variable: Keys must be url1, url2 (NOT link1, link2)
  button_variable: {
    "url1": "https://example.com/mobile",  // 버튼1 모바일링크
    "url2": "https://example.com/pc"       // 버튼1 PC링크 (optional)
  },

  // 3. image_variable: Must include img_link
  image_variable: [{
    "img_url": "https://example.com/image.jpg",
    "img_link": "https://example.com"  // REQUIRED for COMMERCE type
  }],

  // 4. commerce_variable: Korean field names
  commerce_variable: {
    "정상가격": "1500000",
    "할인가격": "1200000",
    "할인율": "20",         // Optional
    "정액할인가격": "300000" // Optional - MUST OMIT if null/undefined
  },

  // 5. coupon_variable: Required if template has coupon registered
  coupon_variable: {
    "상세내용": "쿠폰 설명",
    "mobileLink": "https://example.com/coupon",
    "pcLink": "https://example.com/coupon"  // Optional
  }
};
```

**Common Mistakes**:
1. ❌ `button_variable: { link1: "..." }` → ✅ `button_variable: { url1: "..." }`
2. ❌ Missing `message_variable` → ✅ Always include even with dummy value
3. ❌ `image_variable: [{ img_url: "..." }]` → ✅ Add `img_link` field
4. ❌ `"정액할인가격": "null"` → ✅ Omit field entirely if no value

**How to Debug 1030 Error**:
1. Query MTS template to see registered structure:
   ```bash
   POST https://talks.mtsco.co.kr/mts/api/direct/state/template
   { "authCode": "...", "code": "TEMPLATE_CODE" }
   ```
2. Check if template has: buttons, commerce, coupon, image
3. Ensure all registered components have corresponding `*_variable` fields
4. Verify Korean field names match exactly

**Reference**: MTS_카카오브랜드메시지_기본형_변수분리방식_Restful_Interface_Guide_v1.1.pdf

---

## Variable Insertion UI Pattern

### Overview
The application provides a consistent variable insertion experience across message types that support client-side variable substitution.

### Pattern: VariableSelectModal

**Used in**: SMS/LMS/MMS, FriendTalk (FT/FI/FW types)

**Available Variables** (9 total, 3 categories):

**📌 수신자 정보**
- `#{이름}` - Recipient name
- `#{전화번호}` - Recipient phone number
- `#{그룹명}` - Recipient group name

**📅 날짜/시간**
- `#{오늘날짜}` - Today's date
- `#{현재시간}` - Current time
- `#{요일}` - Day of week

**👤 발신자 정보**
- `#{발신번호}` - Sender phone number
- `#{회사명}` - Company name
- `#{담당자명}` - Contact person name

### Implementation Pattern

**Files involved**:
- `src/components/modals/VariableSelectModal.tsx` - Reusable modal component
- `src/components/messages/SmsMessageContent.tsx` - SMS implementation (reference)
- `src/components/messages/FriendtalkTab.tsx` - FriendTalk implementation (Lines 71, 439-455, 1123, 1253)

**Implementation steps**:

1. **Import the modal component**:
```typescript
import VariableSelectModal from "../modals/VariableSelectModal";
```

2. **Add state for modal visibility**:
```typescript
const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
```

3. **Create variable selection handler**:
```typescript
const handleVariableSelect = (variable: string) => {
  const textarea = messageInputRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const newText = message.substring(0, start) + variable + message.substring(end);

  setMessage(newText);

  // Restore focus and cursor position
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + variable.length, start + variable.length);
  }, 0);
};
```

4. **Update button to open modal**:
```typescript
<button
  className="p-2 text-gray-500 hover:text-gray-700"
  onClick={() => setIsVariableModalOpen(true)}
  title="치환문구 추가"
>
  <FileText className="w-4 h-4" />
</button>
```

5. **Add modal component**:
```typescript
<VariableSelectModal
  isOpen={isVariableModalOpen}
  onClose={() => setIsVariableModalOpen(false)}
  onSelect={handleVariableSelect}
/>
```

### Benefits

- **Consistent UX**: Same variable selection across SMS and FriendTalk
- **Better Discoverability**: Users can see all available variables
- **Reduced Errors**: No manual typing of variable names
- **Faster Input**: Click-to-insert is faster than typing

### Alternative: Template-based Variable Systems

For **server-side variable substitution** (AlimTalk, Naver TalkTalk):
- No UI for variable insertion
- Variables defined in templates
- MTS API handles substitution
- Use `TemplateVariableInputModal` for per-recipient variable values

---

## Documentation Cross-References

### Testing Documentation
- **[MTS_API_통합_테스트_가이드.md](MTS_API_통합_테스트_가이드.md)** (v4.3, 2025-11-14)
  - Master test plan for MTS API integration
  - Phase-by-phase testing procedures (Phase 1-6)
  - Real message delivery verification results
  - Known issues and workarounds
  - **Use this for**: Testing new message types, debugging MTS API errors
- **[docs/quick-test-scenarios.md](docs/quick-test-scenarios.md)**
  - 30-minute core features test
  - **Use this for**: Quick smoke testing before deployment
- **[docs/manual-test-guide-3weeks.md](docs/manual-test-guide-3weeks.md)**
  - Comprehensive 3-week test plan
  - **Use this for**: Full regression testing

### Codebase Analysis
- **[MTS_MESSAGE_코드베이스_분석_v4.1.md](MTS_MESSAGE_코드베이스_분석_v4.1.md)** (v5.2, 2025-11-05)
  - Complete file inventory (349 TypeScript files)
  - API endpoint catalog (182 endpoints)
  - Implementation status matrix
  - Line-by-line code references
  - **Use this for**: Understanding codebase structure, finding specific implementations

### Migration & Schema
- **[migrations/README_PHASE2_MIGRATIONS.md](migrations/README_PHASE2_MIGRATIONS.md)**
  - Reservation message system migrations
  - **Use this for**: Understanding database schema evolution
- **[migrations/20251103_extend_sms_templates_for_friendtalk.sql](migrations/20251103_extend_sms_templates_for_friendtalk.sql)**
  - FriendTalk template support migration
  - **Use this for**: Template system schema reference

### Setup Guides
- **[README.md](README.md)**
  - Detailed setup instructions for Supabase, Storage, Templates
  - **Use this for**: Initial project setup
- **[NOTIFICATION_SETUP_GUIDE.md](NOTIFICATION_SETUP_GUIDE.md)**
  - Notification system setup
  - **Use this for**: Configuring real-time notifications
- **[.env.local.example](.env.local.example)**
  - Environment variable template
  - **Use this for**: Configuring environment variables

### Issue Tracking & Troubleshooting
- **[MTS_브랜드메시지_에러1028_문의사항.txt](MTS_브랜드메시지_에러1028_문의사항.txt)**
  - Kakao Brand Message error troubleshooting (resolved with 변수분리방식 v1.1)
  - **Use this for**: Understanding Brand Message targeting issues
- **[문서_업데이트_요약_20251103.md](문서_업데이트_요약_20251103.md)**
  - Documentation update summary
  - **Use this for**: Tracking documentation changes

### API Documentation Reference
- **[docs/연동규격서/](docs/연동규격서/)** (if exists)
  - MTS API specification documents
  - **Use this for**: Verifying exact MTS API field structures

## Architecture Decision Records

### Why Custom JWT instead of Supabase Auth?
**Decision**: Implement custom JWT authentication instead of using Supabase Auth.

**Reasoning**:
- Need for custom token expiration logic (1-hour access, 7-day refresh)
- Social login integration requirements (Google, Kakao, Naver)
- Business verification workflow via Korean government API
- Independent auth system allows migration to other databases if needed

**Trade-offs**:
- More code to maintain (AuthContext, JWT validation middleware)
- Manual token refresh implementation required
- ✅ Full control over auth flow and token structure

### Why Polling instead of Supabase Realtime?
**Decision**: Use polling (30s intervals) instead of Supabase Realtime subscriptions.

**Reasoning**:
- Simpler implementation and debugging
- No WebSocket connection management complexity
- More deployment-compatible (works with all hosting providers)
- Matches existing context patterns (NotificationContext, BalanceContext)
- Lower connection overhead for small-scale application

**Trade-offs**:
- 30-second delay for updates vs instant
- More API calls (though minimal for small user base)
- ✅ Simpler, more maintainable code

### Why JSONB for Template Metadata?
**Decision**: Store complex template data (buttons, images, variables) in JSONB `metadata` column instead of separate columns.

**Reasoning**:
- Different message types have vastly different structures (FriendTalk FL vs AlimTalk vs Brand)
- Flexible schema allows adding new message types without migrations
- Single table simplifies template management UI
- PostgreSQL JSONB provides indexing and query capabilities

**Trade-offs**:
- Less type safety in database layer (but TypeScript validates in app)
- Requires careful JSONB query construction
- ✅ Massive flexibility for evolving message formats

## CLAUDE.md Version History

### Version 2.3 (2025-11-25)
**Enhancements**:
- ✅ Added Next.js 15 Dynamic Route Params pattern to TypeScript Build Considerations
- ✅ Updated Known Build Issues section with additional prerendering error information
- ✅ Documented the `params: Promise<{}>` migration pattern for dynamic API routes

**Bug Fixes Documented**:
- Fixed dynamic route params type errors in `/api/kakao/groups/[groupId]/route.ts` and `/api/kakao/groups/[groupId]/profiles/route.ts`
- Added `templateVariables` and `smsBackup` properties to `NaverData` interface
- Added `partnerKey` and `code` properties to `LoadContentModal` metadata type
- Added `id` property to `AlimtalkTemplate` interface

**Content Stats**:
- ~1,450 lines (up from ~1,350)
- Added Next.js 15 migration pattern documentation

### Version 2.2 (2025-11-21)
**Enhancements**:
- ✅ Added Naver TalkTalk Button Handling section with critical implementation details
- ✅ Documented button structure: `buttonCode` and `buttonName` fields (NOT `name`)
- ✅ Explained two-phase button handling: template registration vs message send
- ✅ Added code examples for button URL management
- ✅ Clarified dynamic URL pattern for per-recipient customization

**Bug Fixes Documented**:
- Fixed NaverTalkContent.tsx button field access (`btn.name` → `btn.buttonCode`, `btn.buttonName`)
- Updated 7 locations in NaverTalkContent.tsx for correct button interface usage

**Content Stats**:
- ~1,350 lines (up from ~1,320)
- Added "Button Handling" subsection under "Naver TalkTalk Implementation Details"

### Version 2.1 (2025-11-17)
**Enhancements**:
- ✅ Added Variable Insertion UI Pattern section with complete implementation guide
- ✅ Documented VariableSelectModal integration in FriendTalk (FT/FI/FW types)
- ✅ Updated MTS API Implementation Status (FriendTalk variable UI completed)
- ✅ Added predefined variables list (9 variables across 3 categories)
- ✅ Included code examples for variable selection handler pattern

**Content Stats**:
- ~1,320 lines (up from ~900)
- 12 major sections (added Variable Insertion UI Pattern)
- 9 predefined variables documented
- 5-step implementation guide for VariableSelectModal

### Version 2.0 (2025-11-14)
**Major Enhancements**:
- ✅ Added Quick Start section with first-time setup checklist
- ✅ Added comprehensive Troubleshooting section (7 common issues)
- ✅ Enhanced Directory Structure with visual tree and key files
- ✅ Added Message Flow Architecture diagram (4-layer visualization)
- ✅ Expanded Common Development Tasks with step-by-step code examples
- ✅ Added Documentation Cross-References section
- ✅ Added Architecture Decision Records (ADRs)
- ✅ Added version history tracking
- ✅ Updated MTS API status (Phase 4.5 complete, FL/FC ER99 resolved)

**Content Stats**:
- ~900 lines (up from ~695)
- 11 major sections
- 7 troubleshooting guides
- 4 detailed development task guides
- 3 architecture decision records

### Version 1.0 (2025-11-05 - 2025-11-13)
**Initial Comprehensive Version**:
- Project overview and tech stack
- Environment variables and database schema
- MTS API integration status (Phases 1-6)
- Authentication & security considerations
- Testing approach (manual scenarios)
- Common mistakes and gotchas (11 sections)
- TypeScript build considerations
- Variable substitution rules
- Naver TalkTalk implementation details

---

**Last Updated**: 2025-11-25
**Maintained By**: Development Team
**Review Frequency**: Update after major features or breaking changes