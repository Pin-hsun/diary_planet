import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react";
import * as api from "./api";

// ─── Theme ───
const COLORS = {
  primary: '#00e5ff',
  ink: '#F5F2EC',
  inkDim: '#9A958B',
  bg: '#0E0D14',
  surface: 'rgba(30, 28, 40, 0.55)',
  surfaceSolid: '#1C1A26',
  line: 'rgba(255, 255, 255, 0.08)',
  lineStrong: 'rgba(255, 255, 255, 0.14)',
  aiBubble: 'rgba(40, 38, 54, 0.7)',
};
const SERIF = `"Noto Serif TC", "Source Han Serif TC", serif`;
const SANS = `"Inter", "Noto Sans TC", -apple-system, sans-serif`;

// ─── Monster (procedural blob creature) ───
const MONSTER_PALETTES = {
  joy: ['#D4F24A','#A3C739'], ok: ['#7BD9C4','#2D8A73'], calm: ['#6BA8E8','#2E5B94'],
  warm: ['#F2B06B','#A8632D'], mid: ['#C9B89A','#6E5F47'], lilac: ['#B49AE8','#6E4CB3'],
};
function pickPalette(mood) {
  if (typeof mood === 'number') {
    if (mood >= 7.5) return MONSTER_PALETTES.joy;
    if (mood >= 6.5) return MONSTER_PALETTES.ok;
    if (mood >= 5) return MONSTER_PALETTES.calm;
    if (mood >= 3.5) return MONSTER_PALETTES.warm;
    return MONSTER_PALETTES.lilac;
  }
  return MONSTER_PALETTES[mood] || MONSTER_PALETTES.lilac;
}
function seeded(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function blobPath(rng, cx, cy, rBase, bumps = 8, jitter = 0.25) {
  const pts = [];
  for (let i = 0; i < bumps; i++) { const a = (i / bumps) * Math.PI * 2; const r = rBase * (1 - jitter / 2 + rng() * jitter); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) { const p1 = pts[i]; const p2 = pts[(i + 1) % pts.length]; d += ` Q ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${((p1[0]+p2[0])/2).toFixed(1)} ${((p1[1]+p2[1])/2).toFixed(1)}`; }
  return d + ' Z';
}
function Monster({ seed = 'x', size = 64, palette, mood, active = false, glow = true }) {
  const id = useMemo(() => 'm' + Math.random().toString(36).slice(2, 8), []);
  const traits = useMemo(() => {
    const rng = seeded(seed);
    const bumps = 6 + Math.floor(rng() * 6); const jitter = 0.15 + rng() * 0.35; const stretchY = 0.8 + rng() * 0.35;
    const eyeCount = rng() < 0.15 ? 1 : (rng() < 0.18 ? 3 : 2); const eyeSize = 0.13 + rng() * 0.08; const eyeSpread = 0.12 + rng() * 0.1; const eyeY = 0.32 + rng() * 0.12;
    const mouthType = ['smile','o','line','tooth','frown','wobble'][Math.floor(rng() * 6)];
    const armCount = Math.floor(rng() * 4); const arms = Array.from({ length: armCount }).map(() => ({ angle: rng() * Math.PI * 2, len: 0.2 + rng() * 0.25, wobble: rng() }));
    const spikes = rng() < 0.35; const hasAntenna = rng() < 0.3; const cheek = rng() < 0.4;
    const floatDur = (2.8 + rng() * 1.8).toFixed(2); const floatDelay = (rng() * -3).toFixed(2);
    const blinkDur = (4 + rng() * 3).toFixed(2); const blinkDelay = (rng() * -4).toFixed(2);
    const wobbleDur = (5 + rng() * 3).toFixed(2); const armDur = (2.2 + rng() * 1.4).toFixed(2);
    return { bumps, jitter, stretchY, eyeCount, eyeSize, eyeSpread, eyeY, mouthType, arms, spikes, hasAntenna, cheek, floatDur, floatDelay, blinkDur, blinkDelay, wobbleDur, armDur };
  }, [seed]);
  const pal = palette || pickPalette(mood); const [c1, c2] = pal;
  const V = 200, cx = 100, cy = 110, rBase = 60;
  const bodyPath2 = useMemo(() => blobPath(seeded(seed + '_body'), cx, cy, rBase * 0.95, traits.bumps, traits.jitter), [seed, traits]);
  const eyes = []; const eyeYPos = cy - rBase * 0.35 + rBase * traits.eyeY * 0.3;
  if (traits.eyeCount === 1) eyes.push({ x: cx, y: eyeYPos, r: rBase * traits.eyeSize * 1.3 });
  else if (traits.eyeCount === 2) { const sp = rBase * traits.eyeSpread * 1.5; eyes.push({ x: cx - sp, y: eyeYPos, r: rBase * traits.eyeSize }, { x: cx + sp, y: eyeYPos, r: rBase * traits.eyeSize }); }
  else { const sp = rBase * traits.eyeSpread * 1.3; eyes.push({ x: cx - sp, y: eyeYPos, r: rBase * traits.eyeSize * 0.85 }, { x: cx, y: eyeYPos - 4, r: rBase * traits.eyeSize * 0.85 }, { x: cx + sp, y: eyeYPos, r: rBase * traits.eyeSize * 0.85 }); }
  const armShapes = traits.arms.map((a) => { const ox = cx + Math.cos(a.angle) * rBase * 0.8; const oy = cy + Math.sin(a.angle) * rBase * 0.6; const ex = ox + Math.cos(a.angle) * rBase * a.len * 1.5; const ey = oy + Math.sin(a.angle) * rBase * a.len * 1.5; const cx1 = ox + Math.cos(a.angle + 0.7) * rBase * 0.4; const cy1 = oy + Math.sin(a.angle + 0.7) * rBase * 0.4; return `M ${ox} ${oy} Q ${cx1} ${cy1} ${ex} ${ey}`; });
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0, transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)', transform: active ? 'scale(1.12)' : 'scale(1)', filter: glow && active ? `drop-shadow(0 0 12px ${c1}aa)` : `drop-shadow(0 3px 6px rgba(0,0,0,0.4))`, animation: `monsterFloat ${traits.floatDur}s ${traits.floatDelay}s ease-in-out infinite` }}>
      <style>{`
@keyframes monsterFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
@keyframes monsterBlink-${id} { 0%, 92%, 100% { transform: scaleY(1); } 95%, 98% { transform: scaleY(0.08); } }
@keyframes monsterWobble-${id} { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-1.8deg); } 75% { transform: rotate(1.8deg); } }
@keyframes monsterArm-${id} { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(6deg); } }
@keyframes monsterAntenna-${id} { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(6deg); } }
.m-eye-${id} { animation: monsterBlink-${id} ${traits.blinkDur}s ${traits.blinkDelay}s ease-in-out infinite; }
.m-body-${id} { transform-origin: ${cx}px ${cy + 20}px; transform-box: view-box; animation: monsterWobble-${id} ${traits.wobbleDur}s ease-in-out infinite; }
.m-arm-${id} { transform-origin: ${cx}px ${cy}px; transform-box: view-box; animation: monsterArm-${id} ${traits.armDur}s ease-in-out infinite; }
.m-antenna-${id} { transform-origin: ${cx}px ${cy - rBase * 0.9}px; transform-box: view-box; animation: monsterAntenna-${id} ${(parseFloat(traits.floatDur) * 1.5).toFixed(2)}s ease-in-out infinite; }
      `}</style>
      <svg viewBox={`0 0 ${V} ${V}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`grad-${id}`} cx="38%" cy="30%" r="75%"><stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/></radialGradient>
          <radialGradient id={`hi-${id}`} cx="35%" cy="25%" r="30%"><stop offset="0%" stopColor="#fff" stopOpacity="0.35"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
        </defs>
        {armShapes.map((d, i) => <path key={i} d={d} stroke={c2} strokeWidth={12} strokeLinecap="round" fill="none" className={`m-arm-${id}`} style={{ animationDelay: `${i * 0.3}s` }}/>)}
        {traits.hasAntenna && <g className={`m-antenna-${id}`}><line x1={cx} y1={cy - rBase * 0.9} x2={cx + 4} y2={cy - rBase * 1.25} stroke={c2} strokeWidth="3" strokeLinecap="round"/><circle cx={cx + 4} cy={cy - rBase * 1.3} r="5" fill={c1}/></g>}
        <g className={`m-body-${id}`} style={{ transform: `translate(0px, ${(cy * (1 - traits.stretchY)).toFixed(1)}px) scale(1, ${traits.stretchY.toFixed(2)})`, transformOrigin: `${cx}px ${cy}px` }}>
          <path d={bodyPath2} fill={`url(#grad-${id})`} stroke={c2} strokeWidth="1.2" strokeOpacity="0.4"/><path d={bodyPath2} fill={`url(#hi-${id})`}/>
        </g>
        {traits.cheek && eyes.length >= 2 && <><ellipse cx={eyes[0].x - 3} cy={eyes[0].y + eyes[0].r * 1.3} rx="5" ry="3" fill="#FF7BA3" opacity="0.5"/><ellipse cx={eyes[eyes.length - 1].x + 3} cy={eyes[eyes.length - 1].y + eyes[0].r * 1.3} rx="5" ry="3" fill="#FF7BA3" opacity="0.5"/></>}
        {eyes.map((e, i) => <g key={i} className={`m-eye-${id}`} style={{ transformOrigin: `${e.x}px ${e.y}px`, transformBox: 'view-box', animationDelay: `${i * 0.08}s` }}><circle cx={e.x} cy={e.y} r={e.r} fill="#F8F1DD"/><circle cx={e.x + e.r * 0.15} cy={e.y + e.r * 0.1} r={e.r * 0.55} fill="#161514"/><circle cx={e.x + e.r * 0.35} cy={e.y - e.r * 0.15} r={e.r * 0.22} fill="#fff"/></g>)}
        {(() => { const my = cy + rBase * 0.22;
          if (traits.mouthType === 'o') return <ellipse cx={cx} cy={my} rx="5" ry="6" fill="#3B1E1E"/>;
          if (traits.mouthType === 'line') return <line x1={cx - 8} y1={my} x2={cx + 8} y2={my} stroke="#3B1E1E" strokeWidth="2" strokeLinecap="round"/>;
          if (traits.mouthType === 'smile') return <path d={`M ${cx-9} ${my-2} Q ${cx} ${my+6} ${cx+9} ${my-2}`} stroke="#3B1E1E" strokeWidth="2" strokeLinecap="round" fill="none"/>;
          if (traits.mouthType === 'frown') return <path d={`M ${cx-8} ${my+3} Q ${cx} ${my-4} ${cx+8} ${my+3}`} stroke="#3B1E1E" strokeWidth="2" strokeLinecap="round" fill="none"/>;
          if (traits.mouthType === 'tooth') return <g><path d={`M ${cx-10} ${my-2} Q ${cx} ${my+7} ${cx+10} ${my-2}`} stroke="#3B1E1E" strokeWidth="2" fill="#3B1E1E"/><rect x={cx-2} y={my-1} width="4" height="5" fill="#F8F1DD"/></g>;
          return <path d={`M ${cx-10} ${my} Q ${cx-5} ${my-3} ${cx} ${my} T ${cx+10} ${my}`} stroke="#3B1E1E" strokeWidth="2" fill="none" strokeLinecap="round"/>;
        })()}
      </svg>
    </div>
  );
}

// ─── Icons ───
function MicIcon({ size = 22, color = COLORS.primary }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" fill={color}/><path d="M5 11 V 12 A 7 7 0 0 0 19 12 V 11" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/><line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>;
}

// ─── StarfieldBg ───
function StarfieldBg({ density = 60 }) {
  const stars = useMemo(() => Array.from({ length: density }).map(() => ({ left: Math.random() * 100, top: Math.random() * 100, size: Math.random() * 1.4 + 0.4, opacity: Math.random() * 0.7 + 0.15, twinkle: Math.random() * 4 + 2 })), [density]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map((s, i) => <div key={i} style={{ position: 'absolute', left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#fff', opacity: s.opacity, animation: `wd2twinkle ${s.twinkle}s ease-in-out ${i * 0.1}s infinite alternate` }}/>)}
      <style>{`@keyframes wd2twinkle { 0% { opacity: 0.1 } 100% { opacity: 0.9 } }`}</style>
    </div>
  );
}

// ─── MoodCreature ───
function MoodCreature({ mood, active, onClick }) {
  const seeds = { 'Terrible': 'terrible-01', 'Bad': 'bad-02', 'Okay': 'okay-03', 'Good': 'good-04', 'Great': 'great-05' };
  const moodKey = { 'Terrible': 'lilac', 'Bad': 'calm', 'Okay': 'mid', 'Good': 'warm', 'Great': 'joy' };
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: SANS, transition: 'opacity 180ms ease' }}>
      <Monster seed={seeds[mood]} mood={moodKey[mood]} size={40} active={active}/>
      <span style={{ fontSize: 12, color: COLORS.ink, fontFamily: SERIF }}>{mood}</span>
    </button>
  );
}

function Mascot({ size = 110 }) { return <Monster seed="hero-mascot-42" mood="lilac" size={size} active glow/>; }

// ─── InputBar ───
function InputBar({ value, onChange, onSend, placeholder, stoppable, onStop, disabled }) {
  return (
    <div style={{ flex: '0 0 auto', padding: '8px 16px 10px', display: 'flex', gap: 10, alignItems: 'center', position: 'relative', zIndex: 5 }}>
      <div style={{ flex: 1, height: 40, borderRadius: 100, background: 'rgba(30,28,42,0.7)', backdropFilter: 'blur(14px)', border: `1px solid ${COLORS.line}`, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1 }}>
        <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && value.trim() && !disabled) onSend(); }} placeholder={placeholder || 'What happened today?'} disabled={disabled} style={{ flex: 1, border: 0, outline: 'none', fontFamily: SANS, fontSize: 15, color: COLORS.ink, background: 'transparent' }}/>
        <MicIcon/>
      </div>
      <button onClick={stoppable ? onStop : onSend} disabled={disabled && !stoppable} style={{ width: 40, height: 40, borderRadius: '50%', border: 0, cursor: 'pointer', background: COLORS.primary, color: '#0E0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(212,242,74,0.4)', flexShrink: 0, opacity: disabled && !stoppable ? 0.4 : 1 }}>
        {stoppable ? <div style={{ width: 14, height: 14, background: '#0E0D14', borderRadius: 2 }}/> : <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M11 19 V 3 M 4 10 L 11 3 L 18 10" stroke="#0E0D14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
    </div>
  );
}

// ─── Chat Components ───
function WelcomeBubble({ onPickMood, selected }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 320, padding: '14px 14px 16px', borderRadius: 18, background: 'rgba(30,28,42,0.6)', border: `1px solid ${COLORS.line}`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: COLORS.ink, fontSize: 13, fontFamily: SANS, letterSpacing: 1.5 }}><span style={{ textTransform: 'uppercase' }}>TODAY'S MOOD</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          {['Terrible','Bad','Okay','Good','Great'].map(m => <MoodCreature key={m} mood={m} active={selected === m} onClick={() => onPickMood(m)}/>)}
        </div>
      </div>
    </div>
  );
}
function AIBubble({ text, maxWidth = 260 }) {
  return <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><div style={{ maxWidth, padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: COLORS.aiBubble, border: `1px solid ${COLORS.line}`, fontFamily: SERIF, fontSize: 15, lineHeight: '22px', color: COLORS.ink }}>{text}</div></div>;
}
function UserBubble({ text }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ maxWidth: 280, padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: COLORS.primary, color: '#0E0D14', fontFamily: SERIF, fontSize: 15, lineHeight: '22px', boxShadow: '0 6px 18px rgba(212,242,74,0.3)' }}>{text}</div></div>;
}
function UserChip({ text }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ padding: '7px 16px', borderRadius: 999, background: COLORS.primary, color: '#0E0D14', fontFamily: SERIF, fontSize: 14, fontWeight: 500 }}>{text}</div></div>;
}
function OfferChips({ options, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 6 }}>
      {options.map(o => <button key={o} onClick={() => onPick(o)} style={{ padding: '7px 16px', borderRadius: 999, background: 'rgba(212,242,74,0.08)', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, fontFamily: SERIF, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{o}</button>)}
    </div>
  );
}
function PathwayChips({ options, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 6 }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M5 13 L 13 5 M 7 5 H 13 V 11" stroke={COLORS.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(o => <button key={o} onClick={() => onPick(o)} style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(212,242,74,0.08)', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{o}</button>)}
      </div>
    </div>
  );
}
function ReshapeDiaryCard({ title, tags, body, onSave, onEdit }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, padding: 16, borderRadius: 18, background: 'rgba(30,28,42,0.7)', border: `1px solid ${COLORS.line}`, fontFamily: SERIF, color: COLORS.ink, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #F2B06B 0%, #A8632D 60%, #3a1d08 100%)', opacity: 0.6, filter: 'blur(4px)' }}/>
        <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: COLORS.primary, color: '#0E0D14', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: SANS, marginBottom: 12, textTransform: 'uppercase' }}>Reshape Diary</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 10, lineHeight: '26px' }}>{title}</div>
        <div style={{ height: 1, background: COLORS.line, marginBottom: 12 }}/>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 10, fontFamily: SANS, letterSpacing: 1.2, textTransform: 'uppercase' }}>Emotion Tags</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {tags.map(t => <span key={t} style={{ padding: '4px 11px', borderRadius: 999, border: `1px solid ${COLORS.primary}`, color: COLORS.primary, fontSize: 12, fontWeight: 500 }}>{t}</span>)}
        </div>
        <div style={{ height: 1, background: COLORS.line, marginBottom: 14 }}/>
        <div style={{ fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{body}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onSave} style={{ flex: 1, height: 36, borderRadius: 100, background: 'transparent', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, fontFamily: SERIF, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Save to Diary</button>
          <button onClick={onEdit} style={{ flex: 1, height: 36, borderRadius: 100, border: 0, background: COLORS.primary, color: '#0E0D14', fontFamily: SERIF, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(212,242,74,0.35)' }}>Edit</button>
        </div>
      </div>
    </div>
  );
}
function ReflectionSummaryCard({ summary, onContinue }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, padding: 16, borderRadius: 18, background: 'rgba(30,28,42,0.7)', border: `1px solid ${COLORS.line}`, fontFamily: SERIF, color: COLORS.ink, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: COLORS.primary, color: '#0E0D14', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: SANS, marginBottom: 12, textTransform: 'uppercase' }}>Reflection</div>
        <div style={{ fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{summary}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onContinue} style={{ flex: 1, height: 36, borderRadius: 100, border: 0, background: COLORS.primary, color: '#0E0D14', fontFamily: SERIF, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(212,242,74,0.35)' }}>Continue</button>
        </div>
      </div>
    </div>
  );
}
function ErrorBubble({ text, onRetry }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(200,60,60,0.15)', border: '1px solid rgba(200,60,60,0.3)', fontFamily: SANS, fontSize: 14, color: '#E88A8A' }}>
        {text}
        {onRetry && <button onClick={onRetry} style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 999, border: `1px solid #E88A8A`, background: 'transparent', color: '#E88A8A', fontSize: 11, cursor: 'pointer', fontFamily: SANS }}>Retry</button>}
      </div>
    </div>
  );
}
function MoodCheckIn({ prompt, selected, onPick }) {
  return (
    <div style={{ padding: '14px 14px 16px', borderRadius: 18, background: 'rgba(30,28,42,0.6)', border: `1px solid ${COLORS.line}` }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: COLORS.ink, fontSize: 14, marginBottom: 12, fontFamily: SERIF }}><span>{prompt}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {['Terrible','Bad','Okay','Good','Great'].map(m => <MoodCreature key={m} mood={m} active={selected === m} onClick={() => onPick(m)}/>)}
      </div>
    </div>
  );
}
function TypingDots() {
  return (
    <div style={{ display: 'inline-flex', gap: 3, padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: COLORS.aiBubble, border: `1px solid ${COLORS.line}`, alignItems: 'center', height: 34, boxSizing: 'border-box' }}>
      {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.primary, animation: `wd2bounce 1.2s ${i * 0.15}s infinite ease-in-out` }}/>)}
      <style>{`@keyframes wd2bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4 } 40% { transform: translateY(-5px); opacity: 1 } }`}</style>
    </div>
  );
}

// ─── Retained SCRIPT (non-Self-awareness pathways only) ───
const SCRIPT = {
  pathwayIntro: "I'm glad you want to keep talking! Which direction would you like to explore?",
  pathways: ['Self-awareness', 'Problem-solving', 'Reframing', 'Emotion focus'],
  pathwayResponses: {
    'Problem-solving': "Sure. Let's break down the problems you're facing into smaller, actionable steps. Which one would you like to start with?",
    'Reframing': "Often, what hurts us isn't just what happened, but how we interpret it. Is there a recurring thought that's been especially troubling lately?",
    'Emotion focus': "Let's slow down and bring attention back to your body. Where do you feel the strongest sensation right now?",
  },
};

// ─── Main Component ───
export default function WriteDiary2() {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('welcome');
  const [input, setInput] = useState('');
  const [mood, setMood] = useState(null);
  const [endMood, setEndMood] = useState(null);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSid] = useState(null);
  const [cbtTurns, setCbtTurns] = useState(0);
  const [narrativeTurns, setNarrativeTurns] = useState(0);
  const [reframeData, setReframeData] = useState(null);
  const scrollRef = useRef(null);
  const retryRef = useRef(null);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, stage]);

  useEffect(() => {
    setMessages([{ kind: 'welcome' }]);
    setStage('awaitMood');
  }, []);

  const push = (kind, props) => setMessages(m => [...m, { kind, ...props }]);
  const pushAI = (text) => push('ai', { text });
  const pushUser = (text, chip = false) => push(chip ? 'userChip' : 'user', { text });
  const removeKind = (kind) => setMessages(m => m.filter(x => x.kind !== kind));

  const callAPI = useCallback(async (fn, onSuccess) => {
    setTyping(true);
    try {
      const result = await fn();
      setTyping(false);
      onSuccess(result);
    } catch (err) {
      setTyping(false);
      retryRef.current = { fn, onSuccess };
      push('error', { text: 'Connection failed. Please retry.', retryKey: Date.now() });
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (!retryRef.current) return;
    removeKind('error');
    const { fn, onSuccess } = retryRef.current;
    retryRef.current = null;
    callAPI(fn, onSuccess);
  }, [callAPI]);

  const isCbt = ['awaitInput', 'cbt'].includes(stage);
  const isNarrative = stage === 'narrative';
  const inputDisabled = (isCbt && cbtTurns >= 5) || (isNarrative && narrativeTurns >= 5);

  // ─── Mood pick → create session ───
  const handlePickMood = (m) => {
    if (stage !== 'awaitMood') return;
    setMood(m);
    callAPI(
      () => api.createSession(),
      (res) => {
        setSid(res.session_id);
        pushAI("Hi, what's on your mind today?");
        setStage('awaitInput');
      },
    );
  };

  // ─── Send message ───
  const handleSend = () => {
    if (!input.trim() || !sessionId || inputDisabled) return;
    const text = input.trim();
    pushUser(text);
    setInput('');

    if (isCbt) {
      const isFirst = cbtTurns === 0;
      const newTurns = cbtTurns + 1;
      setCbtTurns(newTurns);
      callAPI(
        () => api.sendCbt(sessionId, text, isFirst ? mood : undefined),
        (res) => {
          pushAI(res.reply);
          if (newTurns >= 3) push('cbtOffer', {});
        },
      );
    } else if (isNarrative) {
      const newTurns = narrativeTurns + 1;
      setNarrativeTurns(newTurns);
      callAPI(
        () => api.sendNarrative(sessionId, text),
        (res) => {
          pushAI(res.reply);
          if (newTurns >= 3) push('narrativeOffer', {});
        },
      );
    } else if (stage === 'finalize') {
      callAPI(
        () => api.finalizeChat(sessionId, text),
        (res) => {
          pushAI(res.reply);
          if (res.complete) {
            push('endMoodPicker', {});
            setStage('awaitEndMood');
          }
        },
      );
    }
  };

  // ─── CBT offer: Reshape / Keep chatting ───
  const handleCbtOffer = (choice) => {
    removeKind('cbtOffer');
    pushUser(choice, true);
    if (choice === 'Reshape Diary') {
      callAPI(
        () => api.reframe(sessionId),
        (res) => {
          setReframeData(res);
          push('reshape', { title: res.title, tags: res.tags, body: res.body });
          setStage('offeredReshape');
        },
      );
    }
  };

  // ─── Save diary → pathway selection ───
  const handleSaveDiary = () => {
    push('system', { text: '✓ Saved to diary' });
    pushAI(SCRIPT.pathwayIntro);
    push('pathways', {});
    setStage('continued');
  };

  // ─── Pathway selection ───
  const handlePathway = (p) => {
    removeKind('pathways');
    pushUser(p, true);
    if (p === 'Self-awareness') {
      callAPI(
        () => api.startNarrative(sessionId),
        (res) => {
          pushAI(res.reply);
          setStage('narrative');
          setNarrativeTurns(0);
        },
      );
    } else {
      pushAI(SCRIPT.pathwayResponses[p]);
      setStage('pathwayDemo');
    }
  };

  // ─── Narrative offer: Reshape / Keep chatting ───
  const handleNarrativeOffer = (choice) => {
    removeKind('narrativeOffer');
    pushUser(choice, true);
    if (choice === 'Reshape Diary') {
      callAPI(
        () => api.summarize(sessionId),
        (res) => {
          push('reflectionSummary', { summary: res.summary });
          setStage('summarized');
        },
      );
    }
  };

  // ─── Reflection summary → finalize ───
  const handleReflectionContinue = () => {
    callAPI(
      () => api.finalize(sessionId),
      (res) => {
        pushAI(res.reply);
        setStage('finalize');
      },
    );
  };

  // ─── End mood ───
  const handlePickEndMood = (m) => {
    setEndMood(m);
    callAPI(
      () => api.setFinalMood(sessionId, m),
      () => {
        push('system', { text: 'Session complete. Thank you for sharing.' });
        setStage('done');
      },
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: COLORS.bg, overflow: 'hidden', paddingBottom: 50 }}>
      <StarfieldBg density={50}/>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2, maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}><Mascot size={140}/></div>
        {messages.map((msg, i) => {
          switch (msg.kind) {
            case 'welcome': return <WelcomeBubble key={i} onPickMood={handlePickMood} selected={mood}/>;
            case 'ai': return <AIBubble key={i} text={msg.text}/>;
            case 'user': return <UserBubble key={i} text={msg.text}/>;
            case 'userChip': return <UserChip key={i} text={msg.text}/>;
            case 'reshape': return <ReshapeDiaryCard key={i} title={msg.title} tags={msg.tags} body={msg.body} onSave={handleSaveDiary} onEdit={() => {}}/>;
            case 'reflectionSummary': return <ReflectionSummaryCard key={i} summary={msg.summary} onContinue={handleReflectionContinue}/>;
            case 'system': return <div key={i} style={{ alignSelf: 'center', padding: '4px 12px', borderRadius: 999, background: 'rgba(212,242,74,0.12)', color: COLORS.primary, fontFamily: SANS, fontSize: 12, fontWeight: 500, letterSpacing: 0.5 }}>{msg.text}</div>;
            case 'pathways': return <PathwayChips key={i} options={SCRIPT.pathways} onPick={handlePathway}/>;
            case 'cbtOffer': return <OfferChips key={i} options={['Reshape Diary', 'Keep chatting']} onPick={handleCbtOffer}/>;
            case 'narrativeOffer': return <OfferChips key={i} options={['Reshape Diary', 'Keep chatting']} onPick={handleNarrativeOffer}/>;
            case 'endMoodPicker': return <MoodCheckIn key={i} prompt="After our chat, how are you feeling now?" selected={endMood} onPick={handlePickEndMood}/>;
            case 'error': return <ErrorBubble key={i} text={msg.text} onRetry={handleRetry}/>;
            default: return null;
          }
        })}
        {typing && <div style={{ display: 'flex' }}><TypingDots/></div>}
        <div style={{ height: 8 }}/>
      </div>
      <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <InputBar value={input} onChange={setInput} onSend={handleSend} placeholder="What happened today?" stoppable={typing} onStop={() => setTyping(false)} disabled={inputDisabled || stage === 'done'}/>
      </div>
    </div>
  );
}
