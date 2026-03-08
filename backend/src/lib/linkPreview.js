
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

export function extractFirstUrl(text) {
  if (!text) return null;
  const matches = text.match(URL_REGEX);
  return matches?.[0] || null;
}

export async function fetchLinkPreview(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChatifyBot/1.0)",
        "Accept": "text/html",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const reader = res.body.getReader();
    let html = "";
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value.length;
      if (bytes > 50000) { reader.cancel(); break; }
    }

    const og = (prop) => {
      const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
                 || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
      return match?.[1]?.trim() || null;
    };

    const title = og("og:title")
               || og("twitter:title")
               || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
               || null;

    const description = og("og:description")
                     || og("twitter:description")
                     || og("description")
                     || null;

    const image = og("og:image") || og("twitter:image") || null;

    const siteName = og("og:site_name") || null;

    let resolvedImage = image;
    if (image && !image.startsWith("http")) {
      try {
        const base = new URL(url);
        resolvedImage = new URL(image, base.origin).toString();
      } catch { resolvedImage = null; }
    }

    const urlObj = new URL(url);
    const favicon = `${urlObj.origin}/favicon.ico`;

    if (!title && !description && !resolvedImage) return null;

    return {
      url,
      title:       title?.slice(0, 120) || null,
      description: description?.slice(0, 200) || null,
      image:       resolvedImage || null,
      siteName:    siteName?.slice(0, 60) || urlObj.hostname,
      favicon,
    };
  } catch {
    return null;
  }
}
