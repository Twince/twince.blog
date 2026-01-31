export type ActiveId = string | null;

interface HeadingObserver {
  observer: IntersectionObserver,
  bind(idList: string[]): void,
  disconnect(): void,
  getActiveId(): ActiveId
}