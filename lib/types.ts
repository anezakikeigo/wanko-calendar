export type Dog = {
  id: string;
  name: string;
  breed: string | null;
  birthday: string | null;
  photo_url: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Event = {
  id: string;
  title: string;
  category_id: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  dogs?: Dog[];
};

export type DiaryEntry = {
  id: string;
  date: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventAttachment = {
  id: string;
  event_id: string;
  file_url: string;
  file_name: string | null;
  file_type: string;
  uploaded_at: string;
};

export type DiaryAttachment = {
  id: string;
  diary_entry_id: string;
  file_url: string;
  file_name: string | null;
  uploaded_at: string;
};
