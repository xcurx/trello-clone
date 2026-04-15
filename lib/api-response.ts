export function success<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function created<T>(data: T): Response {
  return success(data, 201);
}

export function error(message: string, status = 400): Response {
  return Response.json({ success: false, error: message }, { status });
}

export function notFound(resource: string): Response {
  return error(`${resource} not found`, 404);
}

export function serverError(err: unknown): Response {
  console.error("[API Error]", err);
  const message =
    err instanceof Error ? err.message : "Internal server error";
  return error(message, 500);
}

export function validationError(
  errors: Record<string, string[] | undefined>,
): Response {
  return Response.json(
    { success: false, error: "Validation failed", details: errors },
    { status: 422 },
  );
}
