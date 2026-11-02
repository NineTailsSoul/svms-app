import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '../theme/colors';

// Google only serves its embed pages inside an <iframe>, so the WebView loads a tiny HTML page
// that contains the iframe. Works without a key; set EXPO_PUBLIC_GOOGLE_MAPS_KEY to use the official Embed API.
const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export function MapWebView({ lat, lng, height = 180 }: { lat: number; lng: number; height?: number }) {
  const html = useMemo(() => {
    const q = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const src = KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${q}&zoom=16`
    : `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>html,body{margin:0;height:100%;background:#17181B}iframe{border:0;width:100%;height:100%}</style></head>
    <body><iframe src="${src}" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`;
  }, [lat, lng]);

  return (
    <View style={[styles.wrap, { height }]}>
    <WebView
    originWhitelist={['*']}
    source={{ html, baseUrl: 'https://www.google.com' }}
    javaScriptEnabled
    domStorageEnabled
    setSupportMultipleWindows={false}
    style={{ backgroundColor: colors.surface }}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
