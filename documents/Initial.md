Build a comprehensive "FamilyOS" web application using **Vite + React + TailwindCSS** for the frontend and **Supabase** for the backend.

### 1. Project Architecture (Single-Tenant & Software-Level Security)
- **Context:** Single Family Application.
- **Database Security (RLS):** OPEN for all logged-in users. We trust the family members.
- **Access Control (Software Level):** - Permissions are enforced by **Frontend Logic** based on the user's `role`.
  - Roles: `admin` (Full access), `member` (Standard access), `viewer` (Read-only).
- **Key Management:** Dynamic API Keys (Database stored).
- **Mobile-First:** Optimized for touch interactions.

### 2. Tech Stack
- **Frontend:** React (Vite), TailwindCSS, Lucide React, React Router DOM, date-fns.
- **Backend:** Supabase Client.
- **AI:** Google Generative AI SDK (Client-side).
- **Image Processing:** `browser-image-compression`.

### 3. Database Schema (PostgreSQL)
Generate SQL migration.
**Global Audit:** `created_at`, `updated_at`, `updated_by` for all tables.

**Tables:**
1.  **profiles**: 
    - `id` (uuid, PK, ref `auth.users`).
    - `full_name`, `avatar_url`.
    - `role` (text, default 'member'). *Values: 'admin', 'member', 'kid'*.
2.  **app_settings**: `id`, `key` (unique), `value`. (Global configs).
3.  **user_settings**: `id`, `user_id`, `key`, `value`. (Personal configs).
4.  **transactions**: `id`, `user_id`, `amount`, `category`, `note`, `image_url`, `date`, `type`.
5.  **notes**: `id`, `title`, `content`, `is_pinned`.
6.  **messages**: `id`, `user_id`, `content`, `type`, `image_url`.

**RLS Policies (Permissive Mode):**
- **ALL Tables:** `CREATE POLICY "Enable All Access for Authenticated Users" ON [table_name] FOR ALL USING (auth.role() = 'authenticated');`
- *Note:* Do not create complex checks in SQL. We handle logic in React.


**Supabase Storage:**
- **Storage Bucket:** `family-os`
- **Storage Policies:**
  - `CREATE POLICY "Enable All Access for Authenticated Users" ON storage.buckets FOR ALL USING (auth.role() = 'authenticated');`
  - `CREATE POLICY "Enable All Access for Authenticated Users" ON storage.objects FOR ALL USING (auth.role() = 'authenticated');`

**Supabase migration:**
 - Manage use console.

### 4. Logic 1: Dynamic API Key Retrieval
Implement `getGeminiApiKey()`:
1.  Check `user_settings` for `GEMINI_API_KEY`.
2.  If missing, check `app_settings` for `GEMINI_API_KEY`.
3.  If both missing, throw error/prompt user.

### 5. Logic 2: Role-Based Access Control (RBAC) Hook
Create a custom hook `usePermission()`:
- **isAdmin**: true if `profile.role === 'admin'`.
- **canDelete**: true if `admin` or `member`.
- **canEditSettings**: true if `admin`.
- **canViewBudget**: true if `admin` or `member`.

### 6. Core Features

#### A. Settings Page (The Control Center)
- **User Management Section (Admin Only):**
  - List all profiles.
  - Dropdown to change `role` for each family member (e.g., Promote Mom to Admin, Set Child to Kid).
- **API Keys Section:**
  - Input for Global Key (Admin only).
  - Input for Personal Key (Everyone).

#### B. Expenses & AI Scanner
- **Logic:** Standard upload -> compress (1024px) -> `getGeminiApiKey()` -> Gemini API -> Fill Form.
- **Permission:**  `admin` and `member` can Delete transactions. Everyone can Add.

#### C. Dashboard & Chat
- Standard Spending Summary & Real-time Chat.

### 7. Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 8. UI/UX Design
- **Mobile First:** Optimized for mobile usability as the primary interface.
- **Coloring:** Consistent and accessible color palette across all components.
- **Responsive for Desktop:** Adaptive layouts using Grid/Flexbox for larger screen resolutions.

