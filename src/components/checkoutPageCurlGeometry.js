// Adapted from Page Curl V3: one normalized surface, traversed in either direction.
export function checkoutPageCurlGeometry(progress, width, height) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const radius = Math.min(16, w / 4, h / 4);
  const flat = `M0 0 H${w} V${h-radius} Q${w} ${h} ${w-radius} ${h} H${radius} Q0 ${h} 0 ${h-radius} Z`;
  if (p === 0 || p === 1) {
    return { front: p === 0 ? flat : '', flap: '', crease: '', edge: '',
      fold: p === 0 ? h : 0, bulge: 0, shadowOpacity: 0, shadowY: h,
      shadowRadius: 0, flapOpacity: 0 };
  }
  // A smooth envelope removes V3's fractional-power cusp and residual top strip.
  const envelope = Math.sin(Math.PI * p) ** 2;
  const fold = h * (1 - p);
  const lift = h * .32 * (1 - p) * envelope;
  const lip = h * .035 * envelope;
  const warp = w * .025 * envelope;
  const tilt = h * .008 * Math.sin(4 * p) * envelope;
  const left = fold + tilt;
  const right = fold - tilt;
  const ridge = `M0 ${left} Q${-warp} ${left-lift*.25} ${w*.01} ${left-lift*.65} C${w*.25} ${left-lift*.85} ${w*.55} ${right-lift*.85} ${w*.78} ${right-lift} Q${w*.94} ${right-lift} ${w*.99} ${right-lift*.53} Q${w+warp} ${right-lift*.17} ${w} ${right}`;
  return {
    front: `M0 0 H${w} V${right} Q${w+warp} ${right-lift*.17} ${w*.99} ${right-lift*.53} Q${w*.94} ${right-lift} ${w*.78} ${right-lift} C${w*.55} ${right-lift*.85} ${w*.25} ${left-lift*.85} ${w*.01} ${left-lift*.65} Q${-warp} ${left-lift*.25} 0 ${left} Z`,
    flap: `${ridge} Q${w*.8} ${right+lip} ${w*.5} ${fold+lip*.7} Q${w*.2} ${left+lip} 0 ${left} Z`,
    crease: `M0 ${left} Q${w/2} ${fold+lip*.7} ${w} ${right}`,
    edge: ridge,
    fold, bulge: envelope, shadowOpacity: .22 * envelope,
    shadowY: fold + lip, shadowRadius: h * .035 * envelope,
    flapOpacity: envelope,
  };
}
