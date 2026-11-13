import * as migration_20261112_075834_initial from './20261112_075834_initial';
import * as migration_20261112_085725_auth_verification from './20261112_085725_auth_verification';
import * as migration_20261112_101517_tutors_catalogue from './20261112_101517_tutors_catalogue';
import * as migration_20261112_140156_scheduling_bookings from './20261112_140156_scheduling_bookings';
import * as migration_20261112_144837_payments_payouts from './20261112_144837_payments_payouts';
import * as migration_20261112_153439_classroom_reviews from './20261112_153439_classroom_reviews';
import * as migration_20261112_170454_messaging_notifications from './20261112_170454_messaging_notifications';
import * as migration_20261112_172523_content_academy from './20261112_172523_content_academy';
import * as migration_20261112_192945_legacy_import_fields from './20261112_192945_legacy_import_fields';
import * as migration_20261112_194000_import_legacy_files from './20261112_194000_import_legacy_files';
import * as migration_20261113_040559_rich_text_geo from './20261113_040559_rich_text_geo';
import * as migration_20261113_054332_r2_prefix from './20261113_054332_r2_prefix';
import * as migration_20261113_063011_lesson_packages from './20261113_063011_lesson_packages';
import * as migration_20261113_085028_progress_homework_goals from './20261113_085028_progress_homework_goals';
import * as migration_20261113_090219_classroom_files_recording from './20261113_090219_classroom_files_recording';

export const migrations = [
  {
    up: migration_20261112_075834_initial.up,
    down: migration_20261112_075834_initial.down,
    name: '20261112_075834_initial',
  },
  {
    up: migration_20261112_085725_auth_verification.up,
    down: migration_20261112_085725_auth_verification.down,
    name: '20261112_085725_auth_verification',
  },
  {
    up: migration_20261112_101517_tutors_catalogue.up,
    down: migration_20261112_101517_tutors_catalogue.down,
    name: '20261112_101517_tutors_catalogue',
  },
  {
    up: migration_20261112_140156_scheduling_bookings.up,
    down: migration_20261112_140156_scheduling_bookings.down,
    name: '20261112_140156_scheduling_bookings',
  },
  {
    up: migration_20261112_144837_payments_payouts.up,
    down: migration_20261112_144837_payments_payouts.down,
    name: '20261112_144837_payments_payouts',
  },
  {
    up: migration_20261112_153439_classroom_reviews.up,
    down: migration_20261112_153439_classroom_reviews.down,
    name: '20261112_153439_classroom_reviews',
  },
  {
    up: migration_20261112_170454_messaging_notifications.up,
    down: migration_20261112_170454_messaging_notifications.down,
    name: '20261112_170454_messaging_notifications',
  },
  {
    up: migration_20261112_172523_content_academy.up,
    down: migration_20261112_172523_content_academy.down,
    name: '20261112_172523_content_academy',
  },
  {
    up: migration_20261112_192945_legacy_import_fields.up,
    down: migration_20261112_192945_legacy_import_fields.down,
    name: '20261112_192945_legacy_import_fields',
  },
  {
    up: migration_20261112_194000_import_legacy_files.up,
    down: migration_20261112_194000_import_legacy_files.down,
    name: '20261112_194000_import_legacy_files',
  },
  {
    up: migration_20261113_040559_rich_text_geo.up,
    down: migration_20261113_040559_rich_text_geo.down,
    name: '20261113_040559_rich_text_geo',
  },
  {
    up: migration_20261113_054332_r2_prefix.up,
    down: migration_20261113_054332_r2_prefix.down,
    name: '20261113_054332_r2_prefix',
  },
  {
    up: migration_20261113_063011_lesson_packages.up,
    down: migration_20261113_063011_lesson_packages.down,
    name: '20261113_063011_lesson_packages',
  },
  {
    up: migration_20261113_085028_progress_homework_goals.up,
    down: migration_20261113_085028_progress_homework_goals.down,
    name: '20261113_085028_progress_homework_goals',
  },
  {
    up: migration_20261113_090219_classroom_files_recording.up,
    down: migration_20261113_090219_classroom_files_recording.down,
    name: '20261113_090219_classroom_files_recording'
  },
];
