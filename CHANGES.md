# v4 update (apply on top of v3)

Replaced / new:
  src/components/RadarScanner.tsx   scope display: bearing bezel, range rings, rotating sweep with fading trail, tracked target
  src/components/Speedometer.tsx    270-degree instrument gauge with scale and limit marker
  src/components/Card.tsx, StatTile.tsx, PhaseBanner.tsx, PlateBadge.tsx, StatusPill.tsx   flat, data-first styling
  app/(tabs)/_layout.tsx            5 tabs (Scan, Telemetry, Cases, History, Profile) + open-case badge, quieter tab bar
  app/(tabs)/index.tsx              radar card with instrument readout strip

Note: Card/StatTile/PhaseBanner/PlateBadge/Speedometer/RadarScanner/StatusPill/_layout were not in the v2 zip,
so these are full rewrites against the props the screens use. `git checkout <file>` restores yours.
