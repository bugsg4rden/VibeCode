-- Users table is handled by Supabase Auth; store profile info here
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  username varchar(50),
  role varchar(20) DEFAULT 'user',
  is_banned boolean DEFAULT false,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  image_url text,
  source_url text,
  source_platform varchar(50),
  title varchar(255),
  credits text,
  status varchar(20) DEFAULT 'pending',
  rejection_reason text,
  created_at timestamp default now(),
  reviewed_at timestamp,
  reviewed_by uuid
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50),
  category varchar(50)
);

CREATE TABLE IF NOT EXISTS submission_tags (
  submission_id uuid REFERENCES submissions(id),
  tag_id uuid REFERENCES tags(id),
  PRIMARY KEY (submission_id, tag_id)
);

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name varchar(100),
  description text,
  is_public boolean DEFAULT false,
  cover_image_url text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS board_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES boards(id),
  submission_id uuid,
  external_image_url text,
  external_source varchar(50),
  added_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(50),
  user_id uuid,
  submission_id uuid,
  search_query text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(id),
  user_id uuid,
  reason varchar(30),
  description text,
  status varchar(20) DEFAULT 'pending',
  created_at timestamp default now(),
  reviewed_by uuid,
  reviewed_at timestamp
);
