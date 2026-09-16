export const errorMessage = (error: unknown, fallback = "Internal server error.") =>
  error instanceof Error ? error.message : fallback;
