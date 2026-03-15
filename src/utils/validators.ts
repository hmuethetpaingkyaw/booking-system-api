import AppError from "./app-error";

export const toPositiveInt = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }
  return parsed;
};

export const parseBookingDates = (
  startTime: unknown,
  endTime: unknown,
): { parsedStartTime: Date; parsedEndTime: Date } => {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    throw new AppError(
      "startTime and endTime must be ISO-8601 strings with timezone (UTC recommended).",
      400,
    );
  }

  // Time handling assumption:
  // clients must send timezone-aware ISO-8601 timestamps (e.g. 2026-03-15T09:00:00Z).
  // This avoids server-local timezone ambiguity.
  const timezonePattern = /(Z|[+-]\d{2}:\d{2})$/;
  if (!timezonePattern.test(startTime) || !timezonePattern.test(endTime)) {
    throw new AppError(
      "startTime and endTime must include timezone information (Z or +/-HH:MM).",
      400,
    );
  }

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  const isInvalidDate =
    !startTime ||
    !endTime ||
    Number.isNaN(parsedStartTime.getTime()) ||
    Number.isNaN(parsedEndTime.getTime());

  if (isInvalidDate) {
    throw new AppError("startTime and endTime must be valid ISO-8601 datetime strings.", 400);
  }

  if (parsedStartTime >= parsedEndTime) {
    throw new AppError("startTime must be before endTime.", 400);
  }

  return { parsedStartTime, parsedEndTime };
};
