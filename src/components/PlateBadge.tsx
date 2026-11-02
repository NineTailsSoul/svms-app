import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PlateBadge({ plate, large }: { plate: string; large?: boolean }) {
  return (
    <View style={[styles.plate, { height: large ? 46 : 28 }]}>
      <View style={[styles.band, { width: large ? 24 : 17 }]}>
        <Text style={[styles.ind, { fontSize: large ? 8 : 6 }]}>IND</Text>
      </View>
      <Text style={[styles.text, { fontSize: large ? 24 : 15, paddingHorizontal: large ? 12 : 8 }]}>{plate.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: '#F2F0EA', borderRadius: 4, borderWidth: 1.5, borderColor: '#1B1B1B', overflow: 'hidden' },
  band: { alignSelf: 'stretch', backgroundColor: '#1D3F8F', alignItems: 'center', justifyContent: 'center' },
  ind: { color: '#fff', fontWeight: '800' },
  text: { color: '#111', fontWeight: '700', letterSpacing: 1.5, fontVariant: ['tabular-nums'] },
});
