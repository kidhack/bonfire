import { logError } from './logging';

type ErrorContext = {
  requestId?: string;
  orgId?: string | null;
  userId?: string | null;
};

export function captureError(error: unknown, context: ErrorContext = {}) {
  logError('app.error', error, context);
}
