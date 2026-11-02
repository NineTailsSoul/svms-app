import { colors } from '../theme/colors';

export type Severity = { label: 'Minor' | 'Moderate' | 'Severe'; color: string; bg: string };

// Based on how far the speed is over the limit (as a share of the limit)
export function severityOf(speed: number, limit: number): Severity {
  const ratio = limit > 0 ? (speed - limit) / limit : 0;
  if (ratio >= 0.4) return { label: 'Severe', color: colors.danger, bg: colors.dangerBg };
  if (ratio >= 0.2) return { label: 'Moderate', color: '#E0773D', bg: 'rgba(224,119,61,0.15)' };
  return { label: 'Minor', color: colors.warning, bg: colors.warningBg };
}
