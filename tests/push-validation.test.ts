import { describe, it, expect } from "vitest";
import { isAllowedPushEndpoint } from "../src/lib/push-validation";
describe("push endpoint protection", () => {
  it("allows HTTPS push providers", () => {
    expect(
      isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/example"),
    ).toBe(true);
    expect(
      isAllowedPushEndpoint(
        "https://updates.push.services.mozilla.com/wpush/v2/example",
      ),
    ).toBe(true);
  });
  it.each([
    "http://fcm.googleapis.com/x",
    "https://127.0.0.1/x",
    "https://example.com/x",
    "https://fcm.googleapis.com.evil.example/x",
    "https://user:pass@fcm.googleapis.com/x",
    "https://fcm.googleapis.com:8443/x",
    "not a URL",
  ])("blocks untrusted endpoint %s", (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });
});
