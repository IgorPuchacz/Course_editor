import { Lesson, LessonTile, lessonSchema, migrateTileConfig } from 'tiles-core';

const RUNTIME_STORAGE_KEY_PREFIX = 'lesson-runtime:';
const LEGACY_STORAGE_KEY_PREFIX = 'lesson-content:';

type LessonRuntimeOptions = {
  endpoint?: string;
  useCache?: boolean;
};

const isBrowserEnvironment = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const cloneLesson = <T>(value: T): T => {
  const structuredCloneFn = (globalThis as { structuredClone?: <U>(input: U) => U }).structuredClone;
  if (typeof structuredCloneFn === 'function') {
    return structuredCloneFn(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const applyTileMigrations = (tiles: LessonTile[]): LessonTile[] =>
  tiles.map(tile => migrateTileConfig(tile));

const normalizeLesson = (lesson: Lesson): Lesson => {
  const cloned = cloneLesson(lesson);
  const migratedTiles = applyTileMigrations(cloned.tiles);
  const highestPage = migratedTiles.reduce((max, tile) => Math.max(max, tile.page ?? 1), 1);

  return {
    ...cloned,
    tiles: migratedTiles,
    total_pages: Math.max(cloned.total_pages ?? 1, highestPage),
    canvas_settings: { ...cloned.canvas_settings },
  };
};

const resolveApiEndpoint = (lessonId: string, override?: string): string | null => {
  const template = override ?? (import.meta.env.VITE_LESSON_RUNTIME_ENDPOINT as string | undefined);
  if (!template) {
    return null;
  }

  if (template.includes('{id}')) {
    return template.replace('{id}', lessonId);
  }

  if (template.includes(':id')) {
    return template.replace(':id', lessonId);
  }

  const normalized = template.endsWith('/') ? template.slice(0, -1) : template;
  return `${normalized}/${lessonId}`;
};

const parseLesson = (raw: unknown): Lesson | null => {
  const result = lessonSchema.safeParse(raw);
  if (!result.success) {
    console.warn('LessonRuntimeService: received invalid lesson payload', result.error);
    return null;
  }

  return normalizeLesson(result.data);
};

const getRuntimeStorageKey = (lessonId: string) => `${RUNTIME_STORAGE_KEY_PREFIX}${lessonId}`;
const getLegacyStorageKey = (lessonId: string) => `${LEGACY_STORAGE_KEY_PREFIX}${lessonId}`;

const readFromStorage = (lessonId: string): Lesson | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const storage = window.localStorage;
    const runtimeValue = storage.getItem(getRuntimeStorageKey(lessonId));
    const legacyValue = runtimeValue ?? storage.getItem(getLegacyStorageKey(lessonId));

    if (!legacyValue) {
      return null;
    }

    const parsed = parseLesson(JSON.parse(legacyValue));
    return parsed ? cloneLesson(parsed) : null;
  } catch (error) {
    console.warn('LessonRuntimeService: failed to read lesson from storage', error);
    return null;
  }
};

const writeToStorage = (lessonId: string, lesson: Lesson) => {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getRuntimeStorageKey(lessonId),
      JSON.stringify(lesson)
    );
  } catch (error) {
    console.warn('LessonRuntimeService: failed to persist lesson cache', error);
  }
};

const fetchFromApi = async (lessonId: string, endpoint?: string): Promise<Lesson | null> => {
  if (typeof fetch !== 'function') {
    return null;
  }

  const url = resolveApiEndpoint(lessonId, endpoint);
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('LessonRuntimeService: API request failed', response.status, response.statusText);
      return null;
    }

    const payload = await response.json();
    return parseLesson(payload);
  } catch (error) {
    console.warn('LessonRuntimeService: failed to fetch lesson from API', error);
    return null;
  }
};

export class LessonRuntimeService {
  static async loadLesson(
    lessonId: string,
    options: LessonRuntimeOptions = {}
  ): Promise<Lesson | null> {
    const { useCache = true, endpoint } = options;

    if (useCache) {
      const cached = readFromStorage(lessonId);
      if (cached) {
        return cached;
      }
    }

    const fromApi = await fetchFromApi(lessonId, endpoint);
    if (fromApi) {
      writeToStorage(lessonId, fromApi);
      return cloneLesson(fromApi);
    }

    if (!useCache) {
      return readFromStorage(lessonId);
    }

    return null;
  }

  static cacheLessonSnapshot(lessonId: string, lesson: Lesson): void {
    const normalized = normalizeLesson(lesson);
    writeToStorage(lessonId, normalized);
  }
}

export type { LessonRuntimeOptions };
