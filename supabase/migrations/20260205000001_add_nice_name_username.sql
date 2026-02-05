-- Add nice_name and username to profiles
ALTER TABLE public.profiles 
ADD COLUMN nice_name TEXT,
ADD COLUMN username TEXT UNIQUE;
