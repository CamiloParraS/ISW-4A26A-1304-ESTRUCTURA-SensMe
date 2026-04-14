import { buildTrack } from "./trackBuilder";
import { fetchMusicBrainzData, type MBResult } from "./musicbrainz";
import { parseMetadata } from "./metadataParser";
import { walkDirectory } from "./walker";
import type { ImportError, ImportResult, Track } from "../types";

const BATCH_SIZE = 50;

export interface IngestCallbacks {
  onBatch: (tracks: Track[]) => void;
  onError: (err: ImportError) => void;
  onTotal: (total: number) => void;
  onProgress: (processed: number) => void;
}

export async function ingestFolder(
  rootHandle: FileSystemDirectoryHandle,
  existingPaths: Set<string>,
  callbacks: IngestCallbacks,
): Promise<ImportResult> {
  const allFiles: [FileSystemFileHandle, string][] = [];

  for await (const entry of walkDirectory(rootHandle)) {
    const [, path] = entry;

    if (!existingPaths.has(path)) {
      allFiles.push(entry);
    }
  }

  callbacks.onTotal(allFiles.length);

  let processed = 0;
  let imported = 0;
  const errors: ImportError[] = [];

  for (let index = 0; index < allFiles.length; index += BATCH_SIZE) {
    const batch = allFiles.slice(index, index + BATCH_SIZE);

    const builtTracks = await Promise.all(
      batch.map(async ([handle, filePath]) => {
        try {
          const file = await handle.getFile();
          const raw = await parseMetadata(file);

          let mb: MBResult | null = null;
          if ((!raw.coverArt || !raw.year) && raw.artist && raw.album) {
            mb = await fetchMusicBrainzData(
              raw.artist,
              raw.title ?? "",
              raw.album,
            );
          }

          return buildTrack(handle, filePath, raw, mb, mb?.coverArtUrl ?? null);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({
            fileName: handle.name,
            reason,
          });
          callbacks.onError({
            fileName: handle.name,
            reason,
          });
          return null;
        } finally {
          processed += 1;
          callbacks.onProgress(processed);
        }
      }),
    );

    const tracks = builtTracks.filter(
      (track): track is Track => track !== null,
    );
    callbacks.onBatch(tracks);
    imported += tracks.length;

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  return {
    imported,
    errors,
  };
}

export async function ingestFile(
  handleOrFile: FileSystemFileHandle | File,
  existingPaths: Set<string>,
  callbacks: IngestCallbacks,
): Promise<ImportResult> {
  const fileName = (handleOrFile as any).name ?? "unknown";

  if (existingPaths.has(fileName)) {
    callbacks.onTotal(0);
    return { imported: 0, errors: [] };
  }

  callbacks.onTotal(1);

  const errors: ImportError[] = [];

  try {
    const file: File =
      typeof (handleOrFile as any).getFile === "function"
        ? await (handleOrFile as FileSystemFileHandle).getFile()
        : (handleOrFile as File);

    const raw = await parseMetadata(file);

    let mb: MBResult | null = null;
    if ((!raw.coverArt || !raw.year) && raw.artist && raw.album) {
      mb = await fetchMusicBrainzData(raw.artist, raw.title ?? "", raw.album);
    }

    // Ensure we pass a FileSystemFileHandle-like object into buildTrack so
    // downstream code can call `getFile()` on the handle. When we only have
    // a plain File (from drag/drop), wrap it with a minimal handle shim.
    const handleArg: FileSystemFileHandle =
      typeof (handleOrFile as any).getFile === "function"
        ? (handleOrFile as FileSystemFileHandle)
        : ({
            getFile: async () => file,
            name: file.name,
          } as unknown as FileSystemFileHandle);

    const track = buildTrack(
      handleArg,
      fileName,
      raw,
      mb,
      mb?.coverArtUrl ?? null,
    );

    callbacks.onBatch([track]);
    callbacks.onProgress(1);

    return { imported: 1, errors };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    errors.push({ fileName, reason });
    callbacks.onError({ fileName, reason });
    callbacks.onProgress(1);
    return { imported: 0, errors };
  }
}
