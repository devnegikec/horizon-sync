/**
 * layout-core - the pure layout document engine.
 *
 * No React, no fetch, no clock, no randomness. It can validate a document on every
 * keystroke without a round trip, and the same code runs in tests.
 *
 * The server recompiles the posted document and is the authority on apply, so this
 * engine's job is fast, clear feedback - never persistence.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md
 */

export * from './compile';
export * from './geometry';
export * from './migrate';
export * from './naming';
export * from './rules';
export * from './schema';
