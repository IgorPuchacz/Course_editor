export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}