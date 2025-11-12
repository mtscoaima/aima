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
- `/src/app/` - Next.js app router pages and API routes (163 API endpoints, 57 pages)
  - `/api/` - Backend API endpoints (JWT auth, business logic)
    - `/messages/` - MTS messaging APIs (SMS, Kakao, Naver)
    - `/kakao/` - Kakao-specific APIs (profiles, templates, AlimTalk, FriendTalk, Brand)
    - `/naver/` - Naver TalkTalk APIs
    - `/auth/` - Authentication endpoints
    - `/users/` - User management
    - `/admin/` - Admin-only operations
  - `/admin/` - Admin dashboard pages
  - `/messages/` - Message composition interface
  - `/my-site/` - User profile and settings
  - Page routes follow folder structure
- `/src/components/` - Reusable React components (78 components)
  - `/messages/` - Message UI tabs (SMSTab, AlimtalkTab, FriendtalkTab, BrandTab, etc.)
  - `/kakao/` - Kakao-specific components (profile management, template management)
  - `/modals/` - Reusable modals (template save/load, content modals)
  - `/admin/` - Admin dashboard components
- `/src/contexts/` - React contexts (AuthContext, BalanceContext, NotificationContext, PricingContext)
- `/src/lib/` - Core utilities and API clients (16 modules)
  - `mtsApi.ts` - MTS API core functions (1850 lines, 19 functions)
  - `supabase.ts` - Supabase client initialization
- `/src/utils/` - Helper utilities (11 utilities)
  - `kakaoApi.ts` - Kakao API wrappers (336 lines, 6 functions)
- `/src/hooks/` - Custom React hooks (3 hooks)
- `/migrations/` - SQL migration files with timestamped naming

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
The application uses a layered approach for MTS API integration:
1. **Core Layer** (`src/lib/mtsApi.ts`): 19 core functions
   - Message sending: `sendSMS()`, `sendKakaoAlimtalk()`, `sendKakaoFriendtalk()`, `sendKakaoBrandMessage()`, `sendNaverTalktalk()`
   - Template management: `createKakaoTemplate()`, `getKakaoTemplates()`, etc.
   - Profile management: `getKakaoProfiles()`, `registerKakaoProfile()`, etc.
2. **Wrapper Layer** (`src/utils/kakaoApi.ts`): Simplified Kakao-specific wrappers
3. **API Routes** (`src/app/api/messages/`, `/kakao/`, `/naver/`): HTTP endpoints with JWT auth
4. **UI Components** (`src/components/messages/`): User-facing message composition tabs

### Image Handling for MTS
- **SMS/MMS Images**: Uploaded to MTS server, automatically optimized (PNG→JPEG, resize)
- **Kakao Images**: Separate upload to Kakao image server for FriendTalk/Brand messages
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
- `MTS_API_통합_테스트_가이드.md` - MTS API integration testing guide (v3.5)
  - Phase 1-2: SMS/LMS/MMS ✅ Completed
  - Phase 3: Kakao AlimTalk ✅ Completed (including variable templates)
  - Phase 4: Kakao FriendTalk ✅ Completed
  - Phase 5: Naver TalkTalk ✅ **Completed** (UI/backend fully integrated with variable system)
  - Phase 6: Kakao Brand Messages ✅ **8 Types Implemented** (TEXT/IMAGE/WIDE verified, 5 new types structure fixed, 변수분리방식 v1.1)
    - Phase 6.0-6.4: TEXT/IMAGE/WIDE + buttons ✅ Verified (2025-11-10)
    - Phase 6.5-6.9: WIDE_ITEM_LIST/PREMIUM_VIDEO/COMMERCE/CAROUSEL_COMMERCE/CAROUSEL_FEED ✅ Structure Fixed (2025-11-12)
- No automated test framework currently configured
- Use Supabase dashboard for database verification
- Check MTS API response codes in browser DevTools

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
2. Save migration in `/migrations/` with timestamp format: `YYYYMMDD_description.sql`
3. Update TypeScript types if needed
4. Test with existing data
5. Document migration in `/migrations/README_*.md` if part of a feature phase

### Working with MTS API
1. All MTS functions are in `src/lib/mtsApi.ts`
2. Use environment variables: `MTS_AUTH_CODE`, `MTS_API_URL`, `MTS_TEMPLATE_API_URL`
3. Test with `TEST_CALLING_NUMBER` from `.env.local`
4. Check API responses in browser DevTools Network tab
5. Verify message logs in `message_logs` table
6. Reference `MTS_API_통합_테스트_가이드.md` for testing procedures

### Adding New Message Type
1. Add UI tab in `src/components/messages/[MessageType]Tab.tsx`
2. Create API endpoint in `src/app/api/messages/[type]/send/route.ts`
3. Add MTS API function in `src/lib/mtsApi.ts`
4. Update message type constants and TypeScript types
5. Add template support in `sms_message_templates` table
6. **Important**: Check MTS API documentation for required data structure
   - Many MTS API parameters require **nested object structures**, not flat fields
   - Example: CAROUSEL types need `{ list: [...] }`, COMMERCE needs `{ commerce: {...} }`, VIDEO needs `{ video: {...} }`
   - Always verify field names match API spec (camelCase vs snake_case)
7. Test thoroughly with `MTS_API_통합_테스트_가이드.md`

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

### MTS API Migration Status
- **Completed**: SMS/LMS/MMS, Kakao AlimTalk, Kakao FriendTalk (FT/FI with buttons), **Kakao Brand Messages (3 types: TEXT/IMAGE/WIDE verified ✅)**
- **Structure Fixed, Testing Pending**: Brand Messages 5 new types (CAROUSEL_FEED, COMMERCE, CAROUSEL_COMMERCE, PREMIUM_VIDEO, WIDE_ITEM_LIST)
- **Completed**: Naver TalkTalk ✅ (UI with variable system, backend API integration, template support)
- **Not Implemented**: FriendTalk advanced types (FW/FL/FC)
- **Reference**: `MTS_API_통합_테스트_가이드.md` for detailed testing status
- **Core Module**: `src/lib/mtsApi.ts` (1850 lines, 19 functions)
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
   - Button structure conversion: UI buttons → `attachments: { buttons: [...] }` format

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

4. **ESLint Warnings**: Comment unused variables intended for future use:
   ```typescript
   // totalCost는 향후 결제 시스템 연동 시 사용 예정
   // const totalCost = recipients.length * costPerMessage;
   ```

### Setup & Configuration
- `README.md` - Detailed setup instructions for Supabase, Storage, Templates
- `NOTIFICATION_SETUP_GUIDE.md` - Notification system setup
- `.env.local.example` - Environment variable template