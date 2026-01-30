export type Platform = 'YouTube' | 'JioHotstar' | 'Zee5' | 'SonyLIV' | 'Other';
export type Category = 'F/M' | 'F/F' | 'M/F' | 'M/M';
export type Status = 'available' | 'unavailable';
export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';
export type SourceType = 'manual' | 'youtube_playlist';

export interface Scene {
  id: string;
  user_id: string;
  title: string;
  platform: Platform;
  category: Category;
  url?: string;
  thumbnail?: string;
  timestamp?: string;
  notes?: string;
  status: Status;
  source_type: SourceType;
  playlist_id?: string;
  video_id?: string;
  channel_name?: string;
  upload_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SceneFormData {
  title: string;
  platform: Platform;
  category: Category;
  url?: string;
  thumbnail?: string;
  timestamp?: string;
  notes?: string;
  status: Status;
}

export interface YouTubePlaylist {
  id: string;
  user_id: string;
  playlist_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  video_count: number;
  imported_at: string;
  updated_at: string;
}

export interface Stats {
  total: number;
  available: number;
  unavailable: number;
  byPlatform: Record<Platform, number>;
  byCategory: Record<Category, number>;
}
