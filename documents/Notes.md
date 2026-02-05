# Notes & Lists Implementation

## Overview
A collaborative note-taking and list-making tool for the family. Uses a masonry layout for visual organization.

## Features
- **Shared Workspace**: Every note is visible and editable by all family members.
- **Pinning**: Important notes/lists can be pinned to the top.
- **Masonry Layout**: Dynamic 2-column layout (Mobile) and 3-4 column layout (Desktop).
- **Real-time Updates**: Changes are reflected immediately across all devices.

## Technical Details
- **Grid System**: CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`.
- **Database**: `notes` table with `is_pinned` and `category`.
- **UX**: Auto-saving or explicit save options.
