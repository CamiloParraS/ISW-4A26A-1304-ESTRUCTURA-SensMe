//www.geeksforgeeks.org/dsa/deque-data-structure/

https: export class Deque<T> {
  private items: T[] = [];
  private head = 0;

  pushBack(item: T): void {
    this.items.push(item);
  }

  pushFront(item: T): void {
    this.items.splice(this.head, 0, item);
  }

  popFront(): T | undefined {
    if (this.head >= this.items.length) return undefined;

    return this.items[this.head++];
  }

  peek(): T | undefined {
    return this.items[this.head];
  }

  replaceUpcoming(items: T[]): void {
    this.items = [...this.items.slice(0, this.head), ...items];
  }

  toArray(): T[] {
    return this.items.slice(this.head);
  }

  size(): number {
    return this.items.length - this.head;
  }

  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  compact(): void {
    this.items = this.items.slice(this.head);
    this.head = 0;
  }
}
