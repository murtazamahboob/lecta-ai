

## Plan: Full Feature Expansion for Lecture Ghost

This plan addresses all your requests: fixing the build error, adding sign-out/avatar header, making you admin, adding upload history, profile section, and email sign-in.

---

### Step 1: Fix Build Error

The `@lovable.dev/cloud-auth-js` package needs to be properly installed. Will use the Configure Social Auth tool to regenerate the lovable integration module, which handles package installation automatically.

### Step 2: Add Email Sign-In

Update `LoginPage.tsx` to include email/password sign-up and sign-in forms alongside Google OAuth. Add a tab or toggle between "Sign in with Google" and "Sign in with Email". Implement `signUp` and `signInWithPassword` via the Supabase auth client.

### Step 3: Database — New Tables

Create a migration with:

- **`profiles`** table: `id (uuid, FK auth.users)`, `display_name`, `avatar_url`, `created_at`, `updated_at`. Auto-create via trigger on signup. RLS: users read/update own profile.
- **`submissions`** table: `id`, `user_id (uuid)`, `subject`, `emails (text)`, `audio_filename`, `status (text)`, `created_at`. RLS: users can insert and read their own submissions.

### Step 4: Header with Avatar + Sign-Out

Create a `Header.tsx` component with:
- App logo/name on the left
- Navigation links (Home, History, Profile, Admin if admin)
- User avatar (from Google photo or initials fallback) + dropdown with Sign Out
- Add to the layout wrapping all protected pages

### Step 5: Make You Admin

Query the database for your user ID (after you sign in), then insert an admin role into `user_roles`.

### Step 6: History Page

Create `HistoryPage.tsx` at `/history`:
- Query `submissions` table for current user's entries
- Display as a list/table: subject, recipients, date, status
- Update `LectureUploadForm.tsx` to insert a row into `submissions` on successful send

### Step 7: Profile Page

Create `ProfilePage.tsx` at `/profile`:
- Show user email (read-only from auth)
- Editable display name and avatar URL
- Save updates to `profiles` table
- Clean card layout matching existing design

### Step 8: Update Routing

Add new routes in `App.tsx`:
- `/history` — protected
- `/profile` — protected

---

### Technical Details

- **Auth**: Google via `lovable.auth.signInWithOAuth`, Email via `supabase.auth.signUp`/`signInWithPassword`
- **RLS Policies**: All new tables get row-level security scoped to `auth.uid()`
- **Trigger**: `handle_new_user` function creates a profile row on every new signup
- **No auto-confirm**: Email users must verify their email before signing in

### Files to Create/Modify

| Action | File |
|--------|------|
| Regenerate | `src/integrations/lovable/index.ts` (via tool) |
| Create | `src/components/Header.tsx` |
| Create | `src/pages/HistoryPage.tsx` |
| Create | `src/pages/ProfilePage.tsx` |
| Modify | `src/pages/LoginPage.tsx` (add email auth) |
| Modify | `src/pages/Index.tsx` (add Header) |
| Modify | `src/components/LectureUploadForm.tsx` (save to DB) |
| Modify | `src/contexts/AuthContext.tsx` (add email auth methods) |
| Modify | `src/App.tsx` (new routes) |
| Migration | profiles + submissions tables + trigger |

