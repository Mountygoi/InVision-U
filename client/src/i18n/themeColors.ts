/**
 * Theme-aware color helpers.
 * Usage: const c = themeColors(isDark);
 *        <div style={{ background: c.pageBg, color: c.text }}>
 */
export const themeColors = (isDark: boolean) => ({
  // Page & layout backgrounds
  pageBg: isDark ? '#0f172a' : '#fafafa',
  cardBg: isDark ? '#1e293b' : '#ffffff',
  surfaceBg: isDark ? '#334155' : '#F9FAFB',
  surfaceAlt: isDark ? '#2d3a4e' : '#F5F7FA',
  
  // Text
  text: isDark ? '#f1f5f9' : '#1E293B',
  textStrong: isDark ? '#f8fafc' : '#111827',
  textSecondary: isDark ? '#94a3b8' : '#64748B',
  textMuted: isDark ? '#64748b' : '#9CA3AF',
  textDark: isDark ? '#cbd5e1' : '#374151',
  
  // Borders
  border: isDark ? '#334155' : '#E2E8F0',
  borderLight: isDark ? '#475569' : '#F0F0F0',
  borderAccent: isDark ? '#334155' : '#F0F4F8',
  
  // Green accent areas
  greenBg: isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4',
  greenBorder: isDark ? 'rgba(22,163,74,0.3)' : '#bbf7d0',
  greenBgStrong: isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7',
  
  // Orange accent
  orangeBg: isDark ? 'rgba(245,158,11,0.15)' : '#FFF7ED',
  orangeBorder: isDark ? 'rgba(245,158,11,0.3)' : '#FED7AA',
  
  // Blue accent
  blueBg: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
  blueBorder: isDark ? 'rgba(59,130,246,0.3)' : '#bbf7d0',

  // Red accent
  redBg: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
  
  // Shadows
  shadowSm: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
  shadowLg: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.08)',
  
  // Scrollbar
  scrollThumb: isDark ? '#475569' : '#E2E8F0',
  
  // Misc
  alertBg: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
  hoverBg: isDark ? '#334155' : '#f5f5f5',
});
