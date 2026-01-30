import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface PlaylistItem {
  title: string;
  videoId: string;
  thumbnail: string;
  channelName: string;
  uploadDate: string;
  url: string;
}

interface FetchPlaylistRequest {
  playlistId: string;
  apiKey: string;
  maxResults?: number;
  pageToken?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { playlistId, apiKey, maxResults = 50, pageToken } = await req.json() as FetchPlaylistRequest;

    if (!playlistId || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: playlistId and apiKey",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("playlistId", playlistId);
    url.searchParams.append("maxResults", Math.min(maxResults, 50).toString());
    url.searchParams.append("key", apiKey);
    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData?.error?.message || "Failed to fetch YouTube playlist";

      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            error: "Playlist not found. Please check the playlist URL or ID.",
            code: "PLAYLIST_NOT_FOUND",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 403) {
        if (errorMessage.includes("quota")) {
          return new Response(
            JSON.stringify({
              error: "YouTube API quota exceeded. Please try again later.",
              code: "QUOTA_EXCEEDED",
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({
            error: "Invalid API key or insufficient permissions.",
            code: "INVALID_API_KEY",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`YouTube API error: ${errorMessage}`);
    }

    const data = await response.json();
    const items: PlaylistItem[] = (data.items || []).map((item: any) => {
      const snippet = item.snippet;
      return {
        title: snippet.title || "Untitled",
        videoId: snippet.resourceId?.videoId || "",
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        channelName: snippet.channelTitle || "Unknown Channel",
        uploadDate: snippet.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${snippet.resourceId?.videoId}`,
      };
    });

    return new Response(
      JSON.stringify({
        items,
        nextPageToken: data.nextPageToken || null,
        totalResults: data.pageInfo?.totalResults || 0,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
