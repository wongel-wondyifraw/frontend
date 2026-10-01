/**
 * Turn a Google Maps share link, embed URL, iframe snippet, or free-text
 * address into a URL suitable for an iframe `src`.
 */
export function toGoogleMapsEmbedUrl(raw?: string | null): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  const iframeSrc = trimmed.match(/src=["']([^"']+)["']/i)?.[1];
  const candidate = (iframeSrc || trimmed).trim();

  if (/\/maps\/embed/i.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const isGoogleMaps =
      host.includes("google.") ||
      host === "maps.app.goo.gl" ||
      host === "goo.gl";

    if (isGoogleMaps) {
      if (url.searchParams.get("output") === "embed") {
        return candidate;
      }

      const q =
        url.searchParams.get("q") ||
        url.searchParams.get("query") ||
        url.searchParams.get("destination");
      if (q) {
        return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
      }

      const cid = url.searchParams.get("cid");
      if (cid) {
        return `https://www.google.com/maps?cid=${encodeURIComponent(cid)}&output=embed`;
      }

      // Place / search path — ask Maps to embed that destination
      return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
    }
  } catch {
    // not a URL — treat as address / place name
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
}

/** Prefer an explicit directions URL; otherwise derive a non-embed open link. */
export function toGoogleMapsDirectionsUrl(
  directionsUrl?: string | null,
  mapUrl?: string | null,
): string | null {
  const direct = (directionsUrl || "").trim();
  if (direct) return direct;

  const embed = (mapUrl || "").trim();
  if (!embed) return null;

  const iframeSrc = embed.match(/src=["']([^"']+)["']/i)?.[1];
  const candidate = (iframeSrc || embed).trim();

  try {
    const url = new URL(candidate);
    if (url.searchParams.get("output") === "embed") {
      url.searchParams.delete("output");
      return url.toString();
    }
    if (/\/maps\/embed/i.test(candidate)) {
      const q = url.searchParams.get("q");
      if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
      return "https://www.google.com/maps";
    }
    return candidate;
  } catch {
    return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}`;
  }
}
