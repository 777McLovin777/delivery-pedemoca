import { useCallback, useId, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { checkoutPageCurlGeometry } from "./checkoutPageCurlGeometry";

const colors = ["var(--checkout-blue)", "var(--checkout-yellow)", "var(--checkout-pink)"];
const color = (step) => colors[(step - 1) % colors.length];

// Only SVG attributes and content opacity change per frame; React commits the step once.
export default function CheckoutPageCurl({ ref, pageRef }) {
  const id = useId().replace(/:/g, "");
  const svg = useRef(null);
  const nodes = useRef({});
  const active = useRef(null);
  const frame = useRef(null);
  const size = useRef({ width: 0, height: 0 });

  const cancel = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = null;
    active.current = null;
    if (svg.current) svg.current.style.visibility = "hidden";
    if (pageRef.current) {
      pageRef.current.style.opacity = "";
      pageRef.current.inert = false;
    }
  }, [pageRef]);

  function draw(p) {
    const d = checkoutPageCurlGeometry(p, size.current.width, size.current.height);
    for (const key of ["front", "flap", "crease", "edge"]) {
      nodes.current[key].setAttribute("d", d[key]);
    }
    nodes.current.back.setAttribute("d", d.flap);
    nodes.current.back.style.opacity = d.flapOpacity;
    nodes.current.shadow.setAttribute("cy", d.shadowY);
    nodes.current.shadow.setAttribute("ry", d.shadowRadius);
    nodes.current.shadow.style.opacity = d.shadowOpacity;
    nodes.current.flap.style.opacity = d.flapOpacity;
    nodes.current.crease.style.opacity = d.flapOpacity * .4;
    nodes.current.edge.style.opacity = d.flapOpacity * .5;
  }

  const finishImmediately = useCallback(() => {
    const operation = active.current;
    if (!operation) return;
    cancel();
    operation.commit();
    operation.complete();
  }, [cancel]);

  useLayoutEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const bounds = svg.current.getBoundingClientRect();
      const changed = bounds.width !== size.current.width || bounds.height !== size.current.height;
      if (changed && active.current) finishImmediately();
      size.current = { width: bounds.width, height: bounds.height };
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(svg.current);
    const preferenceChanged = () => { if (media.matches) finishImmediately(); };
    media?.addEventListener("change", preferenceChanged);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      media?.removeEventListener("change", preferenceChanged);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      cancel();
    };
  }, [cancel, finishImmediately]);

  useImperativeHandle(ref, () => ({
    cancel,
    reveal() {
      const operation = active.current;
      if (!operation?.committed || operation.revealing) return;
      operation.revealing = true;
      operation.phaseStart = null;
      svg.current.style.visibility = "hidden";
      frame.current = requestAnimationFrame(operation.tick);
    },
    start({ from, to, commit, complete }) {
      cancel();
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
          !size.current.width || !size.current.height) {
        commit();
        complete();
        return;
      }
      const forward = to > from;
      const operation = { commit, complete, committed: false, phaseStart: null, revealing: false };
      active.current = operation;
      const root = svg.current;
      root.setAttribute("viewBox", `0 0 ${size.current.width} ${size.current.height}`);
      root.style.setProperty("--curl-front", color(forward ? from : to));
      root.style.setProperty("--curl-under", color(forward ? to : from));
      nodes.current.bounds.setAttribute("d", checkoutPageCurlGeometry(0, size.current.width, size.current.height).front);
      nodes.current.shadow.setAttribute("cx", size.current.width / 2);
      nodes.current.shadow.setAttribute("rx", size.current.width * .48);
      draw(forward ? 0 : 1);
      pageRef.current.inert = true;
      operation.tick = (now) => {
        if (active.current !== operation) return;
        if (operation.phaseStart === null) operation.phaseStart = now;
        const elapsed = now - operation.phaseStart;
        if (operation.revealing) {
          const opacity = Math.min(1, elapsed / 100);
          pageRef.current.style.opacity = opacity;
          if (opacity === 1) {
            cancel();
            complete();
            return;
          }
        } else if (elapsed < 100) {
          pageRef.current.style.opacity = 1 - elapsed / 100;
        } else {
          pageRef.current.style.opacity = 0;
          root.style.visibility = "visible";
          const t = Math.min(1, (elapsed - 100) / 600);
          const eased = t * t * (3 - 2 * t);
          draw(forward ? eased : 1 - eased);
          if (t === 1) {
            operation.committed = true;
            commit(); // reveal() resumes this same clock after React mounts the destination.
            return;
          }
        }
        frame.current = requestAnimationFrame(operation.tick);
      };
      frame.current = requestAnimationFrame(operation.tick);
    },
  }));

  return (
    <svg ref={svg} className="checkout-page-curl" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--brown)" stopOpacity=".18" />
          <stop offset=".28" stopColor="var(--white)" stopOpacity=".65" />
          <stop offset=".7" stopColor="var(--cream)" stopOpacity=".3" />
          <stop offset="1" stopColor="var(--brown)" stopOpacity=".2" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <clipPath id={`${id}-bounds`}><path ref={(node) => { nodes.current.bounds = node; }} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-bounds)`}>
        <rect width="100%" height="100%" fill="var(--curl-under)" />
        <ellipse ref={(node) => { nodes.current.shadow = node; }} fill="var(--brown)" filter={`url(#${id}-blur)`} />
        <path data-curl-part="front" ref={(node) => { nodes.current.front = node; }} fill="var(--curl-front)" />
        <path ref={(node) => { nodes.current.back = node; }} fill="var(--curl-front)" />
        <path ref={(node) => { nodes.current.flap = node; }} fill={`url(#${id}-back)`} />
        <path ref={(node) => { nodes.current.crease = node; }} fill="none" stroke="var(--brown)" strokeWidth="1" />
        <path ref={(node) => { nodes.current.edge = node; }} fill="none" stroke="var(--white)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
