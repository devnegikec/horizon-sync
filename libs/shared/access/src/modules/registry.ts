/**
 * Module access registry.
 *
 * Maps a module key (e.g. `wms`) to its `ModuleAccessConfig`. Register new
 * modules here — or at runtime via `registerModuleAccess` — to bring them under
 * the same rules engine.
 */
import type { ModuleAccessConfig } from '../types';

import { wmsAccessConfig } from './wms';

const REGISTRY: Record<string, ModuleAccessConfig> = {
  [wmsAccessConfig.module]: wmsAccessConfig,
};

/** Register (or override) a module's access config. */
export function registerModuleAccess(config: ModuleAccessConfig): void {
  REGISTRY[config.module] = config;
}

/** Look up a module's access config (undefined when the module isn't registered). */
export function getModuleAccessConfig(moduleKey: string): ModuleAccessConfig | undefined {
  return REGISTRY[moduleKey];
}

/** All registered module keys. */
export function listRegisteredAccessModules(): string[] {
  return Object.keys(REGISTRY);
}
