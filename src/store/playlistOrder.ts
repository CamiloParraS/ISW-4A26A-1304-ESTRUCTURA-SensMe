import { ChainBuffer, toChainBuffer } from "../ds";
import type { TrackId } from "../types";

function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, length - 1));
}

export class PlaylistOrder {
  private readonly orderedTrackIds: ChainBuffer<TrackId>;

  private constructor(trackIds: TrackId[]) {
    this.orderedTrackIds = toChainBuffer(trackIds);
  }

  static fromTrackIds(trackIds: TrackId[]): PlaylistOrder {
    return new PlaylistOrder(trackIds);
  }

  appendTrack(trackId: TrackId): void {
    this.orderedTrackIds.addEnd(trackId);
  }

  removeTrack(trackId: TrackId): boolean {
    const currentTrackIds = this.snapshotTrackIds();
    const removeIndex = currentTrackIds.indexOf(trackId);

    if (removeIndex === -1) {
      return false;
    }

    this.orderedTrackIds.takeAt(removeIndex);
    return true;
  }

  moveTrackByIndex(fromIndex: number, toIndex: number): boolean {
    const currentLength = this.orderedTrackIds.getCount();
    if (currentLength === 0) {
      return false;
    }

    const startIndex = clampIndex(fromIndex, currentLength);
    const endIndex = clampIndex(toIndex, currentLength);

    if (startIndex === endIndex) {
      return false;
    }

    const movedTrackId = this.orderedTrackIds.takeAt(startIndex);
    if (movedTrackId === undefined) {
      return false;
    }

    this.orderedTrackIds.addAt(endIndex, movedTrackId);
    return true;
  }

  moveTrack(trackId: TrackId, toIndex: number): boolean {
    const currentTrackIds = this.snapshotTrackIds();
    const fromIndex = currentTrackIds.indexOf(trackId);

    if (fromIndex === -1) {
      return false;
    }

    return this.moveTrackByIndex(fromIndex, toIndex);
  }

  snapshotTrackIds(): TrackId[] {
    return this.orderedTrackIds.exportItems();
  }
}
