import React from 'react';
import { COLORS, SHADOW, RADIUS, BLUR, FONT, Z_INDEX } from '../../styles/tokens';

interface Props {
  query: string;
  onChange: (value: string) => void;
}

const containerStyle: React.CSSProperties = {
  background: COLORS.surfaceLight,
  backdropFilter: BLUR,
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: RADIUS.large,
  padding: '6px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: SHADOW.card,
  maxWidth: 'calc(100vw - 24px)',
  zIndex: Z_INDEX.popover,
};

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: COLORS.text,
  fontSize: FONT.md,
  outline: 'none',
  width: 'min(220px, calc(100vw - 84px))',
};

const clearBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: COLORS.textMuted,
  fontSize: FONT.lg,
  cursor: 'pointer',
  padding: 2,
};

export const SearchBar: React.FC<Props> = ({ query, onChange }) => (
  <div style={containerStyle}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
    <input
      style={inputStyle}
      placeholder="Search nodes..."
      value={query}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
    {query && (
      <button style={clearBtnStyle} onClick={() => onChange('')}>
        ✕
      </button>
    )}
  </div>
);
