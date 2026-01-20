type LogContext = {
  requestId?: string;
  orgId?: string | null;
  userId?: string | null;
};

export function logInfo(message: string, context: LogContext = {}) {
  console.log(
    JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}
