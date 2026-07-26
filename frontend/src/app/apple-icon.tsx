import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#BE185D',
        borderRadius: 40,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 88 }}>
        <div
          style={{
            width: 24,
            height: 78,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.95)',
          }}
        />
        <div
          style={{
            width: 24,
            height: 56,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.75)',
          }}
        />
        <div
          style={{
            width: 24,
            height: 66,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      </div>
    </div>,
    { ...size },
  );
}
