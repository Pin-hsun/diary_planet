import { useState, useEffect, useRef, useCallback } from "react";
import { StaticCreature } from "./Monsters";
import { StaticGem, GEM_COLORS } from "./gem";

// ── Constants ────────────────────────────────────────────────────────────────

const CATS = {
  A: { label: "Self" },
  B: { label: "Relation" },
  C: { label: "Achieve" },
  D: { label: "Meaning" },
};

const BG = {
  A: ["#EEEDFE", "#AFA9EC"],
  B: ["#FBEAF0", "#ED93B1"],
  C: ["#E1F5EE", "#5DCAA5"],
  D: ["#FAEEDA", "#EF9F27"],
};

const PAL = {
  A: ["#9f95f0", "#c8c4f8", "#6b63c4", "#e0deff", "#534AB7"],
  B: ["#e08aaa", "#f4b8cc", "#b85c80", "#fcdde8", "#993556"],
  C: ["#5dcaa5", "#9fe1cb", "#1d9e75", "#c8f0e2", "#0F6E56"],
  D: ["#f0b060", "#fac775", "#ba7517", "#ffe0a0", "#854F0B"],
};

const BADGE_STYLES = {
  A: { background: "#EEEDFE", color: "#3C3489" },
  B: { background: "#FBEAF0", color: "#72243E" },
  C: { background: "#E1F5EE", color: "#085041" },
  D: { background: "#FAEEDA", color: "#633806" },
};

const CAT_TAG_STYLES = {
  A: { bg: "#534AB7", color: "#EEEDFE", idleBg: "#EEEDFE", idleColor: "#3C3489", border: "#AFA9EC" },
  B: { bg: "#993556", color: "#FBEAF0", idleBg: "#FBEAF0", idleColor: "#72243E", border: "#ED93B1" },
  C: { bg: "#0F6E56", color: "#E1F5EE", idleBg: "#E1F5EE", idleColor: "#085041", border: "#5DCAA5" },
  D: { bg: "#854F0B", color: "#FAEEDA", idleBg: "#FAEEDA", idleColor: "#633806", border: "#EF9F27" },
};

const PAGE_SIZE = 18;
const DEPLOY_LIMIT = 5;

// ── Seeded random ─────────────────────────────────────────────────────────────

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Monster canvas drawing ────────────────────────────────────────────────────

function drawMonster(canvas, seed, cat) {
  if (!canvas) return;
  const W = (canvas.width = canvas.height = 90);
  const ctx = canvas.getContext("2d");
  const r = seededRand(seed * 31 + 17);

  const [bg0, bg1] = BG[cat];
  const pal = PAL[cat];
  const grd = ctx.createRadialGradient(W / 2, W * 0.55, 8, W / 2, W * 0.55, W * 0.7);
  grd.addColorStop(0, bg0);
  grd.addColorStop(1, bg1);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, W);

  const c1 = pal[Math.floor(r() * 3)];
  const c2 = pal[2 + Math.floor(r() * 2)];
  const c3 = pal[4];
  const cx = W / 2, cy = W * 0.52;
  const bW = 14 + r() * 10, bH = 14 + r() * 10;

  ctx.fillStyle = c1;
  ctx.strokeStyle = c2;
  ctx.lineWidth = 1.2;

  const bt = Math.floor(r() * 3);
  if (bt === 0) {
    ctx.beginPath(); ctx.ellipse(cx, cy, bW, bH, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (bt === 1) {
    ctx.beginPath(); ctx.moveTo(cx - bW + 6, cy - bH); ctx.lineTo(cx + bW - 6, cy - bH);
    ctx.quadraticCurveTo(cx + bW, cy - bH, cx + bW, cy - bH + 6);
    ctx.lineTo(cx + bW, cy + bH - 6); ctx.quadraticCurveTo(cx + bW, cy + bH, cx + bW - 6, cy + bH);
    ctx.lineTo(cx - bW + 6, cy + bH); ctx.quadraticCurveTo(cx - bW, cy + bH, cx - bW, cy + bH - 6);
    ctx.lineTo(cx - bW, cy - bH + 6); ctx.quadraticCurveTo(cx - bW, cy - bH, cx - bW + 6, cy - bH);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx, cy - bH); ctx.lineTo(cx + bW, cy + bH); ctx.lineTo(cx - bW, cy + bH);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  const es = 7 + r() * 4, eY = cy - bH * 0.25, eX = bW * 0.55;
  [[cx - eX, eY], [cx + eX, eY]].forEach(([ex, ey]) => {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(ex, ey, es, es * (0.7 + r() * 0.5), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(ex + (r() - 0.5) * 1.5, ey + (r() - 0.5) * 1.5, es * 0.48, 0, Math.PI * 2); ctx.fill();
  });

  const et = Math.floor(r() * 3), mY = cy + bH * 0.32;
  ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.fillStyle = c3;
  if (et === 0) {
    ctx.beginPath(); ctx.arc(cx, mY - 2, 4 + r() * 3, 0.1, Math.PI - 0.1); ctx.stroke();
  } else if (et === 1) {
    const mw = 4 + r() * 5;
    ctx.beginPath(); ctx.moveTo(cx - mw, mY - 2); ctx.lineTo(cx - mw * 0.3, mY + 3);
    ctx.lineTo(cx + mw * 0.3, mY + 3); ctx.lineTo(cx + mw, mY - 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx, mY, 3 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < Math.floor(r() * 3) + 1; i++) {
    const xt = Math.floor(r() * 3);
    ctx.fillStyle = c2;
    if (xt === 0) {
      const hx = cx + (r() > 0.5 ? 1 : -1) * (bW + 2 + r() * 4), hy = cy - bH * 0.3 + r() * bH * 0.6;
      ctx.beginPath(); ctx.ellipse(hx, hy, 3 + r() * 3, 2 + r() * 2, r() * Math.PI, 0, Math.PI * 2); ctx.fill();
    } else if (xt === 1) {
      const tx = cx + (r() - 0.5) * bW * 1.4, ty = cy - bH - 4 - r() * 6;
      ctx.beginPath(); ctx.moveTo(tx - 2, ty + 6); ctx.lineTo(tx, ty); ctx.lineTo(tx + 2, ty + 6);
      ctx.closePath(); ctx.fill();
    } else {
      const ax = cx + (r() > 0.5 ? bW + 2 : -bW - 2), ay = cy + (r() - 0.5) * bH * 0.5;
      ctx.beginPath(); ctx.moveTo(ax, ay - 4);
      ctx.bezierCurveTo(ax + (r() > 0.5 ? 10 : -10), ay, ax + (r() > 0.5 ? 6 : -6), ay + 6, ax, ay + 4);
      ctx.fill();
    }
  }
}

// ── MonsterCanvas ─────────────────────────────────────────────────────────────

function MonsterCanvas({ seed, cat }) {
  const ref = useRef(null);
  useEffect(() => { drawMonster(ref.current, seed, cat); }, [seed, cat]);
  return <canvas ref={ref} width={90} height={90} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ── StarIcon ──────────────────────────────────────────────────────────────────

function StarIcon({ lit, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
        fill={lit ? "#EF9F27" : "rgba(255,255,255,0.28)"}
        stroke={lit ? "#BA7517" : "rgba(255,255,255,0.7)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ── Initial data (1 monster) ─────────────────────────────────────────────────

const INITIAL_MONSTERS = [
  {
    id: 1,
    name: "Aurum",
    cat: "A",
    deployed: false,
    seed: 29,
    starred: false,
    addedAt: randomDate(0),
  },
];

// ── MonsterCard ───────────────────────────────────────────────────────────────

function MonsterCard({ monster, selected, onToggleSelect, onToggleStar }) {
  const selClass = selected ? (monster.deployed ? "recall" : "deploy") : null;

  const borderStyle = selClass === "recall"
    ? { border: "2px solid #1D9E75" }
    : selClass === "deploy"
    ? { border: "2px solid #534AB7" }
    : { border: "0.5px solid rgba(0,0,0,0.1)" };

  const checkBg = selected
    ? monster.deployed ? "#1D9E75" : "#534AB7"
    : "rgba(0,0,0,0.2)";

  return (
    <div
      onClick={() => onToggleSelect(monster.id)}
      style={{
        ...borderStyle,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        background: "#fff",
        position: "relative",
        transition: "border-color 0.15s",
      }}
    >
      {/* Face */}
      <div style={{
        width: "100%", aspectRatio: "1", position: "relative",
        background: `radial-gradient(circle at 50% 55%, ${BG[monster.cat][0]}, ${BG[monster.cat][1]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <StaticCreature color={monster.color} torsoColor={monster.torsoColor} size={56} />

        {/* Star button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar(monster.id); }}
          style={{
            position: "absolute", top: 4, left: 4, width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <StarIcon lit={monster.starred} size={20} />
        </button>

        {/* Check indicator (hidden — selection shown via card border)
        <div
          data-chk={monster.id}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(monster.id); }}
          style={{
            position: "absolute", top: 5, right: 5,
            width: 18, height: 18, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.8)",
            background: checkBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {selected && (
            <div style={{
              width: 3, height: 6,
              border: "1.5px solid #fff",
              borderTop: "none", borderLeft: "none",
              transform: "rotate(45deg) translate(-1px,-1px)",
            }} />
          )}
        </div>
        */}

        {/* Deployed dot */}
        <div style={{
          position: "absolute", bottom: 5, left: 5,
          width: 7, height: 7, borderRadius: "50%",
          background: monster.deployed ? "#1D9E75" : "rgba(255,255,255,0.25)",
        }} />
      </div>

      {/* Body */}
      <div style={{
        padding: "6px 8px 8px",
        background: monster.deployed
          ? "linear-gradient(135deg, #302b56 0%, #100f2f 100%)"
          : "#fff",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          marginBottom: 2,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: monster.deployed ? "#d0c8ff" : "#111",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            flex: 1, minWidth: 0,
          }}>
            {monster.name}
          </span>
          <StaticGem cat={monster.cat} size={18} />
        </div>
        <div style={{
          fontSize: 10,
          color: monster.deployed ? "rgba(200,196,248,0.55)" : "#999",
          marginBottom: 3,
        }}>
          {fmtDate(monster.addedAt)}
        </div>
        {/* "On planet" status row (hidden — dark background signals deploy state)
        {monster.deployed && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#5DCAA5", fontWeight: 500 }}>On planet</span>
          </div>
        )}
        */}
        {/* Category pill (hidden — background gradient signals category)
        {!monster.deployed && (
          <span style={{
            display: "inline-flex", padding: "1px 6px", borderRadius: 20,
            fontSize: 10, fontWeight: 500,
            ...BADGE_STYLES[monster.cat],
          }}>
            {CATS[monster.cat].label}
          </span>
        )}
        */}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * MonsterManager
 *
 * Props:
 *   initialMonsters  – array of monster objects (optional, defaults to sample data)
 *   onDeploy         – (ids: number[]) => void
 *   onRecall         – (ids: number[]) => void
 */
export default function MonsterManager({
  initialMonsters,
  monsters: controlledMonsters,
  setMonsters: controlledSetMonsters,
  onDeploy,
  onRecall,
}) {
  const [internalMonsters, internalSetMonsters] = useState(initialMonsters ?? INITIAL_MONSTERS);
  const monsters = controlledMonsters ?? internalMonsters;
  const setMonsters = controlledSetMonsters ?? internalSetMonsters;
  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState("desc");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, green = false) => {
    setToast({ msg, green });
    setTimeout(() => setToast(null), 2200);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const filtered = (() => {
    let list = [...monsters];
    if (catFilter !== "all") list = list.filter((m) => m.cat === catFilter);
    if (statusFilter === "deployed") list = list.filter((m) => m.deployed);
    else if (statusFilter === "idle") list = list.filter((m) => !m.deployed);
    else if (statusFilter === "starred") list = list.filter((m) => m.starred);
    if (query) list = list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
    list.sort((a, b) => sortDir === "desc" ? b.addedAt - a.addedAt : a.addedAt - b.addedAt);
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = monsters.length;
  const depCount = monsters.filter((m) => m.deployed).length;
  const idleCount = total - depCount;
  const starCount = monsters.filter((m) => m.starred).length;

  const selMode = (() => {
    if (!selected.size) return null;
    const ids = [...selected];
    const allDep = ids.every((id) => monsters.find((m) => m.id === id)?.deployed);
    const allIdle = ids.every((id) => !monsters.find((m) => m.id === id)?.deployed);
    return allDep ? "recall" : allIdle ? "deploy" : "mixed";
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleSelect = (id) => {
    const isDeselecting = selected.has(id);
    setSelected(isDeselecting ? new Set() : new Set([id]));
    setExpandedId(isDeselecting ? null : id);
  };

  const toggleStar = (id) => {
    setMonsters((prev) => prev.map((m) => m.id === id ? { ...m, starred: !m.starred } : m));
  };

  const handleAction = () => {
    if (!selected.size) return;
    const ids = [...selected];
    if (selMode === "deploy") {
      const currentDeployed = monsters.filter((m) => m.deployed).length;
      if (currentDeployed + ids.length > DEPLOY_LIMIT) {
        showToast(`Max ${DEPLOY_LIMIT} on planet — recall some first`);
        return;
      }
      setMonsters((prev) => prev.map((m) => ids.includes(m.id) ? { ...m, deployed: true } : m));
      onDeploy?.(ids);
      showToast(`${ids.length} monster${ids.length > 1 ? "s" : ""} deployed ✦`, false);
    } else if (selMode === "recall") {
      setMonsters((prev) => prev.map((m) => ids.includes(m.id) ? { ...m, deployed: false } : m));
      onRecall?.(ids);
      showToast(`${ids.length} recalled`, true);
    }
    setSelected(new Set());
    setExpandedId(null);
  };

  const setStatusAndReset = (sf) => {
    setStatusFilter((prev) => (prev === sf && sf !== "all" ? "all" : sf));
    setPage(1);
  };

  // ── Stat filter button ────────────────────────────────────────────────────

  const StatBtn = ({ sfKey, label, value, starIcon }) => {
    const active = statusFilter === sfKey;
    const isGreen = sfKey === "deployed";
    const isAmber = sfKey === "starred";
    return (
      <button
        onClick={() => setStatusAndReset(sfKey)}
        style={{
          flex: 1, padding: "10px 0", textAlign: "center", cursor: "pointer",
          border: "none", background: active
            ? isGreen ? "rgba(29,158,117,0.08)" : isAmber ? "rgba(186,117,23,0.08)" : "rgba(0,0,0,0.04)"
            : "transparent",
          fontFamily: "inherit", position: "relative",
          borderRight: sfKey !== "starred" ? "0.5px solid rgba(0,0,0,0.08)" : "none",
          transition: "background 0.15s",
        }}
      >
        <div style={{
          fontSize: 10, color: active ? (isGreen ? "#1D9E75" : isAmber ? "#BA7517" : "#7F77DD") : "#999",
          marginBottom: 2, textAlign: "center",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 17, fontWeight: 500,
          color: active ? (isGreen ? "#0F6E56" : isAmber ? "#854F0B" : "#534AB7") : "#111",
          textAlign: "center",
        }}>
          {value}
        </div>
        {active && (
          <div style={{
            position: "absolute", bottom: 0, left: 12, right: 12, height: 2,
            borderRadius: 2,
            background: isGreen ? "#1D9E75" : isAmber ? "#BA7517" : "#534AB7",
          }} />
        )}
      </button>
    );
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const PgBtn = ({ pg, label, disabled }) => (
    <button
      onClick={() => !disabled && setPage(pg)}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: "50%", fontSize: 13,
        border: `0.5px solid ${page === pg ? "#111" : "rgba(0,0,0,0.15)"}`,
        cursor: disabled ? "default" : "pointer",
        background: page === pg ? "#111" : "#fff",
        color: page === pg ? "#fff" : "#111",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", opacity: disabled ? 0.3 : 1,
      }}
    >
      {label ?? pg}
    </button>
  );

  const pgButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages <= 5 || i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pgButtons.push(<PgBtn key={i} pg={i} />);
    } else if (Math.abs(i - page) === 2) {
      pgButtons.push(<span key={`e${i}`} style={{ fontSize: 11, color: "#999", alignSelf: "center", padding: "0 2px" }}>…</span>);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%", maxWidth: 420, margin: "0 auto",
      background: "#fff",
      border: "0.5px solid rgba(0,0,0,0.08)",
      borderRadius: 16, overflow: "hidden",
      position: "relative",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px 10px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", gap: 8,
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#111" }}>My Monsters</span>
        <button
          onClick={handleAction}
          disabled={!selected.size || selMode === "mixed"}
          style={{
            borderRadius: 20, padding: "6px 14px", fontSize: 13,
            cursor: !selected.size || selMode === "mixed" ? "default" : "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap", border: "0.5px solid transparent",
            opacity: !selected.size || selMode === "mixed" ? 0.35 : 1,
            background: selMode === "recall" ? "rgba(29,158,117,0.12)" : "rgba(83,74,183,0.12)",
            borderColor: selMode === "recall" ? "rgba(29,158,117,0.5)" : "rgba(83,74,183,0.45)",
            color: selMode === "recall" ? "#0F6E56" : "#534AB7",
            transition: "background 0.15s",
          }}
        >
          {selMode === "recall"
            ? `Recall (${selected.size})`
            : selected.size > 0
            ? `Deploy (${selected.size})`
            : "Deploy"}
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 16px 8px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, opacity: 0.4 }}
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4" /><line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search monsters..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px",
              border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 20,
              fontSize: 14, fontFamily: "inherit", color: "#111",
              background: "rgba(0,0,0,0.04)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Stats filter row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <StatBtn sfKey="all" label="Total" value={total} />
        <StatBtn sfKey="deployed" label="On planet" value={depCount} />
        <StatBtn sfKey="idle" label="Idle" value={idleCount} />
        <StatBtn sfKey="starred" label="Starred" value={starCount} starIcon />
      </div>

      {/* Cat filter */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 14px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
      }}>
        {[["all", "All"], ...Object.entries(CATS).map(([k, v]) => [k, v.label])].map(([key, lbl]) => {
          const active = catFilter === key;
          const ts = key !== "all" ? CAT_TAG_STYLES[key] : null;
          return (
            <button
              key={key}
              onClick={() => { setCatFilter(key); setPage(1); }}
              style={{
                padding: "4px 7px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                cursor: "pointer", border: "0.5px solid transparent",
                whiteSpace: "nowrap", fontFamily: "inherit",
                transition: "all 0.15s",
                background: active
                  ? key === "all" ? "#111" : ts.bg
                  : key === "all" ? "rgba(0,0,0,0.05)" : ts.idleBg,
                color: active
                  ? key === "all" ? "#fff" : ts.color
                  : key === "all" ? "#666" : ts.idleColor,
                borderColor: active
                  ? key === "all" ? "#111" : ts.bg
                  : key === "all" ? "rgba(0,0,0,0.15)" : ts.border,
              }}
            >
              {lbl}
            </button>
          );
        })}
      </div>

      {/* Sort bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)",
      }}>
        <span style={{ fontSize: 12, color: "#999" }}>
          {filtered.length} monster{filtered.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => { setSortDir((d) => d === "desc" ? "asc" : "desc"); setPage(1); }}
          style={{
            display: "flex", alignItems: "center", gap: 4, background: "none",
            border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 20,
            padding: "4px 10px", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit", color: "#111",
          }}
        >
          {sortDir === "desc" ? "Newest first ↓" : "Oldest first ↑"}
        </button>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: selMode === "recall" ? "rgba(29,158,117,0.07)" : "rgba(83,74,183,0.07)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: selMode === "recall" ? "#0F6E56" : "#534AB7" }}>
            {selected.size} selected
          </span>
          <span
            onClick={() => { setSelected(new Set()); setExpandedId(null); }}
            style={{ fontSize: 12, color: "#999", cursor: "pointer", padding: "4px 8px" }}
          >
            Clear
          </span>
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: "12px 14px" }}>
        {paged.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "#aaa" }}>
            No monsters found
          </div>
        )}
        {Array.from({ length: Math.ceil(paged.length / 3) }).map((_, rowIdx) => {
          const row = paged.slice(rowIdx * 3, rowIdx * 3 + 3);
          const expanded = row.find((m) => m.id === expandedId);
          return (
            <div key={rowIdx} style={{ marginBottom: 8 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
              }}>
                {row.map((m) => (
                  <MonsterCard
                    key={m.id}
                    monster={m}
                    selected={selected.has(m.id)}
                    onToggleSelect={toggleSelect}
                    onToggleStar={toggleStar}
                  />
                ))}
              </div>
              {expanded && (
                <div style={{
                  marginTop: 8,
                  padding: "12px 14px",
                  background: "#f8f7f4",
                  borderRadius: 10,
                  border: "0.5px solid rgba(0,0,0,0.08)",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 8, marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>
                      {expanded.title ?? expanded.name}
                    </span>
                    {expanded.gem && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <StaticGem cat={expanded.cat} size={22} />
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: GEM_COLORS[expanded.cat]?.lo ?? "#111",
                        }}>
                          {expanded.gem}
                        </span>
                      </div>
                    )}
                  </div>

                  {(expanded.mood != null || expanded.emotions?.length) && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      flexWrap: "wrap", marginBottom: 8,
                    }}>
                      {expanded.mood != null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                          <span>Mood</span>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} style={{
                                width: 6, height: 6, borderRadius: 3,
                                background: n <= expanded.mood ? "#534AB7" : "rgba(0,0,0,0.15)",
                              }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {expanded.emotions?.map((em) => (
                        <span key={em} style={{
                          padding: "2px 8px", borderRadius: 20,
                          background: "rgba(83,74,183,0.08)",
                          color: "#534AB7",
                          fontSize: 10, fontWeight: 500,
                        }}>
                          {em}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, lineHeight: 1.6, color: "#444" }}>
                    {expanded.diary}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 14px", borderTop: "0.5px solid rgba(0,0,0,0.08)",
      }}>
        <span style={{ fontSize: 12, color: "#999" }}>p.{page}/{totalPages}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <PgBtn pg={page - 1} label="‹" disabled={page === 1} />
          {pgButtons}
          <PgBtn pg={page + 1} label="›" disabled={page === totalPages} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "absolute", bottom: 60, left: "50%",
          transform: "translateX(-50%)",
          background: toast.green ? "#0a2920" : "#2d1b6e",
          color: toast.green ? "#9FE1CB" : "#c8b4ff",
          borderRadius: 20, padding: "8px 18px",
          fontSize: 12, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 10,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
