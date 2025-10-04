# Course Editor

## Lesson content entry points
- `LessonContentService` (packages/tiles-editor/src/services/lessonContentService.ts) powers the authoring experience with canvas normalization, autosave hooks and draft persistence tailored to the editor UI.【F:packages/tiles-editor/src/services/lessonContentService.ts†L1-L160】
- `LessonRuntimeService` (src/services/lessonRuntimeService.ts) is a lightweight loader for the learner runtime that fetches serialized lessons from an API or local cache while migrating tiles via `tiles-core` helpers.【F:src/services/lessonRuntimeService.ts†L1-L140】

See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for a broader overview of the package responsibilities.【F:docs/ARCHITECTURE.md†L1-L35】
