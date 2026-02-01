-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('guru', 'siswa', 'pengurus_kelas');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('hadir', 'izin', 'sakit', 'alpha');

-- Create enum for grade type
CREATE TYPE public.grade_type AS ENUM ('ulangan_harian', 'tugas', 'kegiatan_harian');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    class TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create class_locations table
CREATE TABLE public.class_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status NOT NULL,
    check_in_time TIME,
    photo_url TEXT,
    permit_file_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, date)
);

-- Create journals table for teachers
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) NOT NULL,
    location_id UUID REFERENCES public.class_locations(id) NOT NULL,
    teaching_hours INTEGER NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create subjects table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    grade DECIMAL(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
    grade_type grade_type NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pengurus_kelas_access table for class officer access
CREATE TABLE public.pengurus_kelas_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (student_id, class_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus_kelas_access ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Create function to check if user is pengurus kelas for a class
CREATE OR REPLACE FUNCTION public.is_pengurus_kelas(_user_id UUID, _class_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.pengurus_kelas_access pka
        JOIN public.classes c ON c.id = pka.class_id
        WHERE pka.student_id = _user_id
          AND c.name = _class_name
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view roles" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "Users can insert own role" ON public.user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for classes
CREATE POLICY "Anyone can view classes" ON public.classes
FOR SELECT USING (true);

CREATE POLICY "Teachers can manage classes" ON public.classes
FOR ALL USING (public.has_role(auth.uid(), 'guru'));

-- RLS Policies for class_locations
CREATE POLICY "Anyone can view locations" ON public.class_locations
FOR SELECT USING (true);

CREATE POLICY "Teachers can manage locations" ON public.class_locations
FOR ALL USING (public.has_role(auth.uid(), 'guru'));

-- RLS Policies for attendance
CREATE POLICY "Users can view own attendance" ON public.attendance
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'guru')
);

CREATE POLICY "Users can insert own attendance" ON public.attendance
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'guru') OR public.has_role(auth.uid(), 'pengurus_kelas'));

CREATE POLICY "Teachers and pengurus can update attendance" ON public.attendance
FOR UPDATE USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'guru')
    OR public.has_role(auth.uid(), 'pengurus_kelas')
);

-- RLS Policies for journals
CREATE POLICY "Teachers can view all journals" ON public.journals
FOR SELECT USING (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Teachers can insert own journals" ON public.journals
FOR INSERT WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Teachers can update own journals" ON public.journals
FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own journals" ON public.journals
FOR DELETE USING (auth.uid() = teacher_id);

-- RLS Policies for subjects
CREATE POLICY "Anyone can view subjects" ON public.subjects
FOR SELECT USING (true);

CREATE POLICY "Teachers can manage subjects" ON public.subjects
FOR ALL USING (public.has_role(auth.uid(), 'guru'));

-- RLS Policies for grades
CREATE POLICY "Students can view own grades" ON public.grades
FOR SELECT USING (
    auth.uid() = student_id 
    OR public.has_role(auth.uid(), 'guru')
);

CREATE POLICY "Teachers can insert grades" ON public.grades
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Teachers can update grades" ON public.grades
FOR UPDATE USING (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Teachers can delete grades" ON public.grades
FOR DELETE USING (public.has_role(auth.uid(), 'guru'));

-- RLS Policies for pengurus_kelas_access
CREATE POLICY "Anyone can view pengurus access" ON public.pengurus_kelas_access
FOR SELECT USING (true);

CREATE POLICY "Teachers can grant pengurus access" ON public.pengurus_kelas_access
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Teachers can revoke pengurus access" ON public.pengurus_kelas_access
FOR DELETE USING (public.has_role(auth.uid(), 'guru'));

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON public.journals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default classes
INSERT INTO public.classes (name) VALUES 
('Kelas 7A'), ('Kelas 7B'), ('Kelas 7C'),
('Kelas 8A'), ('Kelas 8B'), ('Kelas 8C'),
('Kelas 9A'), ('Kelas 9B'), ('Kelas 9C'),
('Kelas 10A'), ('Kelas 10B'), ('Kelas 10C'),
('Kelas 11A'), ('Kelas 11B'), ('Kelas 11C'),
('Kelas 12A'), ('Kelas 12B'), ('Kelas 12C');

-- Insert default class locations
INSERT INTO public.class_locations (name) VALUES 
('Ruang 101'), ('Ruang 102'), ('Ruang 103'),
('Ruang 201'), ('Ruang 202'), ('Ruang 203'),
('Ruang 301'), ('Ruang 302'), ('Ruang 303'),
('Lab Komputer'), ('Lab IPA'), ('Lab Bahasa'),
('Perpustakaan'), ('Aula'), ('Lapangan');

-- Insert default subjects
INSERT INTO public.subjects (name) VALUES 
('Matematika'), ('Bahasa Indonesia'), ('Bahasa Inggris'),
('IPA'), ('IPS'), ('PKN'),
('Pendidikan Agama'), ('Seni Budaya'), ('PJOK'),
('Prakarya'), ('TIK'), ('Fisika'),
('Kimia'), ('Biologi'), ('Ekonomi'),
('Geografi'), ('Sejarah'), ('Sosiologi');