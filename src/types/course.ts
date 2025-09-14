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

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  instructor_id: string;
  category: string;
  level: string;
  duration_hours: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}