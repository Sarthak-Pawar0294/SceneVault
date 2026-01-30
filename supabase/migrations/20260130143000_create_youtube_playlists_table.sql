CREATE TABLE IF NOT EXISTS youtube_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  playlist_id text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail text,
  video_count integer NOT NULL DEFAULT 0,
  imported_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, playlist_id)
);

ALTER TABLE youtube_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own youtube_playlists"
  ON youtube_playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own youtube_playlists"
  ON youtube_playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own youtube_playlists"
  ON youtube_playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own youtube_playlists"
  ON youtube_playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_youtube_playlists_user_id ON youtube_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_playlists_playlist_id ON youtube_playlists(playlist_id);
