# Family Chat Implementation

## Overview
A real-time messaging platform for family coordination. It supports text messages, photos, and live delivery status.

## Features
- **Real-time Messaging**: Instant message delivery using Supabase Realtime (broadcast/presence).
- **Media Support**: Ability to share images (uploaded to `family-os` bucket).
- **Image Lightbox**: Click to zoom, navigate between images, and view in full screen.
- **Admin Controls**: Admins can delete individual messages or clear the entire chat history (including storage cleanup).
- **Presence**: Shows who is currently online (future enhancement).
- **Responsive Layout**: Sidebar for Desktop displaying the group and member list, full-screen for Mobile.
- **Member Directory**: Integrated sidebar showing all family members with their avatars and roles.
- **Member Search**: Real-time searching/filtering of family members in the sidebar.

## Technical Details
- **Subscription**: Dedicated channel `family_chat` for real-time insert events.
- **Storage**: Messaging assets are stored in `family-os/chat/`.
- **Database**: `messages` table with `user_id` and `content`.
