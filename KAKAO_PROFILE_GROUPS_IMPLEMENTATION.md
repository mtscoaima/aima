# Kakao Profile Group Management Implementation

**Status**: ✅ Fully Implemented (2025-11-17)

**Purpose**: Manage Kakao sender profiles in groups for shared template usage across multiple profiles.

## Core Components

### 1. Database Schema
Two new tables with INTEGER primary keys to match existing schema:

- **`kakao_profile_groups`** - Group metadata
  - `id` (SERIAL PRIMARY KEY)
  - `user_id` (INTEGER, references users)
  - `group_key` (TEXT UNIQUE) - MTS group identifier
  - `name` (TEXT) - User-defined group name
  - `description` (TEXT, nullable)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

- **`kakao_profile_group_members`** - Junction table for many-to-many relationship
  - `id` (SERIAL PRIMARY KEY)
  - `group_id` (INTEGER, references kakao_profile_groups)
  - `profile_id` (INTEGER, references kakao_sender_profiles)
  - `added_at` (TIMESTAMPTZ)
  - `added_by` (INTEGER, nullable, references users)
  - UNIQUE constraint on (group_id, profile_id)

- **`kakao_sender_profiles.group_id`** - Denormalized reference for fast UI filtering

### 2. Backend APIs
7 endpoints across 3 route files:

#### `/api/kakao/groups`
- **GET** - List all groups for authenticated user
- **POST** - Create new group (requires groupKey, name, optional description)

#### `/api/kakao/groups/[groupId]`
- **GET** - Get single group details
- **PUT** - Update group name/description
- **DELETE** - Delete group (CASCADE deletes members)

#### `/api/kakao/groups/[groupId]/profiles`
- **GET** - Query profiles in group from MTS API
- **POST** - Add profile to group (syncs to MTS + local DB)
- **DELETE** - Remove profile from group (syncs to MTS + local DB)

### 3. MTS API Integration
**File**: [src/lib/mtsApi.ts](src/lib/mtsApi.ts) (Lines 2915-3186)

Three functions wrapping MTS API calls:

```typescript
export async function fetchGroupProfiles(groupKey: string): Promise<MtsApiResult & { profiles?: Array<Record<string, unknown>> }>

export async function addProfileToGroup(groupKey: string, senderKey: string): Promise<MtsApiResult>

export async function removeProfileFromGroup(groupKey: string, senderKey: string): Promise<MtsApiResult>
```

**MTS API Endpoint**: `https://talks.mtsco.co.kr/mts/api/group/*`

### 4. UI Components

#### [GroupListPanel.tsx](src/components/kakao/GroupListPanel.tsx)
- Main group list with card layout
- Create/Delete/View actions
- Empty state with instructions
- Displays group count and creation date

#### [CreateKakaoGroupModal.tsx](src/components/modals/CreateKakaoGroupModal.tsx)
- Form with groupKey, name, description fields
- Validation (groupKey and name required)
- Help text explaining groupKey acquisition
- Success callback triggers parent refresh

#### [KakaoGroupDetailModal.tsx](src/components/modals/KakaoGroupDetailModal.tsx)
- View/edit group metadata
- List profiles in group (from MTS API)
- Add/remove profile actions
- Profile count and member list display

#### [AddProfileToGroupModal.tsx](src/components/modals/AddProfileToGroupModal.tsx)
- Search profiles by name/senderKey/phone
- Filters out profiles already in group
- Single-select with visual feedback
- Syncs to both MTS API and local DB

## Key Implementation Notes

### groupKey Acquisition
**MTS Documentation** (`카카오 발신프로필관리 자동화 API v20251002.txt`, lines 1050-1052):
> "영업 담당자에게 요청 하시면 발신프로필 그룹 생성 후 발신 프로필 그룹키를 전달 드립니다."

Translation: Request from MTS sales team → group creation → groupKey delivery

**Similar Pattern**: Naver partnerKey was also documented as "request from MTS", but was actually available in Naver TalkTalk platform UI.

**Recommendation**: Check Kakao Business platform UI for groupKey before contacting MTS sales.

### No Group Creation API
MTS API only provides 3 endpoints:
1. Query profiles in group
2. Add profile to group
3. Remove profile from group

**Groups must be created via MTS sales request** - there is no API endpoint for group creation.

### Dual Data Storage Pattern
**Why two storage locations?**

1. **Junction Table** (`kakao_profile_group_members`)
   - Normalized database design
   - Tracks membership history (added_at, added_by)
   - Source of truth for membership

2. **Denormalized Field** (`kakao_sender_profiles.group_id`)
   - Performance optimization for UI filtering
   - Fast "show profiles in group X" queries
   - Simplified UI logic

**Data Consistency**: Managed at application layer - both locations updated in same transaction.

### Authentication Pattern
- Uses **custom JWT** authentication (not Supabase Auth)
- All routes use `validateAuth()` from `@/utils/authUtils`
- No RLS policies (auth.uid() not available)
- Authorization happens in API routes via JWT validation

### MTS API Sync Strategy
- **Local DB**: Metadata cache for fast UI rendering
- **MTS API**: Source of truth for actual group membership
- **Sync Points**:
  - Add profile: POST to MTS → Insert to local DB
  - Remove profile: DELETE from MTS → Delete from local DB
  - Query profiles: Always fetch from MTS (not cached)

## Common Operations

### Create Group
```typescript
POST /api/kakao/groups
Headers: { Authorization: "Bearer <JWT>" }
Body: {
  groupKey: "group_abc123",  // From MTS sales or Kakao platform
  name: "Marketing Team",
  description: "Main marketing profiles"
}
```

### Add Profile to Group
```typescript
POST /api/kakao/groups/[groupId]/profiles
Headers: { Authorization: "Bearer <JWT>" }
Body: {
  senderKey: "@sender_key",  // Kakao sender key
  profileId: "123"           // Local profile ID
}
```

### Query Group Profiles
```typescript
GET /api/kakao/groups/[groupId]/profiles
Headers: { Authorization: "Bearer <JWT>" }

Response: {
  success: true,
  profiles: [
    { senderKey: "@...", name: "...", ... }
  ],
  count: 5
}
```

## Reference Documentation

### MTS API Specification
**File**: `docs/temp_pdf_text/카카오 발신프로필관리 자동화 API v20251002.txt`
**Section**: 9. 발신 프로필 그룹 관리 (lines 1044-1295)

**Key Sections**:
- 9.1 그룹에 포함된 발신 프로필 조회 (line 1054)
- 9.2 그룹에 발신 프로필 추가 (line 1182)
- 9.3 그룹에 발신 프로필 삭제 (line 1238)

### Database Migrations
1. **`migrations/20251117_create_kakao_profile_groups.sql`**
   - Creates kakao_profile_groups table
   - Creates kakao_profile_group_members junction table
   - Adds indexes for performance
   - Includes updated_at trigger

2. **`migrations/20251117_update_kakao_sender_profiles_for_groups.sql`**
   - Adds group_id column to kakao_sender_profiles
   - Creates index on group_id
   - Sets ON DELETE SET NULL (profiles persist if group deleted)

## Testing Status

- ✅ **Database Migrations**: Applied successfully via Supabase MCP
- ✅ **Backend APIs**: 7 endpoints implemented with MTS integration
- ✅ **UI Components**: 4 components with modal-based workflow
- ✅ **Authentication**: JWT validation working correctly
- ✅ **Type Safety**: INTEGER keys match users table schema
- ⏸️ **Real MTS API Testing**: Pending (requires valid groupKey from MTS or Kakao platform)

## Known Issues & Limitations

### Integer vs UUID Type Mismatch
**Initial Issue**: First migration used UUID types but users table has INTEGER id.

**Resolution**: Changed all foreign keys to INTEGER, used SERIAL for auto-increment.

**Lesson**: Always check existing schema before creating new tables.

### RLS Policy Errors
**Initial Issue**: auth.uid() returned UUID, but user_id is INTEGER.

**Resolution**: Removed all RLS policies - custom JWT handles authorization at API level.

**Pattern**: This project doesn't use Supabase Auth, so RLS policies with auth.uid() don't work.

### Import Path Error
**Initial Issue**: Used `@/lib/jwt` for validateAuth import.

**Resolution**: Correct path is `@/utils/authUtils`.

**All Affected Files**:
- `/api/kakao/groups/route.ts`
- `/api/kakao/groups/[groupId]/route.ts`
- `/api/kakao/groups/[groupId]/profiles/route.ts`

## Future Enhancements

1. **Bulk Operations**: Add/remove multiple profiles at once
2. **Group Templates**: Share templates across group members
3. **Group Analytics**: Message volume and success rates per group
4. **Role-Based Access**: Group admin vs member permissions
5. **Audit Log**: Track all group membership changes
6. **groupKey Validation**: Check if groupKey exists in MTS before saving

## Integration with Existing Features

### Kakao Sender Profiles
- Group membership displayed in profile list
- Filter profiles by group
- Quick-add to group from profile view

### Kakao Templates
- Templates can be registered to groupKey (not individual senderKey)
- All group members share group templates
- Reduces template registration overhead

### Message Sending
- Select entire group as sender (future enhancement)
- Load-balance messages across group profiles
- Fallback to other group members if one fails

---

**Implemented**: 2025-11-17
**Last Updated**: 2025-11-17
**Author**: Development Team
**Related Feature**: Kakao Business Messaging (Phase 4-6)
