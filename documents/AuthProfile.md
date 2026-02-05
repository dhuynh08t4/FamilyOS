# Authentication & Profile Management

## Overview
Secure authentication system using Supabase Auth and personalized user profiles with self-service updates.

## Features
- **Secure Login**: Email/Password authentication.
- **Persistence**: Session managed via Supabase GoTrue.
- **My Profile**: 
    - Full Name & Nice Name updates.
    - Username management.
    - Role visibility.
- **Auth Guard**: Protected routes that redirect to login if no session exists.
- **Responsive Profile Editor**: Single-column mobile view, card-based desktop view.

## Technical Details
- **Auth State**: Monitored via `onAuthStateChange`.
- **Protected Layout**: Wrapper component that checks `supabase.auth.getSession()`.
