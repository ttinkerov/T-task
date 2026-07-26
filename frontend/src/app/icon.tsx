import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#BE185D',
        borderRadius: 9,
      }}
    >
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
        <div
          style={{
            width: 4.5,
            height: 14,
            borderRadius: 1.5,
            background: 'rgba(255,255,255,0.95)',
          }}
        />
        <div
          style={{
            width: 4.5,
            height: 10,
            borderRadius: 1.5,
            background: 'rgba(255,255,255,0.75)',
          }}
        />
        <div
          style={{
            width: 4.5,
            height: 12,
            borderRadius: 1.5,
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      </div>
    </div>,
    { ...size },
  );
}
