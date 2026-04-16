import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';

export default function BottomNav({ activeKey, onSelect, onWriteDiary }) {
  return (
    <View style={styles.bottomNav}>
      <NavItem label="planet" activeKey={activeKey} onSelect={onSelect} />
      <NavItem label="calendar" activeKey={activeKey} onSelect={onSelect} />
      <TouchableOpacity style={styles.writeBtn} onPress={onWriteDiary}>
        <Text style={{ color: 'white', fontSize: 18 }}>✎</Text>
      </TouchableOpacity>
      <NavItem label="profile" activeKey={activeKey} onSelect={onSelect} />
      <NavItem label="bag" activeKey={activeKey} onSelect={onSelect} />
    </View>
  );
}

const NavItem = ({ label, activeKey, onSelect }) => {
  const active = activeKey === label;
  return (
    <Pressable style={styles.navItem} onPress={() => onSelect?.(label)}>
      <View style={[styles.navIcon, active && styles.navIconActive]} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
    backgroundColor: 'rgba(4,4,14,0.97)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6,
    zIndex: 100,
  },
  navItem: { alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4 },
  navIcon: { width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', opacity: 0.4 },
  navIconActive: { backgroundColor: '#4a7fa8', borderRadius: 8, opacity: 1 },
  navLabel: { fontSize: 7, color: 'rgba(255,255,255,0.35)' },
  navLabelActive: { color: 'rgba(255,255,255,0.85)' },
  writeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3a6fa0', alignItems: 'center', justifyContent: 'center' },
});
