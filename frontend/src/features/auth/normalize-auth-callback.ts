import { clearAuthErrorParameters } from '@/features/auth/anonymous-session-fallback';

// Normalize OAuth failures before createHashRouter reads the initial location.
clearAuthErrorParameters();
