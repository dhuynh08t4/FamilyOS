-- Migration to add theme settings to app_settings and user_settings

-- 1. App Settings: Global Default Theme
INSERT INTO public.app_settings (key, value)
VALUES ('DEFAULT_THEME', '{"color": "indigo", "mode": "auto"}')
ON CONFLICT (key) DO NOTHING;

-- 2. User Settings: Ensure individual theme preference can be stored
-- (Columns typically already exist in user_settings table)
-- We'll use 'THEME_PREFERENCE' key for each user.
