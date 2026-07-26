import { ImageResponse } from 'next/og';

export const alt = 'T-task — канбан и CRM для небольших команд';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: 'linear-gradient(145deg, #0a0a0a 0%, #1a0a12 45%, #2a0818 100%)',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#BE185D',
            borderRadius: 18,
          }}
        >
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 32 }}>
            <div
              style={{
                width: 9,
                height: 28,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.95)',
              }}
            />
            <div
              style={{
                width: 9,
                height: 20,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.75)',
              }}
            />
            <div
              style={{
                width: 9,
                height: 24,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.55)',
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>T-task</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 920 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1.2,
          }}
        >
          Канбан и CRM для небольших команд
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.35,
          }}
        >
          Доски, сделки, формы и whiteboard — в одном workspace
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          color: 'rgba(255,255,255,0.78)',
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        {['Kanban', 'CRM', 'Forms', 'Whiteboard'].map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(190, 24, 93, 0.18)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
