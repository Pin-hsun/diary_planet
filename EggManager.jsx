import { useState } from "react";
import DIARIES from "./diaries.json";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLOR_NOT_SENT = { outer: "#D3D1C7", inner: "#F1EFE8", spot: "#D3D1C7" };
const COLOR_DRIFTING = { outer: "#B5D4F4", inner: "#E6F1FB", spot: "#B5D4F4" };

function fmtMonthDay(iso) {
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function truncate(s, n = 60) {
  return s.length > n ? s.slice(0, n).trimEnd() + "..." : s;
}

const eggs = DIARIES
  .filter((d) => d.status === "egg")
  .map((d) => {
    const status = d.drifted_at ? "drifting" : "not sent";
    return {
      id: d.id,
      date: fmtMonthDay(d.created_at),
      excerpt: truncate(d.content),
      status,
      color: status === "drifting" ? COLOR_DRIFTING : COLOR_NOT_SENT,
    };
  });

const methods = [
  {
    key: "drift",
    name: "Drift",
    badge: "free",
    desc: "Your egg will drift to a random reader. Someone will send a gem within 24 hours — or the AI will step in.",
  },
  {
    key: "gem",
    name: "Get a gem",
    badge: "1 diamond",
    desc: "Consume a diamond to get a gem from the AI system. Your diary stays private.",
  },
  {
    key: "reflect",
    name: "Deep reflection",
    badge: "+10% rare",
    desc: "Conversation with AI to hatch your egg. Increases chance of rare monsters.",
  },
];

const sentCopy = {
  drift: { title: "your egg is drifting", desc: "It's out there now. Someone will find it and send a gem to help it hatch." },
  gem: { title: "gem received", desc: "The AI has sent a gem. Your egg is ready to hatch." },
  reflect: { title: "reflection complete", desc: "Your egg absorbed the energy of your conversation and is hatching." },
};

function EggSVG({ color, size = 32 }) {
  const h = Math.round(size * 1.18);
  return (
    <svg width={size} height={h} viewBox="0 0 96 112" fill="none">
      <ellipse cx="48" cy="62" rx="36" ry="44" fill={color.outer} />
      <ellipse cx="48" cy="60" rx="34" ry="42" fill={color.inner} />
      <ellipse cx="36" cy="46" rx="7" ry="9" fill={color.spot} opacity="0.55" />
      <ellipse cx="48" cy="30" rx="12" ry="6" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

export default function EggManager({ onClose }) {
  const [selectedEggId, setSelectedEggId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("drift");
  const [sent, setSent] = useState(false);

  const selectedEgg = eggs.find((e) => e.id === selectedEggId);

  function handleConfirm() {
    setSent(true);
  }

  function handleDone() {
    setSelectedEggId(null);
    setSelectedMethod("drift");
    setSent(false);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>

        <div style={styles.header}>
          <span style={styles.headerTitle}>My eggs</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!sent ? (
          <>
            <div style={styles.eggList}>
              {eggs.map((egg) => {
                const isSelected = selectedEggId === egg.id;
                const isDrifting = egg.status === "drifting";
                return (
                  <button
                    key={egg.id}
                    style={isDrifting ? styles.eggRowDisabled : isSelected ? styles.eggRowSelected : styles.eggRow}
                    onClick={() => {
                      if (isDrifting) return;
                      setSelectedEggId((prev) => (prev === egg.id ? null : egg.id));
                    }}
                    disabled={isDrifting}
                  >
                    <div style={{ ...styles.radio, ...(isSelected ? styles.radioSelected : {}) }}>
                      {isSelected && <div style={styles.radioInner} />}
                    </div>
                    <EggSVG color={egg.color} size={32} />
                    <div style={styles.eggInfo}>
                      <div style={styles.eggRow1}>
                        <span style={{ ...styles.eggDate, ...(isSelected ? styles.eggDateSelected : {}) }}>
                          {egg.date}
                        </span>
                        <span style={{
                          ...styles.statusPill,
                          ...(egg.status === "drifting" ? styles.statusDrifting : {}),
                          ...(isSelected ? styles.statusSelected : {}),
                        }}>
                          {egg.status}
                        </span>
                      </div>
                      <div style={{ ...styles.excerpt, ...(isSelected ? styles.excerptSelected : {}) }}>
                        {egg.excerpt}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.divider} />

            <div style={styles.methodList}>
              {methods.map((m) => {
                const isSelected = selectedMethod === m.key;
                return (
                  <button
                    key={m.key}
                    style={isSelected ? styles.methodOptionSelected : styles.methodOption}
                    onClick={() => setSelectedMethod(m.key)}
                  >
                    <div style={styles.methodTop}>
                      <span style={{ ...styles.methodName, ...(isSelected ? styles.methodNameSelected : {}) }}>
                        {m.name}
                      </span>
                      <span style={{ ...styles.methodBadge, ...(isSelected ? styles.methodBadgeSelected : {}) }}>
                        {m.badge}
                      </span>
                    </div>
                    <div style={{ ...styles.methodDesc, ...(isSelected ? styles.methodDescSelected : {}) }}>
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.footer}>
              <span style={styles.footerLabel}>
                {selectedEgg ? selectedEgg.date : "no egg selected"}
              </span>
              <button
                style={styles.btnPrimary}
                onClick={handleConfirm}
                disabled={!selectedEgg}
              >
                confirm
              </button>
            </div>
          </>
        ) : (
          <div style={styles.sentState}>
            <div style={styles.sentIcon}>
              <EggSVG color={{ outer: "#B5D4F4", inner: "#E6F1FB", spot: "#B5D4F4" }} size={24} />
            </div>
            <h3 style={styles.sentTitle}>{sentCopy[selectedMethod].title}</h3>
            <p style={styles.sentDesc}>{sentCopy[selectedMethod].desc}</p>
            <button style={styles.btnGhost} onClick={handleDone}>done</button>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: 640,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 24,
    borderRadius: 12,
  },
  popup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "0.5px solid rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
  },
  header: {
    padding: "20px 20px 16px",
    borderBottom: "0.5px solid rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 16, fontWeight: 500 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.1)",
    background: "transparent", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, color: "#888",
  },
  eggList: { padding: 12, display: "flex", flexDirection: "column", gap: 6 },
  eggRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.1)",
    cursor: "pointer", background: "transparent",
    textAlign: "left", width: "100%",
  },
  eggRowSelected: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 8,
    border: "0.5px solid #AFA9EC",
    cursor: "pointer", background: "#EEEDFE",
    textAlign: "left", width: "100%",
  },
  eggRowDisabled: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.1)",
    cursor: "not-allowed", background: "#f5f5f5",
    textAlign: "left", width: "100%",
    opacity: 0.5,
  },
  radio: {
    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
    border: "0.5px solid rgba(0,0,0,0.2)",
    backgroundColor: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  radioSelected: { backgroundColor: "#534AB7", borderColor: "#534AB7" },
  radioInner: { width: 8, height: 8, borderRadius: "50%", backgroundColor: "white" },
  eggInfo: { flex: 1, minWidth: 0 },
  eggRow1: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  eggDate: { fontSize: 13, fontWeight: 500, color: "#111" },
  eggDateSelected: { color: "#3C3489" },
  excerpt: { fontSize: 12, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.4 },
  excerptSelected: { color: "#534AB7" },
  statusPill: {
    fontSize: 11, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
    backgroundColor: "#f5f5f5", border: "0.5px solid rgba(0,0,0,0.1)", color: "#999",
  },
  statusDrifting: { backgroundColor: "#E6F1FB", borderColor: "#85B7EB", color: "#0C447C" },
  statusSelected: { backgroundColor: "#AFA9EC", borderColor: "transparent", color: "#26215C" },
  divider: { height: "0.5px", backgroundColor: "rgba(0,0,0,0.1)", margin: "0 12px" },
  methodList: { padding: 12, display: "flex", flexDirection: "column", gap: 6 },
  methodOption: {
    border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 8,
    padding: "11px 14px", cursor: "pointer",
    background: "#ffffff", textAlign: "left", width: "100%",
  },
  methodOptionSelected: {
    border: "0.5px solid #AFA9EC", borderRadius: 8,
    padding: "11px 14px", cursor: "pointer",
    background: "#EEEDFE", textAlign: "left", width: "100%",
  },
  methodTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  methodName: { fontSize: 13, fontWeight: 500, color: "#111" },
  methodNameSelected: { color: "#3C3489" },
  methodBadge: {
    fontSize: 11, padding: "2px 8px", borderRadius: 99,
    backgroundColor: "transparent", border: "0.5px solid rgba(175,169,236,0.4)", color: "#534AB7",
  },
  methodBadgeSelected: { backgroundColor: "#AFA9EC", borderColor: "transparent", color: "#26215C" },
  methodDesc: { fontSize: 12, color: "#888", lineHeight: 1.5 },
  methodDescSelected: { color: "#534AB7" },
  footer: {
    padding: "12px 16px 16px",
    borderTop: "0.5px solid rgba(0,0,0,0.1)",
    display: "flex", alignItems: "center", gap: 8,
  },
  footerLabel: { fontSize: 12, color: "#aaa", flex: 1 },
  btnPrimary: {
    padding: "9px 20px", borderRadius: 8,
    border: "none", backgroundColor: "#534AB7",
    fontSize: 13, fontWeight: 500, color: "white", cursor: "pointer",
  },
  sentState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12,
    padding: "32px 20px", textAlign: "center",
  },
  sentIcon: {
    width: 48, height: 48, borderRadius: "50%",
    backgroundColor: "#EEEDFE",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  sentTitle: { fontSize: 15, fontWeight: 500, color: "#111" },
  sentDesc: { fontSize: 13, color: "#888", lineHeight: 1.6 },
  btnGhost: {
    width: "100%", padding: 10, borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.2)",
    background: "transparent", fontSize: 14,
    color: "#888", cursor: "pointer", marginTop: 4,
  },
};
