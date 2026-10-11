export function isAllowedPushEndpoint(value: string) {
  try {
    const u = new URL(value);
    const domains = [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "push.services.mozilla.com",
      "web.push.apple.com",
      "notify.windows.com",
    ];
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      domains.some((d) => u.hostname === d || u.hostname.endsWith("." + d))
    );
  } catch {
    return false;
  }
}
