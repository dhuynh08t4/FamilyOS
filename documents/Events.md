# Calendar & Events Module

The Events module provides a comprehensive system for managing family schedules, supporting both Solar (Dương lịch) and Lunar (Âm lịch) calendars with advanced recurrence patterns.

## Features
- **Dual Calendar Support**: Toggle between Solar and Lunar views.
- **Accurate Lunar Conversion**: Built-in Vietnamese Lunar Calendar algorithm (Hồ Ngọc Đức).
- **Advanced Recurrence**:
  - Daily, Weekly, Monthly, Yearly.
  - Support for Lunar repeating events (e.g., Death anniversaries/Giỗ).
  - Monthly boundary handling (automatically handles 29th/30th day shifts).
- **Reminders**: Integrated reminder system with custom intervals (Same day, 1 day before, 1 week before, etc.).
- **Visual Distinction**:
  - Blue/Sun icon for Solar events.
  - Orange/Moon icon for Lunar events.

## Technical Details
- **Storage**: All events are stored in the `events` table in Supabase.
- **Normalization**: The `start_date` column stores the **Solar** date as the source of truth.
- **Lunar Sync**: The UI provides a dual-input system that synchronizes Solar and Lunar dates in real-time using `lunar.ts` utilities.
- **Recurrence Logic**: Calculated on-the-fly in the `renderCalendar` loop for optimal UI responsiveness.

## Database Schema
Table: `events`
| Column | Type | Description |
| --- | --- | --- |
| id | uuid | Primary Key |
| user_id | uuid | Reference to profile |
| title | text | Event name |
| description | text | Details |
| is_lunar | boolean | Flag for lunar recurrence |
| start_date | date | Solar date reference |
| repeat_type | text | none, daily, weekly, monthly, yearly |
| reminders | jsonb | Array of days before |
