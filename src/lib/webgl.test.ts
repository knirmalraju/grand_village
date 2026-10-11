import { describe, expect, it, vi } from "vitest";
import { supportsWebGL2 } from "./webgl";

describe("WebGL availability before scene initialization", () => {
  it("uses the fallback when the browser disables WebGL", () => {
    const getContext = vi.fn(() => null);
    expect(supportsWebGL2(() => ({ getContext }) as unknown as HTMLCanvasElement)).toBe(false);
    expect(getContext).toHaveBeenCalledExactlyOnceWith("webgl2");
  });
  it("uses the fallback when canvas creation or context access throws", () => {
    expect(supportsWebGL2(() => { throw new Error("GPU unavailable"); })).toBe(false);
    expect(supportsWebGL2(() => ({ getContext() { throw new Error("Blocked"); } }) as unknown as HTMLCanvasElement)).toBe(false);
  });
  it.each([false, true])("checks lost context (%s) and releases the probe", (lost) => {
    const loseContext = vi.fn();
    const getContext = vi.fn(() => ({ isContextLost: () => lost, getExtension: () => ({ loseContext }) }));
    expect(supportsWebGL2(() => ({ getContext }) as unknown as HTMLCanvasElement)).toBe(!lost);
    expect(loseContext).toHaveBeenCalledOnce();
  });
  it("supports browsers without the optional context release extension", () => {
    const getContext = () => ({ isContextLost: () => false, getExtension: () => null });
    expect(supportsWebGL2(() => ({ getContext }) as unknown as HTMLCanvasElement)).toBe(true);
  });
});
