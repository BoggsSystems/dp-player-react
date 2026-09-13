import { Radio } from 'lucide-react';

interface LiveBadgeProps {
  viewerCount?: number;
}

export default function LiveBadge({ viewerCount = 42 }: LiveBadgeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      <div className="live-badge">
        <span className="live-dot" />
        <span>LIVE</span>
      </div>

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Radio size={12} color="var(--accent-cyan)" />
        <span>{viewerCount} Viewers</span>
      </div>
    </div>
  );
}
