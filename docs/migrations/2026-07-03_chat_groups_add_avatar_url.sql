-- Add avatar_url to chat_groups so group chats can have a custom picture.
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS avatar_url text;
