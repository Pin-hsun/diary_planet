import { useState, useEffect, useRef } from "react";
import { GEMS, GEM_COLORS } from "./gem";

// ── Data ──────────────────────────────────────────────────────────────────────

const CAT = {
  A: { label: "Self",         tc: "a" },
  B: { label: "Relation", tc: "b" },
  C: { label: "Achieve",  tc: "c" },
  D: { label: "Meaning",      tc: "d" },
};

const TAG_STYLES = {
  a: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC", activeBg: "#534AB7", activeColor: "#EEEDFE" },
  b: { bg: "#FBEAF0", color: "#72243E", border: "#ED93B1", activeBg: "#993556", activeColor: "#FBEAF0" },
  c: { bg: "#E1F5EE", color: "#085041", border: "#5DCAA5", activeBg: "#0F6E56", activeColor: "#E1F5EE" },
  d: { bg: "#FAEEDA", color: "#633806", border: "#EF9F27", activeBg: "#854F0B", activeColor: "#FAEEDA" },
};

// ── Gem Canvas ────────────────────────────────────────────────────────────────

function SpinningGem({ selectedCat }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const angleRef  = useRef(0);

  useEffect(() => {
    const cv  = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const S   = 90;
    cv.width  = S;
    cv.height = S;

    const h2r = (hex) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const lerp = (a, b, t) =>
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

    const draw = (a) => {
      ctx.clearRect(0, 0, S, S);
      const ck  = selectedCat ?? "null";
      const col = GEM_COLORS[ck];
      const hi  = h2r(col.hi), mid = h2r(col.mid), lo = h2r(col.lo);
      const cx  = S / 2, cy = S / 2 + 2, R = 30;
      const cos = Math.cos(a), sin = Math.sin(a);

      const proj = (px, py, pz) => {
        const rx = px * cos - pz * sin;
        const rz = px * sin + pz * cos;
        const sc = 1 + rz * 0.12;
        return [cx + rx * R * sc, cy + py * R * sc];
      };

      const top   = proj(0, -1.5, 0);
      const waist = [
        proj(-1,    0,  0),
        proj(-0.5,  0,  0.866),
        proj(0.5,   0,  0.866),
        proj(1,     0,  0),
        proj(0.5,   0, -0.866),
        proj(-0.5,  0, -0.866),
      ];
      const bot = proj(0, 1.4, 0);
      const n   = waist.length;

      const upperFaces = waist.map((_, i) => [top,  waist[i], waist[(i + 1) % n]]);
      const lowerFaces = waist.map((_, i) => [bot,  waist[i], waist[(i + 1) % n]]);

      const faceZ = (pts) => pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const norm2d = (a, b, c) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
      const lf     = (pts) => Math.max(0, Math.min(1, (norm2d(...pts) + 2000) / 4000));

      [...upperFaces, ...lowerFaces]
        .sort((fa, fb) => faceZ(fa) - faceZ(fb))
        .forEach((pts) => {
          const isUpper = pts[0] === top;
          const l       = lf(pts);
          let fill;
          if (isUpper) {
            fill = l > 0.7 ? lerp(hi, mid, 0) : l > 0.55 ? lerp(hi, mid, 0.3) : lerp(mid, lo, 0.5);
          } else {
            fill = l > 0.55 ? lerp(mid, lo, 0.2) : lerp(mid, lo, 0.8);
          }
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
          ctx.closePath();
          ctx.fillStyle   = fill;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        });

      // Highlight
      ctx.beginPath();
      ctx.arc(top[0] - 2, top[1] + 1, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.fill();

      // Shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + R * 1.45, R * 0.5, R * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fill();
    };

    const loop = () => {
      angleRef.current += 0.018;
      draw(angleRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [selectedCat]);

  return <canvas ref={canvasRef} width={90} height={90} />;
}

// ── Main Popup ────────────────────────────────────────────────────────────────

/**
 * EggDiaryPopup
 *
 * Props:
 *   egg        – { name: string, diary: string }
 *   onClose    – () => void
 *   onSend     – ({ gem: { cat, value } | null, message: string }) => void
 */
export default function EggDiaryPopup({ egg, onClose, onSend }) {
  const [filter,   setFilter]   = useState("all");
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState(null); // { cat, value }
  const [message,  setMessage]  = useState("");
  const [toast,    setToast]    = useState(null);

  // ── Filter gems ────────────────────────────────────────────────────────
  const cats    = filter === "all" ? ["A", "B", "C", "D"] : [filter];
  const q       = query.toLowerCase();
  const visible = cats.flatMap((cat) =>
    GEMS[cat]
      .filter((v) => !q || v.toLowerCase().includes(q))
      .map((v) => ({ cat, value: v }))
  );

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!selected && !message.trim()) {
      showToast("Select a gem or write a message");
      return;
    }
    const parts = [];
    if (selected) parts.push(`Sent ${selected.value} ✦`);
    if (message.trim()) parts.push("Message sent");
    showToast(parts.join(" · "));
    onSend?.({ gem: selected, message: message.trim() });
    setSelected(null);
    setMessage("");
  };

  // ── Chip toggle ───────────────────────────────────────────────────────────
  const toggleChip = (cat, value) => {
    setSelected((prev) =>
      prev && prev.cat === cat && prev.value === value ? null : { cat, value }
    );
  };

  const col      = GEM_COLORS[selected?.cat ?? "null"];
  const labelCol = selected ? col.mid : "#888780";

  return (
    <div
      style={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>{egg?.name ?? "Egg"}</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Diary */}
        <div style={styles.diary}>{egg?.diary ?? ""}</div>

        {/* Spinning gem */}
        <div style={styles.gemArea}>
          <SpinningGem selectedCat={selected?.cat ?? null} />
          <div style={{ ...styles.gemLabel, color: labelCol }}>
            {selected ? selected.value : "Choose a gem"}
          </div>
        </div>

        {/* Section label */}
        <div style={styles.secLabel}>Send a gem</div>

        {/* Category tags */}
        <div style={styles.tagRow}>
          <Tag active={filter === "all"} onClick={() => setFilter("all")} tc={null}>All</Tag>
          {["A", "B", "C", "D"].map((k) => (
            <Tag key={k} active={filter === k} onClick={() => setFilter(k)} tc={CAT[k].tc}>
              {CAT[k].label}
            </Tag>
          ))}
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <svg style={styles.searchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <input
            style={styles.searchInput}
            placeholder="Search values..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Gem grid */}
        <div style={styles.grid}>
          {visible.length === 0 ? (
            <div style={styles.empty}>No gems found</div>
          ) : (
            visible.map(({ cat, value }) => {
              const isSel = selected?.cat === cat && selected?.value === value;
              return (
                <Chip key={`${cat}-${value}`} tc={CAT[cat].tc} selected={isSel}
                  onClick={() => toggleChip(cat, value)}>
                  {value}
                </Chip>
              );
            })
          )}
        </div>

        {/* Divider */}
        <hr style={styles.divider} />

        {/* Message */}
        <div style={styles.secLabel}>Leave a message</div>
        <textarea
          style={styles.textarea}
          placeholder="Write something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Send button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button style={styles.sendBtn} onClick={handleSend}>Send</button>
        </div>

        {/* Toast */}
        {toast && <div style={styles.toast}>{toast}</div>}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Tag({ tc, active, onClick, children }) {
  const s   = tc ? TAG_STYLES[tc] : null;
  const base = {
    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
    cursor: "pointer", border: "0.5px solid transparent", transition: "all .15s",
    fontFamily: "inherit",
  };
  if (!tc) {
    return (
      <button onClick={onClick} style={{
        ...base,
        background: active ? "#1a1a1a" : "#f1efeb",
        color:      active ? "#fff"    : "#888",
        borderColor: "#ccc",
      }}>{children}</button>
    );
  }
  return (
    <button onClick={onClick} style={{
      ...base,
      background:  active ? s.activeBg    : s.bg,
      color:       active ? s.activeColor : s.color,
      borderColor: active ? s.activeBg    : s.border,
    }}>{children}</button>
  );
}

function Chip({ tc, selected, onClick, children }) {
  const s = TAG_STYLES[tc];
  return (
    <button onClick={onClick} style={{
      padding: "6px 8px", borderRadius: 6, fontSize: 11,
      cursor: "pointer", textAlign: "center", fontFamily: "inherit",
      transition: "all .15s", minWidth: 0, overflow: "hidden",
      textOverflow: "ellipsis", whiteSpace: "nowrap",
      background:  selected ? s.bg    : "#f5f4f1",
      color:       selected ? s.color : "#333",
      border:      selected ? `1.5px solid ${s.activeBg}` : "0.5px solid #ddd",
    }}>{children}</button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  sheet: {
    position: "relative",
    background: "#fff",
    borderRadius: 16,
    border: "0.5px solid rgba(0,0,0,0.08)",
    width: "100%", maxWidth: 420,
    padding: "14px 16px 22px",
    maxHeight: "82vh", overflowY: "auto",
  },
  handle: {
    width: 32, height: 4, borderRadius: 2,
    background: "#ddd", margin: "0 auto 10px",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 16, fontWeight: 500, color: "#111",
  },
  closeBtn: {
    background: "none", border: "none", fontSize: 18,
    cursor: "pointer", color: "#999", padding: "0 4px",
  },
  diary: {
    fontSize: 14, lineHeight: 1.75, color: "#333",
    background: "#f8f7f4", borderRadius: 10,
    padding: "12px 14px",
  },
  gemArea: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 0 8px",
  },
  gemLabel: {
    fontSize: 13, marginTop: 6, fontStyle: "italic",
    transition: "color .3s",
  },
  secLabel: {
    fontSize: 12, color: "#999", marginBottom: 8,
  },
  tagRow: {
    display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10,
  },
  searchWrap: {
    position: "relative", marginBottom: 12,
  },
  searchIcon: {
    position: "absolute", left: 10, top: "50%",
    transform: "translateY(-50%)", width: 14, height: 14, opacity: 0.4,
    color: "#666",
  },
  searchInput: {
    width: "100%", padding: "8px 12px 8px 32px",
    border: "0.5px solid #ddd", borderRadius: 8,
    fontSize: 13, fontFamily: "inherit", color: "#111",
    background: "#fff", outline: "none",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6, maxHeight: 140, overflowY: "auto",
    marginBottom: 12,
  },
  empty: {
    fontSize: 13, color: "#aaa", padding: "16px 0",
    textAlign: "center", gridColumn: "1 / -1",
  },
  divider: {
    border: "none", borderTop: "0.5px solid #eee", margin: "14px 0",
  },
  textarea: {
    width: "100%", padding: "8px 10px",
    border: "0.5px solid #ddd", borderRadius: 8,
    fontSize: 13, fontFamily: "inherit", color: "#111",
    background: "#fff", resize: "none", height: 52,
    display: "block", outline: "none",
    boxSizing: "border-box",
  },
  sendBtn: {
    background: "rgba(83,74,183,.12)",
    border: "0.5px solid rgba(83,74,183,.45)",
    color: "#534AB7", borderRadius: 8,
    padding: "8px 20px", fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
  },
  toast: {
    position: "absolute", bottom: 16, left: "50%",
    transform: "translateX(-50%)",
    background: "#2d1b6e", color: "#c8b4ff",
    borderRadius: 8, padding: "8px 16px",
    fontSize: 12, whiteSpace: "nowrap",
    pointerEvents: "none",
  },
};
