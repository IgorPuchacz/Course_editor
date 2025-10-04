# Architektura pakietów kafelków

## Kontekst i cele rozdzielenia
Rozbudowa edytora kursów wymaga stabilnej warstwy domenowej, która może być jednocześnie wykorzystywana w narzędziach autorskich oraz w aplikacji ucznia. Aktualny kod już eksponuje wspólne typy kafelków i schematy walidacji w pakiecie `tiles-core`, które są importowane zarówno przez logikę edytora, jak i usługi zarządzania treścią lekcji.【F:packages/tiles-core/src/types.ts†L1-L192】【F:src/hooks/useLessonContentManager.ts†L1-L90】

Docelowe rozdzielenie na trzy pakiety umożliwia:
- **Niezależny cykl wydawniczy** dla modelu danych (`tiles-core`), dzięki czemu zmiany w schematach kafelków mogą być publikowane bez ponownego wydawania UI.【F:packages/tiles-core/src/types.ts†L1-L192】
- **Lekki runtime dla ucznia** (`tiles-runtime`), który zależy jedynie od stabilnego modelu i prostych prymitywów renderujących.
- **Bogate środowisko edycyjne** (`tiles-editor`), które rozszerza model o logikę interakcji, zarządzanie stanem edycji oraz narzędzia administracyjne.【F:src/state/editorReducer.ts†L1-L52】【F:src/Pages/LessonEditor.tsx†L1-L86】

### Zakres pakietów
- **`tiles-core`**: definicje typów, schematy Zod, migratory wersji kafelków, wspólne enumy oraz utilsy niezależne od frameworka. Już teraz dostarcza `EditorState`, `LessonTile` i funkcję `migrateTileConfig`, które stanowią kontrakt danych między edytorem a runtime.【F:packages/tiles-core/src/types.ts†L193-L352】
- **`tiles-editor`**: komponenty React do edycji, hooki (`useLessonContentManager`, `useTileInteractions`), reduktory stanu oraz narzędzia UI (paleta, boczny panel). Pakiet powinien eksportować jedynie stabilne API potrzebne do osadzenia edytora w panelu administracyjnym i opierać się na modelu z `tiles-core`.【F:src/hooks/useLessonContentManager.ts†L1-L147】【F:src/hooks/useTileInteractions.ts†L1-L93】
- **`tiles-runtime`**: zestaw lekkich komponentów wyświetlających kafelki w trybie ucznia. Bazuje na tych samych typach, ale nie importuje kodu edytora; zamiast tego konsumuje gotową strukturę lekcji i zapewnia minimalną logikę interakcji (np. ocenianie quizów, odtwarzanie multimediów).

## Współdzielenie UI i prymitywów
- Wspólne prymitywy (np. system powiadomień, modale, kontrolki siatki) powinny być wyniesione do osobnego podkatalogu `packages/ui-primitives` lub re-eksportowane z `tiles-editor`, o ile nie zawierają zależności specyficznych dla edycji. Przykładowe komponenty, takie jak `ToastContainer`, już spełniają kryteria neutralności i mogą być współdzielone.【F:packages/ui-primitives/src/Toast.tsx†L1-L120】
- Logika siatki (`GridUtils`) i obliczeń pozycji powinna pozostać w `tiles-core`, aby zarówno edytor, jak i runtime mogły korzystać z identycznych algorytmów rozmieszczania.【F:src/hooks/useTileInteractions.ts†L16-L65】
- Każdy nowy kafelek otrzymuje definicję w `tiles-core` oraz dedykowane komponenty renderujące w obu pakietach UI. Edytor może rozszerzać komponent runtime o dodatkowe nakładki (ramki zaznaczenia, uchwyty resize), ale podstawowy layout i styl powinny być dzielone poprzez kompozycję, a nie duplikację kodu.

## Konfiguracja aliasów
- Alias TypeScript `tiles-core` wskazuje na źródła pakietu w `tsconfig.app.json`, co pozwala na importy bezwzględne w całym monorepo.【F:tsconfig.app.json†L1-L26】
- Ten sam alias jest odwzorowany w konfiguracji Vite, aby bundler rozwiązywał moduły w czasie budowania.【F:vite.config.ts†L1-L17】
- Po wydzieleniu `tiles-editor` i `tiles-runtime` należy dopisać analogiczne aliasy oraz dodać je do `optimizeDeps.exclude`, jeśli zależą od bibliotek zewnętrznych ładowanych dynamicznie.

## Przepływ danych między edytorem a widokiem ucznia
1. **Ładowanie**: `useLessonContentManager` pobiera lekcję, migruje kafelki do aktualnej wersji (`migrateTileConfig`) i zapisuje je w stanie, który staje się źródłem prawdy dla canvasu edytora.【F:src/hooks/useLessonContentManager.ts†L39-L114】
2. **Stan interakcji**: `editorReducer` zarządza aktualnym trybem pracy (wybór, edycja tekstu, przeciąganie, zmiana rozmiaru) i powinien być ograniczony do pakietu `tiles-editor`. Runtime ucznia utrzymuje jedynie minimalny stan lokalny (np. odpowiedzi quizu) i reaguje na te same typy kafelków bez logiki edycyjnej.【F:src/state/editorReducer.ts†L1-L52】
3. **Synchronizacja**: widok ucznia otrzymuje zserializowaną lekcję z backendu. Aby uniknąć rozjazdów, format eksportu w edytorze musi odpowiadać temu, co runtime potrafi zrenderować — obie strony korzystają z `Lesson` i `LessonTile` z `tiles-core`. Eventy typu „podgląd na żywo” mogą być realizowane przez emiter zdarzeń w edytorze, który publikuje snapshot po każdej zmianie zapisywanej przez `useLessonContentManager`.

### Warstwa ładowania treści
- **Autorzy** korzystają z bogatego `LessonContentService` w pakiecie `tiles-editor`, który obsługuje autozapisy, normalizację siatki i bardziej rozbudowane scenariusze edycji.【F:packages/tiles-editor/src/services/lessonContentService.ts†L1-L160】
- **Runtime ucznia** używa lekkiego `LessonRuntimeService` (`src/services/lessonRuntimeService.ts`), który potrafi pobrać zserializowaną lekcję z API lub lokalnego cache, migrując kafelki wyłącznie z pomocą helperów `tiles-core`. Dzięki temu podgląd i aplikacja ucznia nie muszą importować zależności edytora.【F:src/services/lessonRuntimeService.ts†L1-L140】

## Zasady dalszego rozwoju
- **Double-click i tryby edycji**: Gest podwójnego kliknięcia jest obsługiwany w `useTileInteractions`, które w zależności od typu kafelka dispatchuje odpowiedni tryb (`startTextEditing`, `startImageEditing`, `startEditing`). Każde nowe rozszerzenie powinno dodać własną gałąź w tym hooku, zachowując jednolite wrażenia użytkownika.【F:src/hooks/useTileInteractions.ts†L25-L49】【F:src/state/editorReducer.ts†L1-L52】
- **Podgląd kafelków**: Hook `useTileInteractions` generuje siatkę podglądu podczas przeciągania i rozmiaru, korzystając z `GridUtils`. Runtime powinien wykorzystywać te same utilsy do obliczeń layoutu, aby zapewnić zgodność między edytorem a widokiem ucznia.【F:src/hooks/useTileInteractions.ts†L50-L105】
- **API zapisu**: `useLessonContentManager` wywołuje `LessonContentService.saveLessonContent` oraz prowadzi autozapis; przy rozdzieleniu pakietów serwis pozostaje w `tiles-editor`, natomiast runtime konsumuje tylko gotowe lekcje. Każda zmiana formatu wymaga aktualizacji migratorów w `tiles-core` i testów regresyjnych w obu pakietach.【F:src/hooks/useLessonContentManager.ts†L115-L147】
- **Preview ucznia**: tryb „Podgląd jako uczeń” w edytorze powinien używać komponentów z `tiles-runtime`, renderując bieżący stan bez potrzeby zapisu. Zapewnia to identyczność doświadczenia i eliminuje duplikację kodu renderującego.
