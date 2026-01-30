/*
  # Add YouTube Metadata Columns

  Adds new columns to store additional metadata from YouTube videos for better organization and context.

  1. Changes
    - `channel_name` (text): Name of the YouTube channel that uploaded the video
    - `upload_date` (timestamptz): When the video was originally uploaded to YouTube
    - `video_id` (text): Unique YouTube video identifier for direct video references

  2. Purpose
    - Enables filtering and sorting by channel
    - Tracks when videos were published
    - Simplifies YouTube integration by storing video ID separately from URL

  3. Migration Notes
    - New columns are nullable for backward compatibility with existing rows
    - Indexed on video_id for fast lookups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenes' AND column_name = 'channel_name'
  ) THEN
    ALTER TABLE scenes ADD COLUMN channel_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenes' AND column_name = 'upload_date'
  ) THEN
    ALTER TABLE scenes ADD COLUMN upload_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenes' AND column_name = 'video_id'
  ) THEN
    ALTER TABLE scenes ADD COLUMN video_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scenes_video_id ON scenes(video_id);
CREATE INDEX IF NOT EXISTS idx_scenes_channel_name ON scenes(channel_name);