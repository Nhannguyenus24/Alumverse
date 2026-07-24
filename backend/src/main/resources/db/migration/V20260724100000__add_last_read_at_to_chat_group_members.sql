-- Track when each member last read a chat group. Used to compute a per-conversation
-- unread count (messages created after last_read_at, sent by someone other than the member)
-- so the chat list can surface unread conversations. NULL = the member has never opened
-- the conversation, so every message from others counts as unread.
ALTER TABLE public.chat_group_members
    ADD COLUMN last_read_at timestamp without time zone;

-- Backfill existing memberships as "read up to now" so the feature does not retroactively
-- flag every historical message as unread on first deploy (which would show a large unread
-- badge on every conversation for every user). Only messages received after deploy count.
UPDATE public.chat_group_members
SET last_read_at = CURRENT_TIMESTAMP
WHERE last_read_at IS NULL;
