declare module "music-metadata/lib/core" {
    export interface ParsedPicture {
        data: Uint8Array;
        format: string;
    }

    export interface ParsedCommonTags {
        title?: string;
        artist?: string;
        album?: string;
        albumartist?: string;
        year?: number;
        track?: { no?: number };
        picture?: ParsedPicture[];
    }

    export interface ParsedFormat {
        duration?: number;
    }

    export interface ParsedMetadata {
        common: ParsedCommonTags;
        format: ParsedFormat;
    }

    export function parseBuffer(
        buffer: Uint8Array,
        fileInfo?: string,
        options?: { skipPostHeaders?: boolean },
    ): Promise<ParsedMetadata>;
}