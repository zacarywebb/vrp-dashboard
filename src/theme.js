export const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceHover: "#1a1a25",
  border: "#1e1e2e",
  borderLight: "#2a2a3a",
  text: "#e8e6e3",
  textMuted: "#8a8a9a",
  textDim: "#5a5a6a",
  accent: "#6366f1",
  accentDim: "#4f46e5",
  green: "#10b981",
  greenDim: "#059669",
  red: "#ef4444",
  redDim: "#dc2626",
  amber: "#f59e0b",
  teal: "#14b8a6",
  purple: "#a78bfa",
};

export const MONO = "'JetBrains Mono', monospace";
export const CARD = {
  background: COLORS.surface,
  borderRadius: 10,
  border: `0.5px solid ${COLORS.border}`,
};

export const fmtMoney = (v) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1e3).toFixed(0)}K`;

export const fmtPct = (v, d = 1) => (v == null ? "—" : `${v.toFixed(d)}%`);
