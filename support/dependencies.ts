// The install rules of the QA CLI (the catalog's dependency rules, applied where the player's
// workspace is installed).

/** The only origin a dependency may be installed from. */
export const NPM_REGISTRY = 'https://registry.npmjs.org/';

export interface Lockfile {
  packages?: Record<string, { resolved?: string; link?: boolean }>;
}

/**
 * The first dependency of the lockfile that does not come from the npm registry, as
 * [name, resolved], or null. Workspace links have no origin and are skipped.
 */
export function forbiddenDependency(lockfile: Lockfile): [string, string] | null {
  for (const [path, entry] of Object.entries(lockfile.packages ?? {})) {
    if (path === '' || entry.link || entry.resolved === undefined) {
      continue;
    }
    if (!entry.resolved.startsWith(NPM_REGISTRY)) {
      return [path.replace(/^.*node_modules\//, ''), entry.resolved];
    }
  }
  return null;
}

/** The package names of `allowScripts` in package.json (`better-sqlite3@13.0.3: true` → `better-sqlite3`). */
export function allowedScriptPackages(packageJson: { allowScripts?: Record<string, unknown> }): string[] {
  return Object.entries(packageJson.allowScripts ?? {})
    .filter(([, allowed]) => allowed === true)
    .map(([spec]) => (spec.lastIndexOf('@') > 0 ? spec.slice(0, spec.lastIndexOf('@')) : spec));
}
