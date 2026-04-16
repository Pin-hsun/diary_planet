import { useEffect, useRef } from "react";

// ── Gem data ──────────────────────────────────────────────────────────────────

export const GEMS = {
  A: ["Humility", "Prudence", "Passion", "Openness", "Growth", "Rationality"],
  B: ["Care", "Kindness", "Forgiveness", "Generosity", "Genuineness", "Faithfulness"],
  C: ["Creativity", "Curiosity", "Judgement", "Bravery", "Perseverance", "Diligence"],
  D: ["Beauty", "Gratitude", "Hope", "Spirituality", "Wisdom", "Justice"],
};

export const GEM_COLORS = {
  null: { hi: "#D3D1C7", mid: "#888780", lo: "#444441" },
  A:    { hi: "#CECBF6", mid: "#7F77DD", lo: "#3C3489" },
  B:    { hi: "#F4C0D1", mid: "#D4537E", lo: "#72243E" },
  C:    { hi: "#9FE1CB", mid: "#1D9E75", lo: "#085041" },
  D:    { hi: "#FAC775", mid: "#BA7517", lo: "#633806" },
};

// Map a human label or "A · Self"-style attr to its category letter.
const LABEL_TO_CAT = {
  Self: "A",
  Relation: "B", Relationship: "B",
  Achieve: "C", Achievement: "C",
  Meaning: "D",
};

export function attrToCat(attr) {
  if (!attr) return null;
  // Exact label first ("Self", "Relation", …), then fall back to the first
  // character for "A · Self"-style strings.
  return LABEL_TO_CAT[attr] ?? (["A", "B", "C", "D"].includes(attr[0]) ? attr[0] : null);
}

export function getAttrStyle(attr) {
  const cat = attrToCat(attr);
  const col = GEM_COLORS[cat] ?? GEM_COLORS.null;
  return { bg: col.lo, color: col.hi };
}

// ── Gem drawing (shared core) ─────────────────────────────────────────────────

export function drawGem(ctx, size, angle, cat) {
  const S = size;
  ctx.clearRect(0, 0, S, S);

  const col = GEM_COLORS[cat ?? "null"] ?? GEM_COLORS.null;
  const h2r = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const lerp = (a, b, t) =>
    `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  const hi = h2r(col.hi), mid = h2r(col.mid), lo = h2r(col.lo);

  const cx = S / 2, cy = S / 2 + 2, R = S / 3;
  const cos = Math.cos(angle), sin = Math.sin(angle);

  const proj = (px, py, pz) => {
    const rx = px * cos - pz * sin;
    const rz = px * sin + pz * cos;
    const sc = 1 + rz * 0.12;
    return [cx + rx * R * sc, cy + py * R * sc];
  };

  const top = proj(0, -1.5, 0);
  const waist = [
    proj(-1, 0, 0),
    proj(-0.5, 0, 0.866),
    proj(0.5, 0, 0.866),
    proj(1, 0, 0),
    proj(0.5, 0, -0.866),
    proj(-0.5, 0, -0.866),
  ];
  const bot = proj(0, 1.4, 0);
  const n = waist.length;

  const upperFaces = waist.map((_, i) => [top, waist[i], waist[(i + 1) % n]]);
  const lowerFaces = waist.map((_, i) => [bot, waist[i], waist[(i + 1) % n]]);

  const faceZ = (pts) => pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const norm2d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const lf = (pts) => Math.max(0, Math.min(1, (norm2d(...pts) + 2000) / 4000));

  [...upperFaces, ...lowerFaces]
    .sort((fa, fb) => faceZ(fa) - faceZ(fb))
    .forEach((pts) => {
      const isUpper = pts[0] === top;
      const l = lf(pts);
      let fill;
      if (isUpper) {
        fill = l > 0.6 ? lerp(hi, mid, 0) : l > 0.4 ? lerp(hi, mid, 0.2) : lerp(hi, mid, 0.5);
      } else {
        fill = l > 0.5 ? lerp(hi, mid, 0.5) : lerp(hi, mid, 0.85);
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 1.45, R * 0.5, R * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fill();
}

// ── Static gem (single render, no animation) ─────────────────────────────────

export function StaticGem({ cat, size = 60, angle = 0.5 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = size;
    cv.height = size;
    drawGem(cv.getContext("2d"), size, angle, cat);
  }, [cat, size, angle]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}
