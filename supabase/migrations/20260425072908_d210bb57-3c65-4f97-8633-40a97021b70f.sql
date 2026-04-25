-- Explicitly deny UPDATE on submissions for non-admins (admins already cannot update either; submissions are immutable)
CREATE POLICY "No one can update submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Explicitly deny UPDATE on user_roles for everyone (roles are managed only via INSERT/DELETE by admins)
CREATE POLICY "No one can update user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);