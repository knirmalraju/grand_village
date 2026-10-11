/** Three.js requires WebGL 2. Probe before mounting a renderer, which logs and
 * throws when GPU acceleration is unavailable (including embedded browsers). */
export function supportsWebGL2(
  createCanvas = () => document.createElement("canvas"),
): boolean {
  try {
    const context = createCanvas().getContext("webgl2");
    if (!context) return false;
    const supported = !context.isContextLost();
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return supported;
  } catch {
    return false;
  }
}
