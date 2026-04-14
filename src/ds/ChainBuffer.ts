export interface ChainCell<T> {
  item: T;
  before: ChainCell<T> | null;
  after: ChainCell<T> | null;
}

export class ChainBuffer<T> {
  private start: ChainCell<T> | null = null;
  private end: ChainCell<T> | null = null;
  private count = 0;

  private makeCell(item: T): ChainCell<T> {
    return { item, before: null, after: null };
  }

  addStart(item: T): ChainCell<T> {
    const cell = this.makeCell(item);

    if (this.start === null) {
      this.start = cell;
      this.end = cell;
    } else {
      cell.after = this.start;
      this.start.before = cell;
      this.start = cell;
    }

    this.count++;
    return cell;
  }

  addEnd(item: T): ChainCell<T> {
    const cell = this.makeCell(item);

    if (this.end === null) {
      this.start = cell;
      this.end = cell;
    } else {
      cell.before = this.end;
      this.end.after = cell;
      this.end = cell;
    }

    this.count++;
    return cell;
  }

  addAt(index: number, item: T): ChainCell<T> {
    if (index <= 0) return this.addStart(item);
    if (index >= this.count) return this.addEnd(item);

    let cursor = this.start!;
    for (let i = 0; i < index; i++) {
      cursor = cursor.after!;
    }

    const cell = this.makeCell(item);
    const beforeCursor = cursor.before!;
    cell.after = cursor;
    cell.before = beforeCursor;
    beforeCursor.after = cell;
    cursor.before = cell;

    this.count++;
    return cell;
  }

  takeStart(): T | undefined {
    if (this.start === null) return undefined;

    const item = this.start.item;
    this.start = this.start.after;

    if (this.start !== null) {
      this.start.before = null;
    } else {
      this.end = null;
    }

    this.count--;
    return item;
  }

  takeEnd(): T | undefined {
    if (this.end === null) return undefined;

    const item = this.end.item;
    this.end = this.end.before;

    if (this.end !== null) {
      this.end.after = null;
    } else {
      this.start = null;
    }

    this.count--;
    return item;
  }

  detachCell(cell: ChainCell<T>): T {
    if (cell.before !== null) {
      cell.before.after = cell.after;
    } else {
      this.start = cell.after;
    }

    if (cell.after !== null) {
      cell.after.before = cell.before;
    } else {
      this.end = cell.before;
    }

    cell.before = null;
    cell.after = null;

    this.count--;
    return cell.item;
  }

  takeAt(index: number): T | undefined {
    if (index < 0 || index >= this.count) return undefined;

    let cursor = this.start!;
    for (let i = 0; i < index; i++) {
      cursor = cursor.after!;
    }

    return this.detachCell(cursor);
  }

  readStart(): T | undefined {
    return this.start?.item;
  }

  readEnd(): T | undefined {
    return this.end?.item;
  }

  loadItems(items: T[]): void {
    this.start = null;
    this.end = null;
    this.count = 0;

    for (const item of items) {
      this.addEnd(item);
    }
  }

  exportItems(): T[] {
    const result: T[] = [];
    let cursor = this.start;

    while (cursor !== null) {
      result.push(cursor.item);
      cursor = cursor.after;
    }

    return result;
  }

  getCount(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }
}

export function toChainBuffer<T>(items: T[]): ChainBuffer<T> {
  const buffer = new ChainBuffer<T>();
  buffer.loadItems(items);
  return buffer;
}
