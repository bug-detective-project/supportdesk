import { describe, expect, it } from 'vitest';
import { allowedScriptPackages, forbiddenDependency } from './dependencies.ts';

const registry = 'https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz';

describe('forbiddenDependency', () => {
  it('accepts a lockfile whose packages all come from the registry, with workspace links', () => {
    expect(
      forbiddenDependency({
        packages: {
          '': {},
          client: {},
          'node_modules/client': { link: true },
          'node_modules/left-pad': { resolved: registry },
          'client/node_modules/react': { resolved: 'https://registry.npmjs.org/react/-/react-19.0.0.tgz' },
        },
      }),
    ).toBeNull();
  });

  it('names the first package resolved elsewhere, without the node_modules prefix', () => {
    expect(
      forbiddenDependency({
        packages: {
          'node_modules/left-pad': { resolved: registry },
          'server/node_modules/@scope/evil': { resolved: 'https://npm.example.com/evil.tgz' },
          'node_modules/git-dep': { resolved: 'git+ssh://git@github.com/x/y.git#abc' },
        },
      }),
    ).toEqual(['@scope/evil', 'https://npm.example.com/evil.tgz']);
  });

  it('accepts an empty lockfile', () => {
    expect(forbiddenDependency({})).toBeNull();
  });
});

describe('allowedScriptPackages', () => {
  it('turns the allowScripts specs into package names, scoped ones included', () => {
    expect(allowedScriptPackages({ allowScripts: { 'better-sqlite3@13.0.3': true, '@scope/native@1.0.0': true, 'esbuild@0.25.0': false, sharp: true } })).toEqual([
      'better-sqlite3',
      '@scope/native',
      'sharp',
    ]);
  });

  it('is empty without allowScripts', () => {
    expect(allowedScriptPackages({})).toEqual([]);
  });
});
