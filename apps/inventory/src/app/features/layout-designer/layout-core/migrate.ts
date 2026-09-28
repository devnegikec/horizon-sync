/**
 * Layout document migrations.
 *
 * The document carries `schemaVersion`. Adding an optional field with a default
 * does **not** need a version bump - old documents still parse, because the schema
 * applies the default. Bumping the version is reserved for changes that alter
 * *meaning*: renamed fields, changed units, or a changed default that moves geometry.
 *
 * Every future migration must be added here as a step and mirrored in
 * `core-service/app/layout_design/migrate.py`; a document that parses on one side and
 * not the other is a defect.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 3
 */

import { CURRENT_SCHEMA_VERSION } from './schema';

/** Raised when a document was produced by a newer build than this one. */
export class UnsupportedSchemaVersionError extends Error {
  constructor(public readonly version: number) {
    super(`Document schemaVersion ${version} is newer than this build supports (max ${CURRENT_SCHEMA_VERSION})`);
    this.name = 'UnsupportedSchemaVersionError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Bring a raw document up to `CURRENT_SCHEMA_VERSION`.
 *
 * An absent or non-numeric version is left for the schema to report, so a
 * hand-written document without a version still imports.
 *
 * @throws UnsupportedSchemaVersionError when the document is newer than this build.
 */
export function migrateDocument(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;

  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version)) return raw;
  if (version > CURRENT_SCHEMA_VERSION) throw new UnsupportedSchemaVersionError(version);

  // v1 is the first version, so there is nothing to upgrade yet. Future steps chain
  // here, e.g.:
  //   if (version < 2) return migrateV1ToV2({ ...raw, schemaVersion: 2 });

  return { ...raw, schemaVersion: CURRENT_SCHEMA_VERSION };
}
