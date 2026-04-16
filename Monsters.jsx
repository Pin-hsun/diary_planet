import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getAttrStyle, attrToCat, GEM_COLORS, StaticGem } from './gem';

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

export const DiaryCard = ({ creature, onClose, onRecall }) => {
  if (!creature) return null;
  const attrStyle = getAttrStyle(creature.attr);
  const cat = attrToCat(creature.attr);
  const gemCol = GEM_COLORS[cat] ?? GEM_COLORS.null;
  return (
    <View style={styles.diaryCard}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>✕</Text>
      </Pressable>
      <View style={styles.diaryHeader}>
        <View style={[styles.diaryAvatar, { backgroundColor: creature.color }]}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>{creature.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.diaryName}>{creature.name}</Text>
          <Text style={styles.diaryDate}>{creature.date}</Text>
        </View>
        {creature.gem && (
          <View style={styles.gemChip}>
            <StaticGem cat={cat} size={30} />
            <Text style={[styles.gemText, { color: gemCol.hi }]}>{creature.gem}</Text>
          </View>
        )}
        <View style={[styles.attrBadge, { backgroundColor: attrStyle.bg }]}>
          <Text style={[styles.attrText, { color: attrStyle.color }]}>{creature.attr}</Text>
        </View>
      </View>

      {(creature.mood != null || creature.emotions?.length) && (
        <View style={styles.metaRow}>
          {creature.mood != null && (
            <View style={styles.moodWrap}>
              <Text style={styles.metaLabel}>Mood</Text>
              <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <View key={n} style={{
                    width: 7, height: 7, borderRadius: 4, marginLeft: 3,
                    backgroundColor: n <= creature.mood ? gemCol.mid : 'rgba(255,255,255,0.15)',
                  }} />
                ))}
              </View>
            </View>
          )}
          {creature.emotions?.map((em) => (
            <View key={em} style={[styles.emoPill, { borderColor: gemCol.mid }]}>
              <Text style={[styles.emoText, { color: gemCol.hi }]}>{em}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView style={{ maxHeight: 170 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaryText}>{creature.diary}</Text>
      </ScrollView>

      {onRecall && (
        <Pressable style={styles.recallBtn} onPress={onRecall}>
          <Text style={styles.recallText}>Recall</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  creatureAbs: { position: 'absolute', alignItems: 'center' },
  diaryCard: {
    position: 'absolute', left: 12, right: 12, bottom: 70,
    backgroundColor: 'rgb(23, 23, 26)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, padding: 18, zIndex: 9999,
  },
  closeBtn: {
    position: 'absolute', top: 11, right: 11,
    width: 22, height: 22, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  diaryAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  diaryName: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.92)' },
  diaryDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  attrBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  attrText: { fontSize: 11, fontWeight: '500' },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    marginBottom: 12,
  },
  moodWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  gemChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gemText: { fontSize: 12, fontWeight: '500' },
  emoPill: {
    paddingHorizontal: 9, paddingVertical: 2, borderRadius: 99,
    borderWidth: 0.5, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emoText: { fontSize: 10 },
  diaryText: {
    fontSize: 12, lineHeight: 20, color: 'rgba(255,255,255,0.78)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12,
  },
  recallBtn: {
    marginTop: 12, alignSelf: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(29,158,117,0.15)',
    borderRadius: 99,
    borderWidth: 0.5, borderColor: 'rgba(29,158,117,0.5)',
  },
  recallText: { fontSize: 12, color: '#5DCAA5', fontWeight: '500' },
});
