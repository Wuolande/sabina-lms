import * as migration_20261112_075834_initial from './20261112_075834_initial';
import * as migration_20261112_085725_auth_verification from './20261112_085725_auth_verification';

export const migrations = [
  {
    up: migration_20261112_075834_initial.up,
    down: migration_20261112_075834_initial.down,
    name: '20261112_075834_initial',
  },
  {
    up: migration_20261112_085725_auth_verification.up,
    down: migration_20261112_085725_auth_verification.down,
    name: '20261112_085725_auth_verification'
  },
];
