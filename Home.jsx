import React, { useState } from 'react';
import { View, SafeAreaView, ScrollView } from 'react-native';
import PlanetScreen from './PlanetScreen';
import DiaryCalendar from './DiaryCalendar';
import WriteDiary2 from './WriteDiary2';
import BottomNav from './BottomNav';
import MONSTERS from './monsters.json';
import DIARIES from './diaries.json';
import { MONTHS_SHORT, ATTR_LABEL } from './constants';

function fmtDate(iso) {
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function buildInitialMonsters() {
  const diaryById = new Map(DIARIES.map((d) => [d.id, d]));
  return MONSTERS.map((m, i) => {
    const d = diaryById.get(m.diary_id);
    return {
      id: m.id,
      creatureId: m.species_id,
      name: m.name,
      cat: m.attribute,
      attr: ATTR_LABEL[m.attribute] ?? m.attribute,
      color: m.color,
      torsoColor: m.torsoColor,
      gem: m.gem,
      diary: d?.content ?? '',
      mood: d?.mood_score ?? 3,
      emotions: d?.emotions ?? [],
      date: d ? fmtDate(d.created_at) : '',
      deployed: !!m.is_displayed,
      starred: !!m.starred,
      seed: (i + 1) * 11 + 5,
      addedAt: d ? new Date(d.created_at) : new Date(),
    };
  });
}

function buildCalendarDiaries() {
  const monsterByDiaryId = new Map(
    MONSTERS.map((m) => [m.diary_id, m])
  );
  return DIARIES.map((d) => {
    const m = monsterByDiaryId.get(d.id);
    return {
      id: d.id,
      date: fmtDate(d.created_at),
      mood: d.mood_score,
      emotions: d.emotions ?? [],
      diary: d.content,
      status: d.status,
      name: m?.name,
      color: m?.color,
      torsoColor: m?.torsoColor,
      gem: m?.gem,
      attr: m ? (ATTR_LABEL[m.attribute] ?? m.attribute) : undefined,
    };
  });
}

export default function Home() {
  const [navKey, setNavKey] = useState('planet');
  const [monsters, setMonsters] = useState(buildInitialMonsters);
  const calendarDiaries = buildCalendarDiaries();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#02030c' }}>
      <View style={{ flex: 1 }}>
        {navKey === 'planet' && (
          <PlanetScreen monsters={monsters} setMonsters={setMonsters} />
        )}
        {navKey === 'calendar' && (
          <ScrollView
            style={{ flex: 1, backgroundColor: '#07031a' }}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <DiaryCalendar diaries={calendarDiaries} />
          </ScrollView>
        )}
        {navKey === 'write' && (
          <WriteDiary2 />
        )}
      </View>
      <BottomNav
        activeKey={navKey}
        onSelect={setNavKey}
        onWriteDiary={() => setNavKey('write')}
      />
    </SafeAreaView>
  );
}
