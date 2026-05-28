import "server-only";

export const privatePreviewAccessDeniedMessage =
  "Доступ к закрытому preview ограничен. Обратитесь к владельцу CoachOS.";

export const registrationClosedMessage = "Регистрация временно закрыта.";

export function isRegistrationEnabled() {
  return process.env.REGISTRATION_ENABLED === "true";
}

export function getAllowedEmails() {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined) {
  const allowedEmails = getAllowedEmails();

  if (allowedEmails.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return Boolean(email && allowedEmails.includes(email.trim().toLowerCase()));
}
