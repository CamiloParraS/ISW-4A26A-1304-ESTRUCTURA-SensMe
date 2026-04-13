export type PlaybackEventType =
  | "play"
  | "pause"
  | "ended"
  | "timeupdate"
  | "error"
  | "volumechange"
  | "durationchange";

export type PlaybackListener = (
  event: PlaybackEventType,
  data?: number,
) => void;

export class AudioEngine {
  private context: AudioContext;
  private element: HTMLAudioElement;
  private source: MediaElementAudioSourceNode;
  private gainNode: GainNode;
  private listeners: Set<PlaybackListener> = new Set();
  private currentUrl: string | null = null;

  constructor() {
    this.context = new AudioContext();
    this.element = new Audio();
    this.element.preload = "metadata";

    this.source = this.context.createMediaElementSource(this.element);
    this.gainNode = this.context.createGain();
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    this.element.addEventListener("play", () => this.emit("play"));
    this.element.addEventListener("pause", () => this.emit("pause"));
    this.element.addEventListener("ended", () => this.emit("ended"));
    this.element.addEventListener("timeupdate", () => {
      this.emit("timeupdate", this.element.currentTime);
    });
    this.element.addEventListener("durationchange", () => {
      this.emit("durationchange", this.element.duration || 0);
    });
    this.element.addEventListener("error", () => this.emit("error"));
  }

  async load(file: File): Promise<void> {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
    }

    this.currentUrl = URL.createObjectURL(file);
    this.element.src = this.currentUrl;
    this.element.load();

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async play(): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    await this.element.play();
  }

  pause(): void {
    this.element.pause();
  }

  seek(seconds: number): void {
    const duration = Number.isFinite(this.element.duration)
      ? this.element.duration
      : 0;
    const next = Math.max(0, Math.min(seconds, duration || 0));
    this.element.currentTime = next;
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.context.currentTime,
      0.01,
    );
    this.emit("volumechange", volume);
  }

  setLoop(loop: boolean): void {
    this.element.loop = loop;
  }

  get currentTime(): number {
    return this.element.currentTime;
  }

  get duration(): number {
    return this.element.duration || 0;
  }

  get paused(): boolean {
    return this.element.paused;
  }

  on(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.element.pause();

    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }

    void this.context.close();
  }

  private emit(event: PlaybackEventType, data?: number): void {
    for (const listener of this.listeners) {
      listener(event, data);
    }
  }
}

export const audioEngine = new AudioEngine();
