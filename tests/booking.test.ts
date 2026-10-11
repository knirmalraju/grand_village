import { describe, it, expect } from "vitest";
import { overlaps, canTransition, initialData } from "../src/lib/data";
describe("booking rules", () => {
  it("rejects overlapping slots but allows adjacent bookings", () => {
    const a = {
      starts_at: "2026-11-01T10:00:00Z",
      ends_at: "2026-11-01T12:00:00Z",
    };
    expect(
      overlaps(a, {
        starts_at: "2026-11-01T11:00:00Z",
        ends_at: "2026-11-01T13:00:00Z",
      }),
    ).toBe(true);
    expect(
      overlaps(a, {
        starts_at: "2026-11-01T12:00:00Z",
        ends_at: "2026-11-01T13:00:00Z",
      }),
    ).toBe(false);
  });
  it("does not allow a parent to accept a request", () => {
    const b = initialData().bookings[1];
    expect(canTransition(b, "accepted", "parent")).toBe(false);
    expect(canTransition(b, "accepted", "host")).toBe(true);
  });
  it("does not complete an unpaid booking or cancel a paid one", () => {
    const b = initialData().bookings[0];
    expect(
      canTransition({ ...b, payment_status: "unpaid" }, "completed", "host"),
    ).toBe(false);
    expect(canTransition(b, "cancelled", "parent")).toBe(false);
  });
  it("does not resurrect a completed booking", () => {
    const b = initialData().bookings[2];
    expect(canTransition(b, "accepted", "host")).toBe(false);
  });
});
