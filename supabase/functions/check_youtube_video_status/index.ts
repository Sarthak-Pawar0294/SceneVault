import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface VideoStatusRequest {
  videoIds: string[];
  apiKey: string;
}

interface VideoStatus {
  videoId: string;
  status: "available" | "unavailable" | "private";
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function checkVideoStatus(videoId: string, apiKey: string): Promise<VideoStatus> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.append("part", "status");
    url.searchParams.append("id", videoId);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || "Unknown error";

      if (response.status === 403) {
        if (errorMessage.includes("quota")) {
          return { videoId, status: "unavailable", error: "QUOTA_EXCEEDED" };
        }
        return { videoId, status: "unavailable", error: "INVALID_API_KEY" };
      }

      return { videoId, status: "unavailable", error: errorMessage };
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) {
      return { videoId, status: "unavailable" };
    }

    const videoStatus = items[0].status;
    if (!videoStatus.uploadStatus) {
      return { videoId, status: "unavailable" };
    }

    const privacyStatus = videoStatus.privacyStatus || "public";
    if (privacyStatus === "private") {
      return { videoId, status: "private" };
    }

    return { videoId, status: "available" };
  } catch (error) {
    return { videoId, status: "unavailable", error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { videoIds, apiKey } = await req.json() as VideoStatusRequest;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0 || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: videoIds (array) and apiKey",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: VideoStatus[] = [];
    const batchSize = 50;

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((id) => checkVideoStatus(id, apiKey))
      );
      results.push(...batchResults);

      if (i + batchSize < videoIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({
        results,
        checked: results.length,
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
