// A brand-coloured band sweeps across the screen for ReWear's two milestones:
// an order placed, and a listing sent for review. The new page appears behind it.
// Nothing else gets this (see DESIGN.md "Motion").
//
// glimm (https://glimm.dev) is loaded only the first time a milestone plays,
// so it adds nothing to the normal page load. If WebGL isn't available, the
// library fails to load, or the shopper prefers reduced motion, the change
// just happens straight away.

// Gold, Caramel and Accent from the brand palette (Espresso made the band muddy)
const BRAND_SWEEP = ["#e8c39e", "#c0834f", "#a0521d"];

let glimmModule;

// Fetch glimm ahead of time on pages that end in a milestone (checkout, sell),
// so the sweep starts the moment the action succeeds
export function preloadMilestone() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  glimmModule ||= import("glimm");
  glimmModule.catch(() => {
    glimmModule = undefined;
  });
}

export async function playMilestone(run) {
  // The change must happen exactly once, whatever goes wrong with the animation
  let done = false;
  const change = () => {
    if (done) return;
    done = true;
    return run();
  };

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || document.hidden) return change();

  let canvas;
  try {
    glimmModule ||= import("glimm");
    const { createShader, playSweep, accentChain } = await glimmModule;

    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(canvas);

    const ctrl = createShader({ canvas, palette: accentChain(BRAND_SWEEP), bandTight: 18, brightness: 1, swellAmount: 0.3 });
    if (!ctrl) throw new Error("no webgl");

    const sweep = playSweep(ctrl, {
      sweepMs: 1000,
      easing: "easeInOutCubic",
      onMidpoint: change,
      onComplete: () => {
        ctrl.destroy();
        canvas.remove();
      },
    });
    await sweep.midpoint;
  } catch {
    canvas?.remove();
    return change();
  }
}
