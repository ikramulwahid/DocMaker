/**
 * Dynamic field subsystem (M5): the allow-listed key registry, the shared
 * resolver and the unresolved-field report. Exported through `@/core` so the
 * editor, layout renderer, UI and PDF CLI all use the identical definitions.
 */
export * from "./keys";
export * from "./resolve";
export * from "./unresolved";
