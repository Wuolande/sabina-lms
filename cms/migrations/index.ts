import * as migration_20261112_075834_initial from './20261112_075834_initial';

export const migrations = [
  {
    up: migration_20261112_075834_initial.up,
    down: migration_20261112_075834_initial.down,
    name: '20261112_075834_initial'
  },
];
