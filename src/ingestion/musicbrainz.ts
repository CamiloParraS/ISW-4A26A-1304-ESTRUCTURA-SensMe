import { CAA_BASE, MB_RATE_LIMIT_MS, MUSICBRAINZ_BASE } from "./constants";

let lastRequestAt = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = MB_RATE_LIMIT_MS - (now - lastRequestAt);

  if (wait > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, wait);
    });
  }

  lastRequestAt = Date.now();

  return fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
}

export interface MBResult {
  coverArtUrl: string | null;
  year: number | null;
}

interface ReleaseSearchResponse {
  releases?: Array<{
    id: string;
    date?: string;
  }>;
}

function escapeQueryValue(value: string): string {
  return value.replace(/"/g, '\\"').trim();
}

async function searchRelease(
  query: string,
): Promise<{ id: string; date?: string } | null> {
  const searchUrl = `${MUSICBRAINZ_BASE}/release?query=${encodeURIComponent(query)}&limit=1&fmt=json`;
  const response = await rateLimitedFetch(searchUrl);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ReleaseSearchResponse;
  return data.releases?.[0] ?? null;
}

export async function fetchMusicBrainzData(
  artist: string,
  title: string,
  album: string,
): Promise<MBResult> {
  try {
    const queries = [
      `artist:"${escapeQueryValue(artist)}" release:"${escapeQueryValue(album)}"`,
      title
        ? `artist:"${escapeQueryValue(artist)}" recording:"${escapeQueryValue(title)}"`
        : "",
    ].filter(Boolean);

    for (const query of queries) {
      const release = await searchRelease(query);

      if (!release) {
        continue;
      }

      const yearCandidate = release.date
        ? Number.parseInt(release.date.slice(0, 4), 10)
        : Number.NaN;
      const coverArtResponse = await rateLimitedFetch(
        `${CAA_BASE}/release/${release.id}/front-250`,
      );

      return {
        coverArtUrl: coverArtResponse.ok ? coverArtResponse.url : null,
        year: Number.isNaN(yearCandidate) ? null : yearCandidate,
      };
    }

    return { coverArtUrl: null, year: null };
  } catch {
    return { coverArtUrl: null, year: null };
  }
}
