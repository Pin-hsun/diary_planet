import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import CREATURE_DATA from './creatures.json';
import EGG_DIARIES from './egg_diary.json';
import EggDiaryPopup from './EggDiaryPopup';
import PlanetMenu from './PlanetMenu';
import MonsterManager from './MonsterManager';
import { CreatureView, DiaryCard, depthFromY, scaleFromDepth } from './Monsters';

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

const { width: W, height: H } = Dimensions.get('window');

const Y_TOP = H * 0.4;
const Y_BOT = H - 60;

const WORLD_PAD_X = W;
const WORLD_PAD_Y_TOP = H * 0.4;
const WORLD_PAD_Y_BOT = H * 0.4;
const WORLD_W = W + WORLD_PAD_X * 2;
const BASE_RADIUS = 22;

function radiusFromY(y) {
  return BASE_RADIUS * scaleFromDepth(depthFromY(y, Y_TOP, Y_BOT));
}

// ─── Collision resolution ─────────────────────────────────────────────────────
// Called once per frame AFTER all creatures have moved.
// Checks every pair and pushes overlapping creatures apart.

function resolveCollisions(states) {
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const a = states[i];
      const b = states[j];

      const dx = b.x - a.x;
      const dy = (b.y - a.y) * 1.4;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = radiusFromY(a.y) + radiusFromY(b.y);

      if (dist < minDist && dist > 0.01) {
        const overlap = (minDist - dist) * 0.55;
        const nx = dx / dist;
        const ny = (b.y - a.y) / dist;

        a.x -= nx * overlap;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap;
        b.y += ny * overlap * 0.5;

        a.vx -= nx * 0.3;
        a.vy -= ny * 0.15;
        b.vx += nx * 0.3;
        b.vy += ny * 0.15;

        a.x = Math.max(15, Math.min(W - 65, a.x));
        a.y = Math.max(Y_TOP + 10, Math.min(Y_BOT, a.y));
        b.x = Math.max(15, Math.min(W - 65, b.x));
        b.y = Math.max(Y_TOP + 10, Math.min(Y_BOT, b.y));
      }
    }
  }
}

// ─── Stars (static) ───────────────────────────────────────────────────────────

const STARS = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  x: -WORLD_PAD_X + Math.random() * WORLD_W,
  y: -WORLD_PAD_Y_TOP + Math.random() * (H * 0.5 + WORLD_PAD_Y_TOP),
  size: Math.random() * 1.4 + 0.3,
  opacity: 0.2 + Math.random() * 0.65,
}));

// ─── Eggs (static decor on the land) ──────────────────────────────────────────

const EGG_PALETTE = ['#e8d4b0'];

const EGG_Y_MAX = H - 80;

const EGGS = Array.from({ length: 1 }, (_, i) => ({
  id: i,
  x: 30 + Math.random() * (W - 60),
  y: Y_TOP + 25 + Math.random() * (EGG_Y_MAX - Y_TOP - 25),
  color: EGG_PALETTE[Math.floor(Math.random() * EGG_PALETTE.length)],
  rot: (Math.random() - 0.5) * 30,
  diary: EGG_DIARIES[i % EGG_DIARIES.length],
}));

// ─── Initial creature states ──────────────────────────────────────────────────

function makeInitialStates() {
  return CREATURE_DATA.map((d, i) => ({
    id: d.id,
    x: 30 + i * 56 + Math.random() * 20,
    y: Math.min(Y_TOP + 50 + i * 28, Y_BOT - 10),
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.2,
    tx: W / 2,
    ty: (Y_TOP + Y_BOT) / 2,
    timer: Math.random() * 2000,
    facingRight: true,
  }));
}

// ─── Ground ───────────────────────────────────────────────────────────────────

const Egg = React.memo(({ egg, onPress }) => {
  const scale = scaleFromDepth(depthFromY(egg.y, Y_TOP, Y_BOT));
  const w = 16 * scale;
  const h = 22 * scale;
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        left: egg.x,
        top: egg.y - h,
        width: w,
        height: h,
        zIndex: Math.round(egg.y) - 1,
        transform: [{ rotate: `${egg.rot}deg` }],
      }}
    >
      <View style={{
        width: w,
        height: h,
        backgroundColor: egg.color,
        borderRadius: w,
      }}>
        <View style={{
          position: 'absolute',
          top: h * 0.18,
          left: w * 0.25,
          width: w * 0.28,
          height: h * 0.18,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: w,
        }} />
      </View>
    </Pressable>
  );
});

const Ground = () => {
  const groundH = H - Y_TOP + WORLD_PAD_Y_BOT;
  const gw = WORLD_W;
  return (
    <View style={{
      position: 'absolute',
      left: -WORLD_PAD_X,
      top: Y_TOP,
      width: gw,
      height: groundH,
    }}>
      <Svg width={gw} height={groundH} viewBox={`0 0 ${gw} ${groundH}`}>
        <Defs>
          <LinearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2a3a18" />
            <Stop offset="100%" stopColor="#0e1208" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M0,30 Q${gw * 0.1},10 ${gw * 0.2},22 Q${gw * 0.3},34 ${gw * 0.4},15 Q${gw * 0.5},8 ${gw * 0.6},22 Q${gw * 0.7},34 ${gw * 0.8},15 Q${gw * 0.9},20 ${gw},18 L${gw},${groundH} L0,${groundH} Z`}
          fill="url(#gg)"
        />
      </Svg>
    </View>
  );
};


// ─── Sprite-sheet creature ────────────────────────────────────────────────────

const SPRITE_FRAMES = 4;
const SPRITE_DISPLAY = 80;

const SpriteCreature = ({
  speed = 40,
  minX = 20,
  maxX = W - SPRITE_DISPLAY - 20,
  frameMs = 220,
  pauseMin = 1000,
  pauseMax = 2000,
}) => {
  const stateRef = useRef({
    x: minX + Math.random() * (maxX - minX),
    y: (Y_TOP + Y_BOT) / 2,
    tx: 0,
    ty: 0,
    dir: 1,
    mode: 'walking',
    timer: 0,
    queue: null,
    pauseDur: 0,
    frame: 0,
  });
  const [, force] = useState(0);
  const lastTs = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const s = stateRef.current;

    const pickTarget = () => {
      s.tx = minX + Math.random() * (maxX - minX);
      s.ty = Y_TOP + 20 + Math.random() * (Y_BOT - Y_TOP - 30);
    };

    // Each step = frames 2,3 (indices 1,2). 1-3 steps per walking segment.
    const buildWalkQueue = () => {
      const steps = 1 + Math.floor(Math.random() * 3);
      const q = [];
      for (let i = 0; i < steps; i++) q.push(1, 2);
      return q;
    };

    if (!s.queue) {
      s.queue = buildWalkQueue();
      pickTarget();
    }

    const tick = (ts) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = ts - lastTs.current;
      lastTs.current = ts;

      if (s.mode === 'walking') {
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.5) {
          const mv = Math.min(speed * dt / 1000, dist);
          s.x += (dx / dist) * mv;
          s.y += (dy / dist) * mv;
        }
        if (s.x < minX) s.x = minX;
        if (s.x > maxX) s.x = maxX;
        if (s.y < Y_TOP + 10) s.y = Y_TOP + 10;
        if (s.y > Y_BOT) s.y = Y_BOT;
        if (dx > 1) s.dir = 1;
        else if (dx < -1) s.dir = -1;

        s.timer += dt;
        if (s.timer >= frameMs) {
          s.timer = 0;
          if (s.queue.length === 0) {
            s.mode = 'pausing';
            s.pauseDur = pauseMin + Math.random() * (pauseMax - pauseMin);
            s.frame = 3;
          } else {
            s.frame = s.queue.shift();
          }
        }
      } else {
        s.timer += dt;
        if (s.timer >= s.pauseDur) {
          s.timer = 0;
          s.mode = 'walking';
          s.queue = buildWalkQueue();
          pickTarget();
          s.frame = 0;
        }
      }

      force(n => n + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, minX, maxX, frameMs, pauseMin, pauseMax]);

  const s = stateRef.current;
  const scale = scaleFromDepth(depthFromY(s.y, Y_TOP, Y_BOT));
  const size = SPRITE_DISPLAY * scale;

  return (
    <View style={{
      position: 'absolute',
      left: s.x,
      top: s.y - size,
      width: size,
      height: size,
      overflow: 'hidden',
      zIndex: Math.round(s.y),
      transform: [{ scaleX: s.dir === 1 ? -1 : 1 }],
    }}>
      <Image
        source={require('./assets/creature1.png')}
        style={{
          width: size * SPRITE_FRAMES,
          height: size,
          transform: [{ translateX: -s.frame * size }],
        }}
      />
    </View>
  );
};


// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const BottomNav = ({ onWriteDiary }) => (
  <View style={styles.bottomNav}>
    <NavItem label="planet" active />
    <NavItem label="explore" />
    <TouchableOpacity style={styles.writeBtn} onPress={onWriteDiary}>
      <Text style={{ color: 'white', fontSize: 18 }}>✎</Text>
    </TouchableOpacity>
    <NavItem label="profile" />
    <NavItem label="bag" />
  </View>
);

const NavItem = ({ label, active }) => (
  <View style={styles.navItem}>
    <View style={[styles.navIcon, active && styles.navIconActive]} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanetScreen() {
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [selectedEgg, setSelectedEgg] = useState(null);
  const [menuKey, setMenuKey] = useState(null);
  const [monsters, setMonsters] = useState(() =>
    CREATURE_DATA.map((c, i) => ({
      id: i + 1,
      creatureId: c.id,
      name: c.name,
      cat: c.attr.charAt(0),
      color: c.color,
      torsoColor: c.torsoColor,
      diary: c.diary,
      deployed: false,
      seed: (i + 1) * 11 + 5,
      starred: false,
      addedAt: new Date(c.date),
    }))
  );
  const deployedCreatureIds = new Set(
    monsters.filter(m => m.deployed).map(m => m.creatureId)
  );

  // All creature positions in one shared ref so collision detection
  // can read and write every creature's position in the same frame.
  const statesRef = useRef(makeInitialStates());
  const [, forceRender] = useState(0);

  const animFrame = useRef(null);
  const lastTs = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = Math.min(ts - lastTs.current, 50);
      lastTs.current = ts;

      const states = statesRef.current;

      // 1. Move each creature toward its target
      states.forEach((c) => {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.tx = 20 + Math.random() * (W - 80);
          c.ty = Y_TOP + 20 + Math.random() * (Y_BOT - Y_TOP - 30);
          c.timer = 2500 + Math.random() * 4000;
        }

        const dx = c.tx - c.x;
        const dy = c.ty - c.y;
        const depth = depthFromY(c.y, Y_TOP, Y_BOT);
        const sp = 0.3 + depth * 0.7;

        c.vx += dx * 0.0003 * dt;
        c.vy += dy * 0.0002 * dt;
        c.vx *= 0.90;
        c.vy *= 0.90;

        const ms = 1.2 * sp;
        c.vx = Math.max(-ms, Math.min(ms, c.vx));
        c.vy = Math.max(-ms * 0.6, Math.min(ms * 0.6, c.vy));

        c.x += c.vx * dt * 0.05;
        c.y += c.vy * dt * 0.05;
        c.x = Math.max(15, Math.min(W - 65, c.x));
        c.y = Math.max(Y_TOP + 10, Math.min(Y_BOT, c.y));

        if (c.vx > 0.08) c.facingRight = true;
        else if (c.vx < -0.08) c.facingRight = false;
      });

      // 2. Push apart any overlapping creatures
      resolveCollisions(states);

      // 3. Re-render
      forceRender(n => n + 1);

      animFrame.current = requestAnimationFrame(tick);
    };

    animFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  const handleCreaturePress = useCallback((data) => {
    setSelectedCreature(data);
    setSelectedEgg(null);
  }, []);

  const handleEggPress = useCallback((egg) => {
    setSelectedEgg(egg.diary);
    setSelectedCreature(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCreature(null);
    setSelectedEgg(null);
  }, []);

  const states = statesRef.current;

  // Zoom: shared value driven by pinch (native) or wheel (web)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    });

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleWheel = Platform.OS === 'web'
    ? (e) => {
        const dy = e.nativeEvent?.deltaY ?? 0;
        const next = scale.value * (1 - dy * 0.0015);
        scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      }
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.screen} onPress={handleClose} onWheel={handleWheel}>

        <GestureDetector gesture={pinch}>
          <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'visible' }, worldStyle]}>
            {/* Stars */}
            {STARS.map(s => (
              <View key={s.id} style={[styles.star, {
                left: s.x, top: s.y,
                width: s.size, height: s.size,
                opacity: s.opacity,
              }]} />
            ))}

            {/* Ground */}
            <Ground />

            {/* Eggs scattered on the land */}
            {EGGS.map(e => <Egg key={e.id} egg={e} onPress={() => handleEggPress(e)} />)}

            {/* Creatures sorted by y so closer ones render on top */}
            {[...states]
              .filter(s => deployedCreatureIds.has(s.id))
              .sort((a, b) => a.y - b.y)
              .map((state) => {
                const data = CREATURE_DATA.find(d => d.id === state.id);
                return (
                  <CreatureView
                    key={state.id}
                    data={data}
                    state={state}
                    yTop={Y_TOP}
                    yBot={Y_BOT}
                    onPress={() => handleCreaturePress(data)}
                  />
                );
              })}

            {/* Sprite-sheet creature */}
            <SpriteCreature />

          </Animated.View>
        </GestureDetector>

        {/* Menu */}
        <PlanetMenu
          activeKey={menuKey}
          onSelect={setMenuKey}
          style={{ position: 'absolute', top: 12, left: 12 }}
        />

        {/* Diary card */}
        <DiaryCard creature={selectedCreature} onClose={handleClose} />
        {selectedEgg && (
          <EggDiaryPopup
            egg={{ name: selectedEgg.title, diary: selectedEgg.diary }}
            onClose={handleClose}
          />
        )}

        {/* Monster Manager */}
        {menuKey === 'monsters' && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '16px 12px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setMenuKey(null);
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '82vh', overflowY: 'auto', borderRadius: 16, width: '100%', maxWidth: 420 }}>
              <MonsterManager monsters={monsters} setMonsters={setMonsters} />
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <BottomNav onWriteDiary={() => { /* navigate to diary screen */ }} />

      </Pressable>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#02030c' },
  screen: { flex: 1, backgroundColor: '#02030c', overflow: 'hidden' },
  star: { position: 'absolute', borderRadius: 99, backgroundColor: 'white' },
  groundWrap: { position: 'absolute', left: 0, right: 0 },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
    backgroundColor: 'rgba(4,4,14,0.97)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6,
  },
  navItem: { alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4 },
  navIcon: { width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', opacity: 0.4 },
  navIconActive: { backgroundColor: '#4a7fa8', borderRadius: 8, opacity: 1 },
  navLabel: { fontSize: 7, color: 'rgba(255,255,255,0.35)' },
  navLabelActive: { color: 'rgba(255,255,255,0.85)' },
  writeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3a6fa0', alignItems: 'center', justifyContent: 'center' },
});
