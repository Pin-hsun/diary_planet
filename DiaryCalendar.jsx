import { useState } from "react";
import { StaticCreature, EggIcon } from "./Monsters";
import { getAttrStyle, attrToCat, StaticGem } from "./gem";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["S","M","T","W","T","F","S"];
const MONTHS_FULL = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"];

// mood 1–5
const MOOD_DOTS  = ["","#F7C1C1","#CECBF6","#B5D4F4","#9FE1CB","#FAC775"];
const MOOD_LABELS = ["","Tough","Uneasy","Neutral","Good","Great"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDateKey(dateStr) {
  const [mon, dayRaw, yearRaw] = dateStr.split(/[\s,]+/);
  return { y: parseInt(yearRaw), m: MONTHS_SHORT.indexOf(mon), d: parseInt(dayRaw) };
}

function toKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

// ── Monster face ──────────────────────────────────────────────────────────────

function MonsterFace({ color, torsoColor, size = 36 }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r} fill={torsoColor} />
      <ellipse cx={r * 0.72} cy={r * 0.85} rx={r * 0.38} ry={r * 0.3} fill={color} />
      <ellipse cx={r * 1.28} cy={r * 0.85} rx={r * 0.38} ry={r * 0.3} fill={color} />
      <ellipse cx={r} cy={r * 0.78} rx={r * 0.52} ry={r * 0.42} fill={color} />
      <circle cx={r * 0.82} cy={r * 0.72} r={r * 0.14} fill="#fff" />
      <circle cx={r * 1.18} cy={r * 0.72} r={r * 0.14} fill="#fff" />
      <circle cx={r * 0.84} cy={r * 0.73} r={r * 0.07} fill="#111" />
      <circle cx={r * 1.2}  cy={r * 0.73} r={r * 0.07} fill="#111" />
      <path d={`M${r*0.82} ${r*0.94} Q${r} ${r*1.05} ${r*1.18} ${r*0.94}`}
        fill="none" stroke="#111" strokeWidth={r * 0.06} strokeLinecap="round" />
    </svg>
  );
}

// ── Bottom sheet ──────────────────────────────────────────────────────────────

function DiarySheet({ entry, onClose }) {
  const moodDot   = MOOD_DOTS[entry.mood]   ?? "#B5D4F4";
  const moodLabel = MOOD_LABELS[entry.mood] ?? "";
  const attrStyle = getAttrStyle(entry.attr);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: "rgba(0,0,0,0.55)", borderRadius: 40,
      }} />

      {/* Sheet */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "#0e0726",
        borderRadius: "22px 22px 0 0",
        border: "0.5px solid rgba(140,100,255,0.22)", borderBottom: "none",
        paddingBottom: 36,
        animation: "slideUp 0.22s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.14)", margin:"12px auto 16px" }} />

        {/* Header row */}
        <div style={{
          padding: "0 20px 14px",
          borderBottom: "0.5px solid rgba(140,100,255,0.12)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(255,255,255,0.04)",
          }}>
            {entry.status === "egg"
              ? <EggIcon size={32} />
              : <StaticCreature color={entry.color} torsoColor={entry.torsoColor} size={32} />}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:500, color:"rgba(225,215,255,0.95)", marginBottom:4 }}>
              {entry.name}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, color:"rgba(160,145,200,0.5)" }}>{entry.date}</span>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:moodDot }} />
                <span style={{ fontSize:11, color:"rgba(160,145,200,0.5)" }}>{moodLabel}</span>
              </div>
            </div>
          </div>

          <div style={{
            display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0,
          }}>
            {entry.gem && (
              <span style={{
                fontSize:11, padding:"3px 10px 3px 6px", borderRadius:20,
                background:"rgba(255,255,255,0.06)",
                border:"0.5px solid rgba(255,255,255,0.12)",
                color:"rgba(220,210,255,0.85)",
                display:"flex", alignItems:"center", gap:4,
              }}>
                <StaticGem cat={attrToCat(entry.attr)} size={16} />
                {entry.gem}
              </span>
            )}
            <span style={{
              fontSize:10, padding:"2px 8px", borderRadius:20,
              background: attrStyle.bg, color: attrStyle.color,
              border:`0.5px solid ${attrStyle.color}44`,
            }}>
              {entry.attr}
            </span>
          </div>

          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:8, flexShrink:0,
            border:"0.5px solid rgba(255,255,255,0.1)",
            background:"rgba(255,255,255,0.05)",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:"rgba(200,185,255,0.55)",
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/>
            </svg>
          </button>
        </div>

        {/* Emotions */}
        <div style={{ display:"flex", gap:6, padding:"12px 20px 0", flexWrap:"wrap" }}>
          {entry.emotions?.map(e => (
            <span key={e} style={{
              fontSize:12, padding:"3px 10px", borderRadius:20,
              background:"rgba(159,149,240,0.1)",
              border:"0.5px solid rgba(159,149,240,0.22)",
              color:"rgba(200,185,255,0.7)",
              textTransform:"capitalize",
            }}>
              {e}
            </span>
          ))}
        </div>

        {/* Diary text */}
        <div style={{
          padding:"14px 20px 0",
          fontSize:14, lineHeight:1.78,
          color:"rgba(210,200,255,0.8)",
          fontFamily:"inherit",
        }}>
          {entry.diary}
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

/**
 * DiaryCalendar
 *
 * Props:
 *   diaries  – diary array (see SAMPLE_DIARIES for shape)
 *   style    – CSSProperties
 */
export default function DiaryCalendar({ diaries = SAMPLE_DIARIES, style }) {
  const t = new Date();
  const [viewY, setViewY] = useState(t.getFullYear());
  const [viewM, setViewM] = useState(t.getMonth());
  const [selected, setSelected] = useState(null); // diary id

  // date → [diary]
  const dateMap = {};
  diaries.forEach(d => {
    const { y, m, d: day } = parseDateKey(d.date);
    const key = toKey(y, m, day);
    (dateMap[key] ??= []).push(d);
  });

  const prevMonth = () => {
    setSelected(null);
    viewM === 0 ? (setViewY(y => y - 1), setViewM(11)) : setViewM(m => m - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    viewM === 11 ? (setViewY(y => y + 1), setViewM(0)) : setViewM(m => m + 1);
  };

  const numDays  = daysInMonth(viewY, viewM);
  const startDay = firstDayOfMonth(viewY, viewM);
  const cells    = [...Array(startDay).fill(null), ...Array.from({length:numDays}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toKey(t.getFullYear(), t.getMonth(), t.getDate());

  const monthDiaries = diaries.filter(d => {
    const { y, m } = parseDateKey(d.date);
    return y === viewY && m === viewM;
  });

  const selectedEntry = diaries.find(d => d.id === selected) ?? null;

  return (
    <div style={{
      width:"100%", minHeight:"100%", position:"relative",
      background:"#07031a",
      fontFamily:"'DM Sans', system-ui, sans-serif",
      ...style,
    }}>

      {/* Stars */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {Array.from({length:36}).map((_,i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${(i*73+11)%100}%`, top:`${(i*47+7)%56}%`,
            width:i%5===0?2:1, height:i%5===0?2:1,
            borderRadius:"50%", background:`rgba(255,255,255,${0.15+(i%5)*0.07})`,
          }} />
        ))}
      </div>

      <div style={{ padding:"16px 22px 28px", position:"relative" }}>

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <button onClick={prevMonth} style={NAV_BTN}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="10,3 5,8 10,13"/>
            </svg>
          </button>
          <span style={{ fontSize:16, fontWeight:500, color:"rgba(225,215,255,0.92)" }}>
            {MONTHS_FULL[viewM]} {viewY}
          </span>
          <button onClick={nextMonth} style={NAV_BTN}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
          {DAYS_SHORT.map((d,i) => (
            <div key={i} style={{
              textAlign:"center", fontSize:11, fontWeight:500,
              color:"rgba(160,145,200,0.4)", letterSpacing:"0.04em", paddingBottom:8,
            }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px 0" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} style={{ aspectRatio:"1" }} />;
            const key = toKey(viewY, viewM, day);
            const dayEntries = dateMap[key] ?? [];
            const hasEntry   = dayEntries.length > 0;
            const isToday    = key === todayKey;
            const isSel      = dayEntries.some(d => d.id === selected);

            return (
              <button
                key={key}
                onClick={() => hasEntry && setSelected(isSel ? null : dayEntries[0].id)}
                style={{
                  aspectRatio:"1",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  borderRadius:10,
                  background: isSel ? "rgba(159,149,240,0.2)" : isToday ? "rgba(159,149,240,0.08)" : "transparent",
                  border: isSel
                    ? "1px solid rgba(159,149,240,0.5)"
                    : isToday ? "1px solid rgba(159,149,240,0.22)" : "1px solid transparent",
                  cursor: hasEntry ? "pointer" : "default",
                  transition:"background 0.12s, border 0.12s",
                  fontFamily:"inherit", padding:0,
                }}
              >
                <span style={{
                  fontSize:13, fontWeight: isToday ? 500 : 400,
                  color: isSel ? "#c8b4ff" : isToday ? "#a090e0"
                    : hasEntry ? "rgba(225,215,255,0.88)" : "rgba(180,165,220,0.28)",
                }}>
                  {day}
                </span>
                {hasEntry && (
                  <div style={{ display:"flex", gap:2, marginTop:2 }}>
                    {dayEntries.slice(0,3).map(e => (
                      <div key={e.id} style={{
                        width:14, height:14, display:"flex",
                        alignItems:"center", justifyContent:"center",
                      }}>
                        {e.status === "egg"
                          ? <EggIcon size={12} />
                          : <StaticCreature color={e.color} torsoColor={e.torsoColor} size={12} />}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Entry list */}
        {monthDiaries.length > 0 && (
          <div style={{ marginTop:22 }}>
            <div style={{
              fontSize:11, fontWeight:500, letterSpacing:"0.06em",
              color:"rgba(160,145,200,0.35)", marginBottom:10,
              textTransform:"uppercase",
            }}>
              {monthDiaries.length} {monthDiaries.length === 1 ? "entry" : "entries"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {monthDiaries.map(entry => {
                const isActive = selected === entry.id;
                const moodDot  = MOOD_DOTS[entry.mood] ?? "#B5D4F4";
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(isActive ? null : entry.id)}
                    style={{
                      display:"flex", alignItems:"center", gap:11,
                      padding:"10px 12px",
                      background: isActive ? "rgba(159,149,240,0.1)" : "rgba(255,255,255,0.03)",
                      border:`0.5px solid ${isActive ? "rgba(159,149,240,0.3)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius:12, cursor:"pointer",
                      textAlign:"left", fontFamily:"inherit",
                      transition:"all 0.12s",
                    }}
                  >
                    <div style={{
                      width:36, height:36, borderRadius:10, flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      background:"rgba(255,255,255,0.04)",
                    }}>
                      {entry.status === "egg"
                        ? <EggIcon size={26} />
                        : <StaticCreature color={entry.color} torsoColor={entry.torsoColor} size={26} />}
                    </div>

                    {(() => {
                      const aStyle = getAttrStyle(entry.attr);
                      return (
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:500, color:"rgba(225,215,255,0.9)" }}>
                          {entry.name}
                        </span>
                        <span style={{
                          fontSize:10, padding:"2px 7px", borderRadius:20,
                          background:aStyle.bg, color:aStyle.color,
                        }}>
                          {entry.attr}
                        </span>
                        {entry.gem && (
                          <span style={{
                            fontSize:10, padding:"2px 7px 2px 4px", borderRadius:20,
                            background:"rgba(255,255,255,0.05)",
                            color:"rgba(200,185,255,0.7)",
                            display:"flex", alignItems:"center", gap:3,
                          }}>
                            <StaticGem cat={attrToCat(entry.attr)} size={14} />
                            {entry.gem}
                          </span>
                        )}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:11, color:"rgba(160,145,200,0.45)" }}>{entry.date}</span>
                        <div style={{ display:"flex", gap:3 }}>
                          {entry.emotions?.slice(0,2).map(e => (
                            <span key={e} style={{
                              fontSize:10, color:"rgba(160,145,200,0.5)",
                              background:"rgba(255,255,255,0.05)",
                              padding:"1px 6px", borderRadius:20,
                              textTransform:"capitalize",
                            }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                      );
                    })()}

                    <div style={{ width:8, height:8, borderRadius:"50%", background:moodDot, flexShrink:0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      {selectedEntry && (
        <DiarySheet entry={selectedEntry} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

const NAV_BTN = {
  width:32, height:32, borderRadius:9,
  background:"rgba(255,255,255,0.05)",
  border:"0.5px solid rgba(255,255,255,0.1)",
  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  color:"rgba(200,185,255,0.6)", flexShrink:0,
};
