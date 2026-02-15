export type UserRole = 'guru' | 'siswa' | 'pengurus_kelas' | 'super_admin';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  class: string | null;
  avatar_url: string | null;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  school_id: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
  role: UserRole | null;
  school_id: string | null;
}
