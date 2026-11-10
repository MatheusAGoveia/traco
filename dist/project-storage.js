import {createProject, validateProject} from './core.js';

export const STORAGE = 'traco-project-v1';

export function loadInitialProject(storage) {
  const empty = {...createProject('blank', 1200, 900, 350, 'Meu projeto'), unit: 'cm'};
  try {
    const cached = (storage || globalThis.localStorage).getItem(STORAGE);
    if (!cached) return {project: empty, loadFailed: false};
    const saved = validateProject(JSON.parse(cached));
    return {project: saved.presetId ? empty : saved, loadFailed: false};
  } catch {
    return {project: empty, loadFailed: true};
  }
}
