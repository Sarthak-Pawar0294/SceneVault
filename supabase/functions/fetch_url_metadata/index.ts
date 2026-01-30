import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

interface FetchUrlMetadataRequest {
  url: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const isSafeHostname = (hostname: string) => {
  const h = hostname.toLowerCase();

  if (h === "localhost") return false;
  if (h.endsWith(".local")) return false;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const parts = h.split(".").map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

    const [a, b] = parts;
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
  }

  return true;
};

const pickMeta = (html: string, propertyOrName: string) => {
  const prop = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m?.[1]?.trim() || "";
};

const pickTitleTag = (html: string) => {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1]?.trim() || "";
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json() as FetchUrlMetadataRequest;

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing required parameter: url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(JSON.stringify({ error: "Only http/https URLs are allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isSafeHostname(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Blocked hostname" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Fetch failed (${res.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contentType.toLowerCase().includes("text/html")) {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await res.text();

    const ogTitle = pickMeta(html, "og:title");
    const twitterTitle = pickMeta(html, "twitter:title");
    const titleTag = pickTitleTag(html);
    const title = ogTitle || twitterTitle || titleTag;

    const ogImage = pickMeta(html, "og:image");
    const twitterImage = pickMeta(html, "twitter:image");
    const image = ogImage || twitterImage;

    const durationRaw = pickMeta(html, "og:video:duration") || pickMeta(html, "music:duration");
    const durationSeconds = durationRaw && /^\d+$/.test(durationRaw) ? Number(durationRaw) : null;

    return new Response(
      JSON.stringify({
        title,
        image,
        durationSeconds,
        finalUrl: res.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
