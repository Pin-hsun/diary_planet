import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

// ─── Depth & size helpers ─────────────────────────────────────────────────────

export function depthFromY(y, yTop, yBot) {
  return Math.max(0, Math.min(1, (y - yTop) / (yBot - yTop)));
}

export function scaleFromDepth(depth) {
  return 0.45 + depth * 0.75;
}

// ─── Single creature view ─────────────────────────────────────────────────────

export const CreatureView = React.memo(({ data, state, onPress, yTop, yBot }) => {
  const depth = depthFromY(state.y, yTop, yBot);
  const scale = scaleFromDepth(depth);
  const size = Math.round(38 * scale);
  const eyeSize = Math.max(3, Math.round(size * 0.14));
  const eyeTop = Math.round(size * 0.27);
  const eyeGap = Math.max(3, Math.round(size * 0.17));
  const footW = Math.max(3, Math.round(size * 0.14));
  const footH = Math.max(3, Math.round(size * 0.17));
  const fontSize = Math.max(6, Math.round(7 * scale));
  const shadowW = Math.round(size * 0.7);
  const shadowH = Math.max(2, Math.round(size * 0.1));
  const totalH = shadowH + size + footH + fontSize + 8;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.creatureAbs, {
        left: Math.round(state.x),
        top: Math.round(state.y) - totalH,
        zIndex: Math.round(state.y),
      }]}
    >
      {/* Shadow */}
      <View style={{
        width: shadowW, height: shadowH,
        borderRadius: shadowW / 2,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignSelf: 'center', marginBottom: 1,
      }} />

      {/* Body + feet */}
      <View style={{ transform: [{ scaleX: state.facingRight ? 1 : -1 }] }}>
        <View style={{
          width: size, height: size,
          borderRadius: size * 0.5,
          borderBottomLeftRadius: size * 0.4,
          borderBottomRightRadius: size * 0.4,
          backgroundColor: data.color,
          alignItems: 'center',
        }}>
          <View style={{ position: 'absolute', top: eyeTop, flexDirection: 'row', gap: eyeGap }}>
            {[0, 1].map(i => (
              <View key={i} style={{
                width: eyeSize, height: eyeSize,
                borderRadius: eyeSize / 2,
                backgroundColor: 'white',
              }}>
                <View style={{
                  width: eyeSize * 0.5, height: eyeSize * 0.5,
                  borderRadius: eyeSize * 0.25,
                  backgroundColor: '#111',
                  position: 'absolute', top: '25%', left: '25%',
                }} />
              </View>
            ))}
          </View>
        </View>

        <View style={{
          flexDirection: 'row', justifyContent: 'center',
          gap: Math.round(eyeGap * 0.7), marginTop: 1,
        }}>
          {[0, 1].map(i => (
            <View key={i} style={{
              width: footW, height: footH,
              borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
              backgroundColor: data.torsoColor,
            }} />
          ))}
        </View>
      </View>

      {/* Name */}
      <Text style={{ fontSize, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 }}>
        {data.name}
      </Text>
    </Pressable>
  );
});

// ─── Static creature preview (for MonsterManager cards) ──────────────────────

export const StaticCreature = ({ color, torsoColor, size = 60 }) => {
  const eyeSize = Math.max(3, Math.round(size * 0.14));
  const eyeTop = Math.round(size * 0.27);
  const eyeGap = Math.max(3, Math.round(size * 0.17));
  const footW = Math.max(3, Math.round(size * 0.14));
  const footH = Math.max(3, Math.round(size * 0.17));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size, height: size,
        borderRadius: size * 0.5,
        borderBottomLeftRadius: size * 0.4,
        borderBottomRightRadius: size * 0.4,
        backgroundColor: color,
        alignItems: 'center',
      }}>
        <View style={{ position: 'absolute', top: eyeTop, flexDirection: 'row', gap: eyeGap }}>
          {[0, 1].map(i => (
            <View key={i} style={{
              width: eyeSize, height: eyeSize,
              borderRadius: eyeSize / 2,
              backgroundColor: 'white',
            }}>
              <View style={{
                width: eyeSize * 0.5, height: eyeSize * 0.5,
                borderRadius: eyeSize * 0.25,
                backgroundColor: '#111',
                position: 'absolute', top: '25%', left: '25%',
              }} />
            </View>
          ))}
        </View>
      </View>
      <View style={{
        flexDirection: 'row', justifyContent: 'center',
        gap: Math.round(eyeGap * 0.7), marginTop: 1,
      }}>
        {[0, 1].map(i => (
          <View key={i} style={{
            width: footW, height: footH,
            borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
            backgroundColor: torsoColor,
          }} />
        ))}
      </View>
    </View>
  );
};

// ─── Diary Card ───────────────────────────────────────────────────────────────

export const DiaryCard = ({ creature, onClose }) => {
  if (!creature) return null;
  return (
    <View style={styles.diaryCard}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>✕</Text>
      </Pressable>
      <View style={styles.diaryHeader}>
        <View style={[styles.diaryAvatar, { backgroundColor: creature.color }]}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>{creature.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.diaryName}>{creature.name}</Text>
          <Text style={styles.diaryDate}>{creature.date}</Text>
        </View>
        <View style={[styles.attrBadge, { backgroundColor: creature.attrBg }]}>
          <Text style={[styles.attrText, { color: creature.attrColor }]}>{creature.attr}</Text>
        </View>
      </View>
      <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaryText}>{creature.diary}</Text>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  creatureAbs: { position: 'absolute', alignItems: 'center' },
  diaryCard: {
    position: 'absolute', left: 12, right: 12, bottom: 162,
    backgroundColor: 'rgb(23, 23, 26)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 13, zIndex: 9999,
  },
  closeBtn: {
    position: 'absolute', top: 9, right: 9,
    width: 17, height: 17, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  diaryAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  diaryName: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  diaryDate: { fontSize: 9, color: 'rgba(255,255,255,0.35)' },
  attrBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  attrText: { fontSize: 9, fontWeight: '500' },
  diaryText: {
    fontSize: 10, lineHeight: 16.5, color: 'rgba(255,255,255,0.65)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 8,
  },
});
