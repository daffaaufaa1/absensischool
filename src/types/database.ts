export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';
export type GradeType = 'ulangan_harian' | 'tugas' | 'kegiatan_harian';

export interface Class {
  id: string;
  name: string;
  created_at: string;
}

export interface ClassLocation {
  id: string;
  name: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  photo_url: string | null;
  permit_file_url: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Journal {
  id: string;
  teacher_id: string;
  class_id: string;
  location_id: string;
  teaching_hours: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: GradeType;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface PengurusKelasAccess {
  id: string;
  student_id: string;
  class_id: string;
  granted_by: string;
  granted_at: string;
}
