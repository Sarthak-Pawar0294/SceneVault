/*
  # Create SceneVault Database Schema

  1. New Tables
    - `scenes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, required)
      - `platform` (text, enum-like: YouTube, JioHotstar, Zee5, SonyLIV, Other)
      - `category` (text, enum-like: F/M, F/F, M/F, M/M)
      - `url` (text, the video link)
      - `thumbnail` (text, thumbnail URL)
      - `timestamp` (text, e.g., "5:30" or "5:30-6:45")
      - `notes` (text, personal notes)
      - `status` (text, enum-like: available, unavailable, private)
      - `source_type` (text, manual or youtube_playlist)
      - `playlist_id` (text, optional, if imported from playlist)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scenes` table
    - Add policy for users to read their own scenes
    - Add policy for users to insert their own scenes
    - Add policy for users to update their own scenes
    - Add policy for users to delete their own scenes
*/

CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  platform text NOT NULL DEFAULT 'Other',
  category text NOT NULL,
  url text,
  thumbnail text,
  timestamp text,
  notes text,
  status text NOT NULL DEFAULT 'available',
  source_type text NOT NULL DEFAULT 'manual',
  playlist_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenes"
  ON scenes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scenes"
  ON scenes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenes"
  ON scenes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenes"
  ON scenes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_category ON scenes(category);
CREATE INDEX IF NOT EXISTS idx_scenes_platform ON scenes(platform);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);