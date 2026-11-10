import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../dist/core.js';
import {createRoom} from '../dist/room-core.js';
import {STORAGE, loadInitialProject} from '../dist/project-storage.js';

const storage = entries => ({getItem: key => entries[key] ?? null});

test('a first visit opens an empty project with no room or furniture', () => {
  const {project, loadFailed} = loadInitialProject(storage({}));
  assert.equal(project.name, 'Meu projeto');
  assert.equal(project.unit, 'cm');
  assert.deepEqual(project.pieces, []);
  assert.deepEqual(project.measures, []);
  assert.equal(project.room, undefined);
  assert.equal(loadFailed, false);
});

test('a saved user project and its room are restored', () => {
  const saved = {...createProject('desk'), room: createRoom(), unit: 'mm'};
  const {project, loadFailed} = loadInitialProject(storage({[STORAGE]: JSON.stringify(saved)}));
  assert.deepEqual(project, saved);
  assert.equal(loadFailed, false);
});

test('a legacy bundled preset is not reopened automatically or erased', () => {
  const cached = JSON.stringify({...createProject(), presetId: 'legacy-demo'});
  const entries = {[STORAGE]: cached};
  const {project, loadFailed} = loadInitialProject(storage(entries));
  assert.deepEqual(project.pieces, []);
  assert.equal(project.room, undefined);
  assert.equal(loadFailed, false);
  assert.equal(entries[STORAGE], cached);
});

test('the old last-workspace pointer cannot select a bundled room', () => {
  const {project} = loadInitialProject(storage({
    'traco-last-workspace': 'legacy-workspace',
    'legacy-workspace': JSON.stringify(createProject())
  }));
  assert.deepEqual(project.pieces, []);
});

test('invalid saved data falls back to an empty project', () => {
  for (const cached of ['{invalid', '{}']) {
    const {project, loadFailed} = loadInitialProject(storage({[STORAGE]: cached}));
    assert.deepEqual(project.pieces, []);
    assert.equal(loadFailed, true);
  }
});

test('unavailable browser storage still allows an empty project', () => {
  const {project, loadFailed} = loadInitialProject({getItem() {throw new Error('Storage unavailable');}});
  assert.deepEqual(project.pieces, []);
  assert.equal(loadFailed, true);
});
