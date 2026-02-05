# User Management & RBAC Implementation

## Overview
Implement the Role-Based Access Control (RBAC) and User Management system for FamilyOS. This allows admins to manage family members and for everyone to configure their API keys.

## Features
- **Admin Dashboard**: List all family profiles.
- **Role Promotion**: Admin can change roles (admin, member, kid).
- **API Key Management**: 
    - Global key (Admin only) stored in `app_settings`.
    - Personal key (All) stored in `user_settings`.
- **Responsive Design**: optimized for mobile, tablet, and desktop.

## Technical Details
- **Hook**: `usePermission` for UI-level access control.
- **Backend**: Supabase Auth + Profiles table.
- **Settings Storage**: `app_settings` for global, `user_settings` for personal configs.
