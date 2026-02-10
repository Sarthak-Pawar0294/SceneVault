DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_playlists' AND column_name = 'last_checked'
  ) THEN
    ALTER TABLE youtube_playlists ADD COLUMN last_checked timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_youtube_playlists_last_checked ON youtube_playlists(last_checked);
