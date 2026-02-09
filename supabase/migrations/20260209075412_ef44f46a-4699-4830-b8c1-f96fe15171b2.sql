-- Aktifkan pgcrypto extension untuk password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hapus semua data dari tabel yang ada
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.grades CASCADE;
TRUNCATE TABLE public.journals CASCADE;
TRUNCATE TABLE public.pengurus_kelas_access CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;

-- Hapus tabel classes lama dan buat ulang dengan kategori baru
TRUNCATE TABLE public.classes CASCADE;

-- Insert kategori kelas baru
INSERT INTO public.classes (name) VALUES
  ('X IPA 1'), ('X IPA 2'), ('X IPS 1'), ('X IPS 2'),
  ('XI IPA 1'), ('XI IPA 2'), ('XI IPS 1'), ('XI IPS 2'),
  ('XII IPA 1'), ('XII IPA 2'), ('XII IPS 1'), ('XII IPS 2');

-- Buat tabel students (siswa) dengan NIS login
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis VARCHAR(20) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel teachers (guru) dengan NIT login
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nit VARCHAR(20) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel admin_users untuk akses backend
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert admin default (username: 00000, password: adminabsensi)
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('00000', crypt('adminabsensi', gen_salt('bf')));

-- Enable RLS pada tabel baru
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk students
CREATE POLICY "Anyone can read students for login" 
  ON public.students FOR SELECT USING (true);

CREATE POLICY "Admin can insert students" 
  ON public.students FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update students" 
  ON public.students FOR UPDATE USING (true);

CREATE POLICY "Admin can delete students" 
  ON public.students FOR DELETE USING (true);

-- RLS Policies untuk teachers
CREATE POLICY "Anyone can read teachers for login" 
  ON public.teachers FOR SELECT USING (true);

CREATE POLICY "Admin can insert teachers" 
  ON public.teachers FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update teachers" 
  ON public.teachers FOR UPDATE USING (true);

CREATE POLICY "Admin can delete teachers" 
  ON public.teachers FOR DELETE USING (true);

-- RLS Policies untuk admin_users
CREATE POLICY "Anyone can read admin for login" 
  ON public.admin_users FOR SELECT USING (true);

-- Buat function untuk verify password
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Buat function untuk hash password
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Trigger untuk update timestamp
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();