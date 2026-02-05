# Avatar & Media Management

## Overview
Secure management of user avatars and static assets. Optimized for performance and storage efficiency.

## Avatar Upload
- **Bucket**: All user avatars are stored in the `avatar` bucket.
- **Optimization**: Images are automatically resized to a maximum of **256x256 pixels** before upload using `browser-image-compression`. This ensures fast loading and saves bandwidth.
- **Privacy**: Buckets are public for easy fetching via CDN URLs.

## Implementation Details
- **Frontend**: `imageCompression` utility handles resizing in a web worker.
- **Database**: The `profiles` table stores the `avatar_url` pointing to Supabase Storage.
- **Storage**: Files are named using user IDs to maintain uniqueness.
