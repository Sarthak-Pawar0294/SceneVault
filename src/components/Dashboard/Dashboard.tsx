import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Scene, SceneFormData, Stats, Platform, Category, Status, YouTubePlaylist } from '../../types';
import { StatsPanel } from './StatsPanel';
import { FilterBar } from './FilterBar';
import { SceneCard } from './SceneCard';
import { SceneForm } from './SceneForm';
import { YouTubeImport } from './YouTubeImport';
import { SettingsModal } from './SettingsModal';
import { SceneDetailModal } from './SceneDetailModal';
import { Plus, Youtube, Loader, CheckCircle } from 'lucide-react';
import { BulkActionBar } from './BulkActionBar';
import { BulkCategoryModal } from './BulkCategoryModal';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import { downloadJSON, downloadCSV, downloadHTML, generateFilename } from '../../utils/exportUtils';
import { Sidebar, SidebarSection } from './Sidebar';

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

const STORAGE_KEY = 'sceneVault_filterState';

interface FilterState {
  searchQuery: string;
  selectedPlatform: Platform | 'all';
  selectedCategory: Category | 'all';
  selectedStatus: Status | 'all';
  sortBy: SortOption;
}

const defaultFilterState: FilterState = {
  searchQuery: '',
  selectedPlatform: 'all',
  selectedCategory: 'all',
  selectedStatus: 'all',
  sortBy: 'newest',
};

export function Dashboard() {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [filteredScenes, setFilteredScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showYouTubeImport, setShowYouTubeImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | undefined>();
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState);
  const [checkingProgress, setCheckingProgress] = useState<{ current: number; total: number } | null>(null);
  const [detailScene, setDetailScene] = useState<Scene | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [defaultPlatformForNewScene, setDefaultPlatformForNewScene] = useState<Platform | undefined>(undefined);
  const [youtubePlaylists, setYoutubePlaylists] = useState<YouTubePlaylist[]>([]);
  const [selectedYouTubePlaylistId, setSelectedYouTubePlaylistId] = useState<string | null>(null);
  const [youtubePlaylistSearch, setYoutubePlaylistSearch] = useState('');
  const [youtubePlaylistCategory, setYoutubePlaylistCategory] = useState<Category | 'all'>('all');
  const [exportContextScenes, setExportContextScenes] = useState<Scene[] | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        const migrated = { ...defaultFilterState, ...parsedState };
        if ((migrated as any).selectedStatus === 'private') {
          migrated.selectedStatus = 'unavailable';
        }
        if ((migrated as any).sortBy === 'channel-asc') {
          migrated.sortBy = 'newest';
        }
        setFilterState(migrated);
      } catch (error) {
        console.error('Error loading filter state:', error);
      }
    }

    localStorage.getItem('sceneVault_lastBackup');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filterState));
  }, [filterState]);

  useEffect(() => {
    if (user) {
      loadScenes();
      loadYouTubePlaylists();
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'all') {
      updateFilterState({ selectedPlatform: 'all' });
      setSelectedYouTubePlaylistId(null);
      return;
    }

    if (activeSection === 'profile') {
      setSelectedYouTubePlaylistId(null);
      return;
    }

    if (activeSection === 'YouTube') {
      setSelectedYouTubePlaylistId(null);
      return;
    }

    updateFilterState({ selectedPlatform: activeSection });
    setSelectedYouTubePlaylistId(null);
  }, [activeSection]);

  useEffect(() => {
    filterAndSortScenes();
  }, [scenes, filterState]);

  const formatDateShort = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadScenes = async () => {
    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((s: any) => ({
        ...s,
        status: (s.status === 'available' ? 'available' : 'unavailable') as Status,
      })) as Scene[];
      setScenes(normalized);
    } catch (error) {
      console.error('Error loading scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubePlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_playlists')
        .select('*')
        .eq('user_id', user!.id)
        .order('imported_at', { ascending: false });

      if (error) throw error;
      setYoutubePlaylists((data || []) as YouTubePlaylist[]);
    } catch (error) {
      console.error('Error loading YouTube playlists:', error);
      setYoutubePlaylists([]);
    }
  };

  const filterAndSortScenes = () => {
    let filtered = [...scenes];

    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      filtered = filtered.filter((scene) =>
        scene.title.toLowerCase().includes(query) ||
        scene.channel_name?.toLowerCase().includes(query) ||
        scene.notes?.toLowerCase().includes(query) ||
        scene.timestamp?.toLowerCase().includes(query)
      );
    }

    if (filterState.selectedPlatform !== 'all') {
      filtered = filtered.filter((scene) => scene.platform === filterState.selectedPlatform);
    }

    if (filterState.selectedCategory !== 'all') {
      filtered = filtered.filter((scene) => scene.category === filterState.selectedCategory);
    }

    if (filterState.selectedStatus !== 'all') {
      filtered = filtered.filter((scene) => scene.status === filterState.selectedStatus);
    }

    filtered.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredScenes(filtered);
  };

  const updateFilterState = (updates: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const clearAllFilters = () => {
    setFilterState(defaultFilterState);
  };

  const getActiveFilters = () => {
    const active: { type: any; value: string }[] = [];
    if (filterState.searchQuery) active.push({ type: 'search', value: filterState.searchQuery });
    if (filterState.selectedPlatform !== 'all') active.push({ type: 'platform', value: filterState.selectedPlatform });
    if (filterState.selectedCategory !== 'all') active.push({ type: 'category', value: filterState.selectedCategory });
    if (filterState.selectedStatus !== 'all') active.push({ type: 'status', value: filterState.selectedStatus });
    return active;
  };

  const handleSelectScene = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastSelectedId) {
      const lastIndex = filteredScenes.findIndex((s) => s.id === lastSelectedId);
      const currentIndex = filteredScenes.findIndex((s) => s.id === id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const newSelected = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          newSelected.add(filteredScenes[i].id);
        }
        setSelectedIds(newSelected);
      }
    } else {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    }
    setLastSelectedId(id);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredScenes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScenes.map((s) => s.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} scene(s)? This action cannot be undone.`)) return;

    try {
      for (const id of selectedIds) {
        await supabase.from('scenes').delete().eq('id', id);
      }
      await loadScenes();
      handleClearSelection();
    } catch (error) {
      console.error('Error deleting scenes:', error);
      alert('Failed to delete some scenes');
    }
  };

  const handleBulkCategoryChange = async (category: Category) => {
    if (selectedIds.size === 0) return;

    try {
      for (const id of selectedIds) {
        await supabase
          .from('scenes')
          .update({ category, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
      await loadScenes();
      handleClearSelection();
    } catch (error) {
      console.error('Error updating categories:', error);
      alert('Failed to update some scenes');
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) return;

    try {
      for (const id of selectedIds) {
        await supabase
          .from('scenes')
          .update({ status: 'unavailable', updated_at: new Date().toISOString() })
          .eq('id', id);
      }
      await loadScenes();
      handleClearSelection();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update some scenes');
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;

    const selectedScenes = scenes.filter((s) => selectedIds.has(s.id));
    const dataStr = JSON.stringify(selectedScenes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `scenevault-export-selected-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportScenes = (scenesToExport: Scene[], format: 'json' | 'csv' | 'html') => {
    const filename = generateFilename(format);

    switch (format) {
      case 'json':
        downloadJSON(scenesToExport, filename);
        break;
      case 'csv':
        downloadCSV(scenesToExport, filename);
        break;
      case 'html':
        downloadHTML(scenesToExport, filename);
        break;
    }

    localStorage.setItem('sceneVault_lastBackup', Date.now().toString());
  };

  const handleImport = async (importedScenes: Scene[], mode: 'merge' | 'replace') => {
    try {
      if (mode === 'replace') {
        const allIds = scenes.map((s) => s.id);
        for (const id of allIds) {
          await supabase.from('scenes').delete().eq('id', id);
        }
      }

      for (const scene of importedScenes) {
        const { id, ...sceneData } = scene;
        await supabase.from('scenes').insert([
          {
            ...sceneData,
            user_id: user!.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      await loadScenes();
      alert(`Successfully imported ${importedScenes.length} scene${importedScenes.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error importing scenes:', error);
      alert('Failed to import scenes. Please try again.');
    }
  };

  const calculateStats = (): Stats => {
    const stats: Stats = {
      total: scenes.length,
      available: 0,
      unavailable: 0,
      byPlatform: {
        YouTube: 0,
        JioHotstar: 0,
        Zee5: 0,
        SonyLIV: 0,
        Other: 0,
      },
      byCategory: {
        'F/M': 0,
        'F/F': 0,
        'M/F': 0,
        'M/M': 0,
      },
    };

    scenes.forEach((scene) => {
      if (scene.status === 'available') stats.available++;
      if (scene.status === 'unavailable') stats.unavailable++;
      stats.byPlatform[scene.platform]++;
      stats.byCategory[scene.category]++;
    });

    return stats;
  };

  const handleAddScene = async (data: SceneFormData) => {
    try {
      const { error } = await supabase.from('scenes').insert([
        {
          ...data,
          user_id: user!.id,
          source_type: 'manual',
        },
      ]);

      if (error) throw error;
      await loadScenes();
    } catch (error) {
      console.error('Error adding scene:', error);
      throw error;
    }
  };

  const handleUpdateScene = async (data: SceneFormData) => {
    if (!editingScene) return;

    try {
      const { error } = await supabase
        .from('scenes')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingScene.id);

      if (error) throw error;
      await loadScenes();
    } catch (error) {
      console.error('Error updating scene:', error);
      throw error;
    }
  };

  const handleDeleteScene = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      const { error } = await supabase.from('scenes').delete().eq('id', id);

      if (error) throw error;
      await loadScenes();
    } catch (error) {
      console.error('Error deleting scene:', error);
    }
  };

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    setDefaultPlatformForNewScene(undefined);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingScene(undefined);
    setDefaultPlatformForNewScene(undefined);
  };

  const handleYouTubeImport = async (playlistUrl: string, category: Category): Promise<{ playlistTitle: string; addedCount: number }> => {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      throw new Error('Invalid playlist URL. Please use a valid YouTube playlist link.');
    }

    const apiKey = localStorage.getItem('youtube_api_key');

    if (!apiKey) {
      const result = await importPlaylistBasic(playlistId);
      return result;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const metaRes = await fetch(`${supabaseUrl}/functions/v1/fetch_youtube_playlist_metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          playlistId,
          apiKey,
        }),
      });

      if (!metaRes.ok) {
        const errorData = await metaRes.json().catch(() => ({}));
        if (errorData.code === 'INVALID_API_KEY') {
          throw new Error('Invalid YouTube API key. Please check your API key in Settings.');
        }
        if (errorData.code === 'QUOTA_EXCEEDED') {
          throw new Error('YouTube API quota exceeded. Please try again tomorrow.');
        }
        if (errorData.code === 'PLAYLIST_NOT_FOUND') {
          throw new Error('Playlist not found or is private. Please check the URL.');
        }
        throw new Error(errorData.error || 'Failed to fetch playlist metadata');
      }

      const playlistMeta = await metaRes.json();

      const allItems: any[] = [];
      let pageToken: string | null = null;
      let hasMore = true;

      const existingVideoIds = new Set(
        scenes
          .filter((s) => s.platform === 'YouTube' && s.playlist_id === playlistId && !!s.video_id)
          .map((s) => s.video_id as string)
      );

      while (hasMore) {
        try {
          const response: any = await fetch(
            `${supabaseUrl}/functions/v1/fetch_youtube_playlist`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                playlistId,
                apiKey,
                maxResults: 50,
                pageToken,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();

            if (errorData.code === 'INVALID_API_KEY') {
              throw new Error('Invalid YouTube API key. Please check your API key in Settings.');
            }
            if (errorData.code === 'QUOTA_EXCEEDED') {
              throw new Error('YouTube API quota exceeded. Please try again tomorrow.');
            }
            if (errorData.code === 'PLAYLIST_NOT_FOUND') {
              throw new Error('Playlist not found or is private. Please check the URL.');
            }

            throw new Error(errorData.error || 'Failed to fetch playlist');
          }

          const data: any = await response.json();
          const items = data.items || [];

          if (items.length === 0 && allItems.length === 0) {
            throw new Error('No videos found in this playlist.');
          }

          allItems.push(...items);
          pageToken = data.nextPageToken || null;
          hasMore = pageToken !== null;

          if (allItems.length > 500) {
            throw new Error('Playlist is too large (500+ videos). Please select a smaller playlist.');
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('YouTube')) {
            throw err;
          }
          throw new Error('Network error while fetching playlist. Please check your connection and try again.');
        }
      }

      if (allItems.length === 0) {
        throw new Error('No videos found in this playlist.');
      }

      const scenesToInsert = allItems
        .filter((item: any) => item.videoId && !existingVideoIds.has(item.videoId))
        .map((item: any) => ({
          user_id: user!.id,
          title: item.title,
          platform: 'YouTube' as Platform,
          category,
          url: item.url,
          video_id: item.videoId,
          thumbnail: item.thumbnail,
          channel_name: item.channelName,
          upload_date: new Date(item.uploadDate).toISOString(),
          status: 'available' as Status,
          source_type: 'youtube_playlist',
          playlist_id: playlistId,
        }));

      if (scenesToInsert.length > 0) {
        const { error } = await supabase.from('scenes').insert(scenesToInsert);
        if (error) throw error;
      }

      const existingPlaylist = youtubePlaylists.find((p) => p.playlist_id === playlistId);
      const thumbnail =
        (playlistMeta?.thumbnail as string) ||
        (scenesToInsert[0]?.thumbnail as string) ||
        (existingPlaylist?.thumbnail as string) ||
        '';

      const upsertPayload: any = {
        user_id: user!.id,
        playlist_id: playlistId,
        title: playlistMeta?.title || existingPlaylist?.title || `Playlist: ${playlistId}`,
        description: playlistMeta?.description || existingPlaylist?.description || '',
        thumbnail,
        video_count: Number(playlistMeta?.videoCount || 0),
        updated_at: new Date().toISOString(),
      };
      if (!existingPlaylist) {
        upsertPayload.imported_at = new Date().toISOString();
      }

      const { error: playlistError } = await supabase
        .from('youtube_playlists')
        .upsert(upsertPayload, { onConflict: 'user_id,playlist_id' });
      if (playlistError) throw playlistError;

      await loadScenes();
      await loadYouTubePlaylists();
      return {
        playlistTitle: upsertPayload.title,
        addedCount: scenesToInsert.length,
      };
    } catch (error) {
      console.error('Error importing playlist:', error);
      throw error;
    }
  };

  const importPlaylistBasic = async (playlistId: string): Promise<{ playlistTitle: string; addedCount: number }> => {
    const title = `Playlist: ${playlistId}`;
    const { error } = await supabase
      .from('youtube_playlists')
      .upsert(
        {
          user_id: user!.id,
          playlist_id: playlistId,
          title,
          description: 'Imported without API key. Add your API key in Settings to import full playlist metadata and videos.',
          thumbnail: '',
          video_count: 0,
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,playlist_id' }
      );

    if (error) throw error;
    await loadYouTubePlaylists();
    return { playlistTitle: title, addedCount: 0 };
  };

  const handleOpenPlaylistOnYouTube = (playlistId: string) => {
    window.open(`https://www.youtube.com/playlist?list=${playlistId}`, '_blank', 'noopener,noreferrer');
  };

  const handleRenamePlaylist = async (playlistId: string) => {
    const p = youtubePlaylists.find((x) => x.playlist_id === playlistId);
    const next = prompt('Edit playlist name', p?.title || '');
    if (!next || !next.trim()) return;

    try {
      const { error } = await supabase
        .from('youtube_playlists')
        .update({ title: next.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', user!.id)
        .eq('playlist_id', playlistId);
      if (error) throw error;
      await loadYouTubePlaylists();
    } catch (error) {
      console.error('Error renaming playlist:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Delete this playlist and all its videos? This cannot be undone.')) return;
    try {
      const { error: sceneError } = await supabase
        .from('scenes')
        .delete()
        .eq('user_id', user!.id)
        .eq('playlist_id', playlistId);
      if (sceneError) throw sceneError;

      const { error: plError } = await supabase
        .from('youtube_playlists')
        .delete()
        .eq('user_id', user!.id)
        .eq('playlist_id', playlistId);
      if (plError) throw plError;

      setSelectedYouTubePlaylistId(null);
      await loadScenes();
      await loadYouTubePlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleRefreshPlaylist = async (playlistId: string) => {
    const playlistScenes = scenes.filter((s) => s.platform === 'YouTube' && s.playlist_id === playlistId);
    const defaultCategory = (playlistScenes[0]?.category || 'F/M') as Category;
    const nextCategory = prompt('Category for any newly added videos (F/M, F/F, M/F, M/M)', defaultCategory);
    const validCategories: Category[] = ['F/M', 'F/F', 'M/F', 'M/M'];
    const chosen = validCategories.includes(nextCategory as Category) ? (nextCategory as Category) : defaultCategory;
    await handleYouTubeImport(`https://www.youtube.com/playlist?list=${playlistId}`, chosen);
  };

  const handleExportPlaylist = (playlistScenes: Scene[]) => {
    setExportContextScenes(playlistScenes);
    setShowExportModal(true);
  };

  const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const updateSceneDetails = async (scene: Scene, data: Partial<Scene>) => {
    try {
      const { error } = await supabase
        .from('scenes')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scene.id);

      if (error) throw error;
      await loadScenes();
      setDetailScene(undefined);
    } catch (error) {
      console.error('Error updating scene:', error);
      throw error;
    }
  };

  const checkSingleVideoStatus = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.video_id) return;

    const apiKey = localStorage.getItem('youtube_api_key');
    if (!apiKey) {
      alert('Please add your YouTube API key in Settings first');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/check_youtube_video_status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            videoIds: [scene.video_id],
            apiKey,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('QUOTA_EXCEEDED') || errorData.error?.includes('quota')) {
          alert('YouTube API quota exceeded. Please try again tomorrow.');
        } else if (errorData.error?.includes('INVALID_API_KEY')) {
          alert('Invalid API key. Please check your settings.');
        }
        return;
      }

      const data = await response.json();
      const result = data.results?.[0];
      if (!result) return;

      const normalizedStatus: Status = result.status === 'available' ? 'available' : 'unavailable';

      const { error } = await supabase
        .from('scenes')
        .update({
          status: normalizedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sceneId);

      if (error) throw error;
      await loadScenes();
    } catch (error) {
      console.error('Error checking video status:', error);
    }
  };

  const checkAllYouTubeVideos = async () => {
    const youtubeScenes = scenes.filter(s => s.platform === 'YouTube' && s.video_id);
    if (youtubeScenes.length === 0) {
      alert('No YouTube videos found to check');
      return;
    }

    const apiKey = localStorage.getItem('youtube_api_key');
    if (!apiKey) {
      alert('Please add your YouTube API key in Settings first');
      return;
    }

    setCheckingProgress({ current: 0, total: youtubeScenes.length });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const videoIds = youtubeScenes.map(s => s.video_id!);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/check_youtube_video_status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            videoIds,
            apiKey,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('quota')) {
          alert('YouTube API quota exceeded. Please try again tomorrow.');
        } else if (errorData.error?.includes('INVALID_API_KEY')) {
          alert('Invalid API key. Please check your settings.');
        }
        setCheckingProgress(null);
        return;
      }

      const data = await response.json();
      const results = data.results || [];

      const updates = results.map((result: any) => {
        const scene = youtubeScenes.find(s => s.video_id === result.videoId);
        return {
          id: scene!.id,
          status: (result.status === 'available' ? 'available' : 'unavailable') as Status,
        };
      });

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const { error } = await supabase
          .from('scenes')
          .update({
            status: update.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id);

        if (error) throw error;
        setCheckingProgress({ current: i + 1, total: youtubeScenes.length });
      }

      await loadScenes();

      const available = results.filter((r: any) => r.status === 'available').length;
      const unavailable = results.filter((r: any) => r.status !== 'available').length;

      alert(`Checked ${results.length} videos: ${available} available, ${unavailable} unavailable`);
    } catch (error) {
      console.error('Error checking all videos:', error);
      alert('Error checking videos. Please try again.');
    } finally {
      setCheckingProgress(null);
    }
  };

  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[var(--accent-red)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar
        active={activeSection}
        onNavigate={(section) => setActiveSection(section)}
        onOpenSettings={() => setShowSettings(true)}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="min-h-screen md:pl-[240px] px-6 py-8">
        {activeSection !== 'profile' && <StatsPanel stats={calculateStats()} />}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Scene</span>
          </button>

          {activeSection === 'YouTube' && (
            <button
              onClick={() => setShowYouTubeImport(true)}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Youtube className="w-5 h-5" />
              <span>Import Playlist</span>
            </button>
          )}

          <button
            onClick={checkAllYouTubeVideos}
            disabled={checkingProgress !== null}
            className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {checkingProgress ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Checking {checkingProgress.current}/{checkingProgress.total}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Check All Videos</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            Import
          </button>
          <button
            onClick={handleOpenExportModal}
            className="btn-secondary"
          >
            Export
          </button>
        </div>

        {activeSection === 'YouTube' ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">YouTube</h1>
              <div className="text-sm text-[var(--text-secondary)]">Playlists and videos</div>
            </div>

            {selectedYouTubePlaylistId ? (
              (() => {
                const isManual = selectedYouTubePlaylistId === '__manual__';
                const playlist = youtubePlaylists.find((p) => p.playlist_id === selectedYouTubePlaylistId);
                const playlistScenes = isManual
                  ? scenes.filter((s) => s.platform === 'YouTube' && (s.source_type === 'manual' || !s.playlist_id))
                  : scenes.filter((s) => s.platform === 'YouTube' && s.playlist_id === selectedYouTubePlaylistId);

                const filteredPlaylistScenes = playlistScenes
                  .filter((s) => {
                    const q = youtubePlaylistSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      s.title.toLowerCase().includes(q) ||
                      s.channel_name?.toLowerCase().includes(q) ||
                      s.notes?.toLowerCase().includes(q) ||
                      s.timestamp?.toLowerCase().includes(q)
                    );
                  })
                  .filter((s) => (youtubePlaylistCategory === 'all' ? true : s.category === youtubePlaylistCategory));

                const availableCount = playlistScenes.filter((s) => s.status === 'available').length;
                const unavailableCount = playlistScenes.filter((s) => s.status === 'unavailable').length;

                const title = isManual ? `Individual Videos` : (playlist?.title || `Playlist: ${selectedYouTubePlaylistId}`);
                const description = isManual ? '' : (playlist?.description || '');
                const importedAt = isManual ? '' : (playlist?.imported_at || '');
                const thumbnail = isManual ? '' : (playlist?.thumbnail || playlistScenes[0]?.thumbnail || '');
                const totalCountLabel = isManual
                  ? playlistScenes.length
                  : (playlist?.video_count && playlist?.video_count > 0 ? playlist.video_count : playlistScenes.length);

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs text-[var(--text-secondary)]">Home &gt; YouTube &gt; {title}</div>
                        <div className="text-2xl font-bold text-white">{title}</div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {totalCountLabel} video{totalCountLabel === 1 ? '' : 's'}
                          {importedAt ? ` • Imported: ${formatDateShort(importedAt)}` : ''}
                          {!isManual && playlistScenes.length !== totalCountLabel ? ` • Imported: ${playlistScenes.length}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isManual && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleOpenPlaylistOnYouTube(selectedYouTubePlaylistId)}
                          >
                            View on YouTube
                          </button>
                        )}
                        {!isManual && (
                          <button type="button" className="btn-secondary" onClick={() => handleRenamePlaylist(selectedYouTubePlaylistId)}>
                            Rename
                          </button>
                        )}
                        {!isManual && (
                          <button type="button" className="btn-secondary" onClick={() => handleRefreshPlaylist(selectedYouTubePlaylistId)}>
                            Refresh
                          </button>
                        )}
                        <button type="button" className="btn-secondary" onClick={() => handleExportPlaylist(playlistScenes)}>
                          Export
                        </button>
                        {!isManual && (
                          <button type="button" className="btn-danger" onClick={() => handleDeletePlaylist(selectedYouTubePlaylistId)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {thumbnail && (
                      <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {description && (
                      <div className="text-sm text-zinc-300 whitespace-pre-wrap">{description}</div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYouTubePlaylistId(null);
                          setYoutubePlaylistSearch('');
                          setYoutubePlaylistCategory('all');
                        }}
                        className="text-[var(--text-secondary)] hover:text-white"
                      >
                        ← Back to Playlists
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-300">Available: {availableCount}</div>
                        <div className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-300">Unavailable: {unavailableCount}</div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        value={youtubePlaylistSearch}
                        onChange={(e) => setYoutubePlaylistSearch(e.target.value)}
                        className="input flex-1"
                        placeholder="Search within this playlist"
                      />
                      <select
                        value={youtubePlaylistCategory}
                        onChange={(e) => setYoutubePlaylistCategory(e.target.value as any)}
                        className="input md:w-56"
                      >
                        <option value="all">All categories</option>
                        <option value="F/M">F/M</option>
                        <option value="F/F">F/F</option>
                        <option value="M/F">M/F</option>
                        <option value="M/M">M/M</option>
                      </select>
                    </div>

                    {filteredPlaylistScenes.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">No videos match your search/filter.</p>
                      </div>
                    ) : (
                      <div className={`grid [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-6 ${selectedIds.size > 0 ? 'pb-24' : ''}`}>
                        {filteredPlaylistScenes.map((scene) => (
                          <SceneCard
                            key={scene.id}
                            scene={scene}
                            onEdit={handleEdit}
                            onDelete={handleDeleteScene}
                            onCheckStatus={checkSingleVideoStatus}
                            onViewDetails={selectedIds.size === 0 ? setDetailScene : undefined}
                            isSelected={selectedIds.has(scene.id)}
                            onSelect={handleSelectScene}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              (() => {
                type PlaylistCard = {
                  playlist_id: string;
                  title: string;
                  description?: string;
                  thumbnail?: string;
                  video_count: number;
                  imported_at?: string;
                };

                const playlistSceneCounts = scenes
                  .filter((s) => s.platform === 'YouTube' && s.source_type === 'youtube_playlist' && !!s.playlist_id)
                  .reduce<Record<string, number>>((acc, s) => {
                    const id = s.playlist_id as string;
                    acc[id] = (acc[id] || 0) + 1;
                    return acc;
                  }, {});

                const playlistFirstThumb = scenes
                  .filter((s) => s.platform === 'YouTube' && s.source_type === 'youtube_playlist' && !!s.playlist_id)
                  .reduce<Record<string, string>>((acc, s) => {
                    const id = s.playlist_id as string;
                    if (!acc[id] && s.thumbnail) acc[id] = s.thumbnail;
                    return acc;
                  }, {});

                const playlistFirstCreated = scenes
                  .filter((s) => s.platform === 'YouTube' && s.source_type === 'youtube_playlist' && !!s.playlist_id)
                  .reduce<Record<string, string>>((acc, s) => {
                    const id = s.playlist_id as string;
                    if (!acc[id]) acc[id] = s.created_at;
                    return acc;
                  }, {});

                const playlistIdSet = new Set(Object.keys(playlistSceneCounts));

                const playlistsForCards: PlaylistCard[] = [
                  ...youtubePlaylists.map((p) => ({
                    playlist_id: p.playlist_id,
                    title: p.title,
                    description: p.description,
                    thumbnail: p.thumbnail,
                    video_count: p.video_count,
                    imported_at: p.imported_at,
                  })),
                  ...Array.from(playlistIdSet)
                    .filter((id) => !youtubePlaylists.some((p) => p.playlist_id === id))
                    .map((id) => ({
                      playlist_id: id,
                      title: `Playlist: ${id}`,
                      description: '',
                      thumbnail: playlistFirstThumb[id] || '',
                      video_count: playlistSceneCounts[id] || 0,
                      imported_at: playlistFirstCreated[id] || '',
                    })),
                ].sort((a, b) => {
                  const aTime = a.imported_at ? new Date(a.imported_at).getTime() : 0;
                  const bTime = b.imported_at ? new Date(b.imported_at).getTime() : 0;
                  return bTime - aTime;
                });

                const manualScenes = scenes.filter((s) => s.platform === 'YouTube' && (s.source_type === 'manual' || !s.playlist_id));
                const playlistVideoScenes = scenes.filter((s) => s.platform === 'YouTube' && s.source_type === 'youtube_playlist' && !!s.playlist_id);

                const totalPlaylistVideos = playlistVideoScenes.length;
                const totalPlaylists = playlistsForCards.length;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="card p-4">
                        <div className="text-sm text-[var(--text-secondary)]">Playlists</div>
                        <div className="text-2xl font-bold text-white">{totalPlaylists}</div>
                      </div>
                      <div className="card p-4">
                        <div className="text-sm text-[var(--text-secondary)]">Playlist Videos</div>
                        <div className="text-2xl font-bold text-white">{totalPlaylistVideos}</div>
                      </div>
                      <div className="card p-4">
                        <div className="text-sm text-[var(--text-secondary)]">Individual Videos</div>
                        <div className="text-2xl font-bold text-white">{manualScenes.length}</div>
                      </div>
                    </div>

                    <div className="grid [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-6">
                      <div
                        role="button"
                        tabIndex={0}
                        className="card overflow-hidden transition cursor-pointer hover:bg-zinc-600/20"
                        onClick={() => setSelectedYouTubePlaylistId('__manual__')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedYouTubePlaylistId('__manual__');
                          }
                        }}
                      >
                        <div className="p-4 space-y-2">
                          <div className="text-lg font-semibold text-white">Individual Videos</div>
                          <div className="text-sm text-[var(--text-secondary)]">{manualScenes.length} videos</div>
                          <div className="text-[var(--accent-red)] text-sm">View →</div>
                        </div>
                      </div>

                      {playlistsForCards.map((p) => (
                        <div
                          key={p.playlist_id}
                          role="button"
                          tabIndex={0}
                          className="card overflow-hidden transition cursor-pointer hover:bg-zinc-600/20"
                          onClick={() => setSelectedYouTubePlaylistId(p.playlist_id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedYouTubePlaylistId(p.playlist_id);
                            }
                          }}
                        >
                          {p.thumbnail ? (
                            <div className="h-40 bg-zinc-800 overflow-hidden">
                              <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-40 bg-zinc-800" />
                          )}
                          <div className="p-4 space-y-2">
                            <div className="text-lg font-semibold text-white line-clamp-2">{p.title}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{(p.video_count && p.video_count > 0 ? p.video_count : (playlistSceneCounts[p.playlist_id] || 0))} videos</div>
                            <div className="text-xs text-[var(--text-tertiary)]">Imported: {p.imported_at ? formatDateShort(p.imported_at) : '—'}</div>
                            <div className="text-[var(--accent-red)] text-sm">View →</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </>
        ) : activeSection === 'profile' ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <div className="card p-6">
              <div className="text-sm text-[var(--text-secondary)]">Signed in as</div>
              <div className="text-white font-semibold mt-2">{user?.email}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">
                {activeSection === 'all' ? 'All Scenes' : `${activeSection} Videos`}
              </h1>
              <div className="text-sm text-[var(--text-secondary)]">
                {activeSection === 'all'
                  ? `${scenes.length} total`
                  : `${scenes.filter((s) => s.platform === activeSection).length} videos`}
              </div>
            </div>
            <FilterBar
              searchQuery={filterState.searchQuery}
              onSearchChange={(query) => updateFilterState({ searchQuery: query })}
              selectedPlatform={filterState.selectedPlatform}
              onPlatformChange={(platform) => updateFilterState({ selectedPlatform: platform })}
              selectedCategory={filterState.selectedCategory}
              onCategoryChange={(category) => updateFilterState({ selectedCategory: category })}
              selectedStatus={filterState.selectedStatus}
              onStatusChange={(status) => updateFilterState({ selectedStatus: status })}
              sortBy={filterState.sortBy}
              onSortChange={(sort) => updateFilterState({ sortBy: sort })}
              activeFilters={getActiveFilters()}
              onRemoveFilter={(type) => {
                switch (type) {
                  case 'search':
                    updateFilterState({ searchQuery: '' });
                    break;
                  case 'platform':
                    updateFilterState({ selectedPlatform: 'all' });
                    break;
                  case 'category':
                    updateFilterState({ selectedCategory: 'all' });
                    break;
                  case 'status':
                    updateFilterState({ selectedStatus: 'all' });
                    break;
                }
              }}
              onClearAllFilters={clearAllFilters}
              resultsCount={filteredScenes.length}
              totalCount={scenes.length}
              selectedCount={selectedIds.size}
              onSelectAll={handleSelectAll}
            />

            {filteredScenes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">
                  {scenes.length === 0
                    ? 'No scenes yet. Add your first scene to get started!'
                    : 'No scenes match your filters.'}
                </p>
              </div>
            ) : (
              <div className={`grid [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-6 ${selectedIds.size > 0 ? 'pb-24' : ''}`}>
                {filteredScenes.map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onEdit={handleEdit}
                    onDelete={handleDeleteScene}
                    onCheckStatus={checkSingleVideoStatus}
                    onViewDetails={selectedIds.size === 0 ? setDetailScene : undefined}
                    isSelected={selectedIds.has(scene.id)}
                    onSelect={handleSelectScene}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <SceneForm
          scene={editingScene}
          onSubmit={editingScene ? handleUpdateScene : handleAddScene}
          onCancel={handleCancelForm}
          defaultPlatform={defaultPlatformForNewScene}
        />
      )}

      {showYouTubeImport && (
        <YouTubeImport
          onImport={handleYouTubeImport}
          onCancel={() => setShowYouTubeImport(false)}
          onOpenSettings={() => {
            setShowYouTubeImport(false);
            setShowSettings(true);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      {detailScene && (
        <SceneDetailModal
          scene={detailScene}
          onClose={() => setDetailScene(undefined)}
          onEdit={() => {
            setDetailScene(undefined);
            handleEdit(detailScene);
          }}
          onDelete={handleDeleteScene}
          onCheckStatus={checkSingleVideoStatus}
          onUpdate={updateSceneDetails}
        />
      )}

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onChangeCategory={() => setShowBulkCategoryModal(true)}
          onChangeStatus={handleBulkStatusChange}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={handleClearSelection}
        />
      )}

      {showBulkCategoryModal && (
        <BulkCategoryModal
          onSelect={handleBulkCategoryChange}
          onClose={() => setShowBulkCategoryModal(false)}
        />
      )}

      {showExportModal && (
        (() => {
          const modalScenes = exportContextScenes || scenes;
          const modalFiltered = exportContextScenes || filteredScenes;
          const modalSelectedIds = exportContextScenes ? new Set<string>() : selectedIds;
          const modalSelectedCount = exportContextScenes ? 0 : selectedIds.size;

          return (
        <ExportModal
          scenes={modalScenes}
          filteredScenes={modalFiltered}
          selectedCount={modalSelectedCount}
          selectedIds={modalSelectedIds}
          onExport={handleExportScenes}
          onClose={() => {
            setShowExportModal(false);
            setExportContextScenes(null);
          }}
        />
          );
        })()
      )}

      {showImportModal && (
        <ImportModal
          existingCount={scenes.length}
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
