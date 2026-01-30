import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

interface FetchPlaylistMetadataRequest {
  playlistId: string;
  apiKey: string;
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
    const { playlistId, apiKey } = (await req.json()) as FetchPlaylistMetadataRequest;

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

    const url = new URL("https://www.googleapis.com/youtube/v3/playlists");
    url.searchParams.append("part", "snippet,contentDetails");
    url.searchParams.append("id", playlistId);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || "Failed to fetch YouTube playlist metadata";

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
        if (String(errorMessage).toLowerCase().includes("quota")) {
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

    const data = (await response.json()) as any;
    const playlist = data?.items?.[0];

    if (!playlist) {
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

    const snippet = playlist.snippet || {};
    const contentDetails = playlist.contentDetails || {};

    const title = (snippet.title || "Untitled Playlist").trim();
    const description = (snippet.description || "").trim();
    const thumbnail =
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      snippet.thumbnails?.high?.url ||
      "";

    const videoCount = typeof contentDetails.itemCount === "number" ? contentDetails.itemCount : 0;

    return new Response(
      JSON.stringify({
        playlistId,
        title,
        description,
        thumbnail,
        videoCount,
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
