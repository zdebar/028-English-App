import { ACCOUNT_TEXTS } from './cs/account';
import { ARIA_TEXTS } from './cs/aria';
import { COMMON_TEXTS } from './cs/common';
import { HOME_TEXTS } from './cs/home';
import { NAVIGATION_TEXTS } from './cs/navigation';
import { OVERVIEW_TEXTS } from './cs/overview';
import { PRACTICE_TEXTS } from './cs/practice';

export const TEXTS = {
  ...COMMON_TEXTS,
  ...NAVIGATION_TEXTS,
  ...HOME_TEXTS,
  ...PRACTICE_TEXTS,
  ...OVERVIEW_TEXTS,
  ...ACCOUNT_TEXTS,
} as const;

export { ARIA_TEXTS };
