export const ERRORS = Object.freeze({
    TOO_MANY_ATTEMPTS: 'Too many login attempts from this network. Please try again later.',
    TEMPORARY_BLOCK: 'This account is temporarily locked due to repeated failed login attempts. Try again in',
    INVALID_CREDENTIALS: 'Invalid email/username or password.',
    REPEATED_FAILED_ATTEMPTS: 'locked after repeated failed logins.',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    UNHANDLED_EXCEPTION: 'Unhandled exception',
    UNHANDLED_NON_ERR_EXCEPTION: 'Unhandled non-Error exception',
    SESSION_NOT_FOUND: 'Session not found. Please log in again.',
    SESSION_REVOKED: 'Session has been revoked. Please log in again.',
    SESSION_EXPIRED_INACTIVITY: 'Session expired due to inactivity. Please log in again.',
    SESSION_EXPIRED: 'Session has expired. Please log in again.',
    ACCOUNT_INACTIVE: 'Account is no longer active.' 
})