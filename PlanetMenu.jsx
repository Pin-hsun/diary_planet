import { useState, useEffect, useRef } from "react";

// ── Menu items ────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  {
    key: "monsters",
    label: "Monsters",
    iconColor: "#9f95f0",
    iconBg: "rgba(127,119,221,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#9f95f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M8.5 5.5 Q7 3 9 2" /><path d="M15.5 5.5 Q17 3 15 2" />
      </svg>
    ),
  },
  {
    key: "eggs",
    label: "Eggs",
    iconColor: "#e08aaa",
    iconBg: "rgba(212,83,126,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#e08aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="13.5" rx="7" ry="8.5" />
        <path d="M9.5 9 Q8.5 6 10 4" /><path d="M14.5 9 Q15.5 6 14 4" />
      </svg>
    ),
  },
  {
    key: "planet",
    label: "Planet",
    iconColor: "#5dcaa5",
    iconBg: "rgba(29,158,117,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#5dcaa5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <ellipse cx="12" cy="12" rx="8" ry="3.5" transform="rotate(-25 12 12)" />
      </svg>
    ),
  },
  {
    key: "pokedex",
    label: "Pokédex",
    iconColor: "#f0b060",
    iconBg: "rgba(186,117,23,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#f0b060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="12" y2="16" />
        <circle cx="17" cy="16" r="1.8" fill="#f0b060" stroke="none" />
      </svg>
    ),
  },
  {
    key: "items",
    label: "Items",
    iconColor: "#85b7eb",
    iconBg: "rgba(55,138,221,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#85b7eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="18" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1.5" fill="#85b7eb" stroke="none" />
      </svg>
    ),
  },
  {
    key: "shop",
    label: "Shop",
    iconColor: "#f0997b",
    iconBg: "rgba(216,90,48,0.18)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#f0997b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 L3 6v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V6L18 2z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V10" />
      </svg>
    ),
  },
];

// ── Hamburger icon ────────────────────────────────────────────────────────────

function HamburgerIcon({ open }) {
  const base = {
    display: "block", height: 1.5, borderRadius: 2,
    background: "rgba(200,180,255,0.85)",
    transition: "all 0.2s",
    width: 14,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 14 }}>
      <span style={{
        ...base,
        transform: open ? "rotate(45deg) translate(3px,3px)" : "none",
      }} />
      <span style={{ ...base, opacity: open ? 0 : 1 }} />
      <span style={{
        ...base,
        transform: open ? "rotate(-45deg) translate(3px,-3px)" : "none",
      }} />
    </div>
  );
}

// ── PlanetMenu ────────────────────────────────────────────────────────────────

/**
 * PlanetMenu
 *
 * Props:
 *   activeKey         – string | null   currently active menu key
 *   onSelect          – (key: string) => void
 *   defaultLabel      – string          label shown when nothing is selected (default: "My Planet")
 *   style             – CSSProperties   extra styles for the wrapper (position it however you like)
 */
export default function PlanetMenu({
  activeKey,
  onSelect,
  defaultLabel = "My Planet",
  style,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentItem = MENU_ITEMS.find((m) => m.key === activeKey);
  const buttonLabel = currentItem?.label ?? defaultLabel;

  const handleSelect = (key) => {
    onSelect?.(key);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 20, ...style }}>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 12px",
          background: "rgba(20,10,50,0.75)",
          border: "0.5px solid rgba(150,120,255,0.35)",
          borderRadius: 12, cursor: "pointer",
          transition: "background 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(40,20,80,0.85)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(20,10,50,0.75)"}
      >
        <HamburgerIcon open={open} />
        <span style={{
          fontSize: 13, fontWeight: 500,
          color: "rgba(210,190,255,0.9)",
          fontFamily: "inherit",
          userSelect: "none",
        }}>
          {buttonLabel}
        </span>
      </button>

      {/* Dropdown */}
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: 0,
        width: 180,
        background: "rgba(12,6,32,0.93)",
        border: "0.5px solid rgba(140,100,255,0.28)",
        borderRadius: 14,
        overflow: "hidden",
        padding: "6px 0",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-6px)",
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.18s, transform 0.18s",
        backdropFilter: "blur(8px)",
      }}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 14px",
                background: isActive ? "rgba(120,80,220,0.22)" : "transparent",
                border: "none", cursor: "pointer",
                textAlign: "left", position: "relative",
                transition: "background 0.12s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(120,80,220,0.18)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: 7, bottom: 7,
                  width: 2.5, borderRadius: "0 2px 2px 0",
                  background: "#9f95f0",
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: item.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.icon}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: "rgba(220,210,255,0.92)",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
