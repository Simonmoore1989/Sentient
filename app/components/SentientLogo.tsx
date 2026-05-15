'use client';
import React from 'react';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  textColor?: string;
  clientName?: string;
  mutedColor?: string;
};

export default function SentientLogo({
  size = 'md',
  showTagline = true,
  textColor = '#E8EDF2',
  clientName,
  mutedColor = '#2E4050'
}: Props) {
  const config = {
    sm: { box: 20, boxRadius: 4, svg: 10, fontSize: 12, tagSize: 6, gap: 8, strokeWidth: 1.5 },
    md: { box: 28, boxRadius: 6, svg: 14, fontSize: 14, tagSize: 6, gap: 10, strokeWidth: 1.5 },
    lg: { box: 52, boxRadius: 10, svg: 28, fontSize: 28, tagSize: 9, gap: 14, strokeWidth: 2 },
  }[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: config.gap }}>
      <div style={{
        width: config.box,
        height: config.box,
        border: `${config.strokeWidth}px solid #2ECC9A`,
        borderRadius: config.boxRadius,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(46,204,154,0.08)',
        flexShrink: 0,
      }}>
        <svg width={config.svg} height={config.svg} viewBox="0 0 32 32" fill="none">
          <path d="M16 4L28 10.5V21.5L16 28L4 21.5V10.5L16 4Z" stroke="#2ECC9A" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="16" cy="16" r="4" fill="#2ECC9A"/>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: config.fontSize,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          lineHeight: 1.1,
          color: textColor,
        }}>
          Sentient{clientName && (
            <span style={{ color: mutedColor, fontWeight: 400 }}> | {clientName}</span>
          )}
        </span>
        {showTagline && (
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: config.tagSize,
            fontWeight: 700,
            letterSpacing: '0.32em',
            textTransform: 'uppercase' as const,
            color: '#2ECC9A',
            whiteSpace: 'nowrap',
          }}>Execution Intelligence</span>
        )}
      </div>
    </div>
  );
}
