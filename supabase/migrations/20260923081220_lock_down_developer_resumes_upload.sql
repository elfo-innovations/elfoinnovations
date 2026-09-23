-- Security fix: the developer application flow uploaded resumes straight
-- from the browser to the private "developer-resumes" bucket using the
-- public anon key, before Turnstile verification / server-side validation
-- ran. Anyone with the anon key could call the Storage API directly and
-- upload arbitrary files to this bucket, bypassing the application
-- entirely.
--
-- Resume uploads now happen exclusively inside the submitDeveloperApplication
-- server function, using the service-role client, only after Turnstile
-- verification succeeds. The browser no longer needs (or gets) any INSERT
-- grant on this bucket, so the policy that allowed it is removed.
--
-- "Admins can read developer resumes" and "Admins can delete developer
-- resumes" are untouched — admin access to resumes is unaffected.
DROP POLICY IF EXISTS "Applicants can upload resumes" ON storage.objects;

-- Defense in depth: even though only the service-role client (which
-- bypasses RLS and these limits) can write to this bucket now, constrain
-- the bucket itself to PDF-only, 5MB max, matching the application's
-- existing resume requirements.
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB, matches RESUME_MAX_BYTES
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'developer-resumes';
