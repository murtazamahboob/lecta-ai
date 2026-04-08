-- Disable realtime for submissions to prevent unauthorized channel subscriptions
ALTER PUBLICATION supabase_realtime DROP TABLE public.submissions;