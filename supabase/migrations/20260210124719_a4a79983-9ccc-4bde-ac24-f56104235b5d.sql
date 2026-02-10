
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate hash_password function to use extensions.crypt
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$function$;

-- Recreate verify_password function to use extensions.crypt
CREATE OR REPLACE FUNCTION public.verify_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN stored_hash = extensions.crypt(input_password, stored_hash);
END;
$function$;

-- Re-hash the admin password with the working function
UPDATE admin_users 
SET password_hash = public.hash_password('adminabsensi')
WHERE username = '00000';
