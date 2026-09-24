import { useEffect, useRef, useState, useMemo } from 'react';
import { Play } from 'lucide-react';
import { SubtitleWord } from '../types';

export const HIGHLIGHT_COLORS: Record<string, { hex: string; glow: string; name: string }> = {
  AMBER: { hex: '#FFB800', glow: 'rgba(255,184,0,0.6)', name: 'Neon Amber' },
  CYAN: { hex: '#00F0FF', glow: 'rgba(0,240,255,0.6)', name: 'Cyber Cyan' },
  LIME: { hex: '#39FF14', glow: 'rgba(57,255,20,0.6)', name: 'Electric Lime' },
  PINK: { hex: '#FF007F', glow: 'rgba(255,0,127,0.6)', name: 'Hot Pink' },
  ORANGE: { hex: '#F97316', glow: 'rgba(249,115,22,0.6)', name: 'Sunset Orange' },
  VIOLET: { hex: '#8B5CF6', glow: 'rgba(139,92,246,0.6)', name: 'Neon Violet' },
  WHITE: { hex: '#FFFFFF', glow: 'rgba(255,255,255,0.6)', name: 'Pure White' },
  EMERALD: { hex: '#10b981', glow: 'rgba(16,185,129,0.6)', name: 'Emerald' },
  amber: { hex: '#FFB800', glow: 'rgba(255,184,0,0.6)', name: 'Neon Amber' },
  cyan: { hex: '#00F0FF', glow: 'rgba(0,240,255,0.6)', name: 'Cyber Cyan' },
  lime: { hex: '#39FF14', glow: 'rgba(57,255,20,0.6)', name: 'Electric Lime' },
  pink: { hex: '#FF007F', glow: 'rgba(255,0,127,0.6)', name: 'Hot Pink' },
  orange: { hex: '#F97316', glow: 'rgba(249,115,22,0.6)', name: 'Sunset Orange' },
  violet: { hex: '#8B5CF6', glow: 'rgba(139,92,246,0.6)', name: 'Neon Violet' },
  white: { hex: '#FFFFFF', glow: 'rgba(255,255,255,0.6)', name: 'Pure White' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.6)', name: 'Emerald' },
};

interface ShortsVideoSurfaceProps {
  src?: string;
  autoplay?: boolean;
  muted?: boolean;
  onMuteToggle?: (isMuted: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onSurfaceTap?: () => void;
  isPaused?: boolean;
  seekTime?: number | null;
  layoutMode?: 'FIT_BLUR' | 'COVER_CROP';
  words?: SubtitleWord[];
  highlightColor?: string;
  fontSize?: number;
  verticalPosition?: number;
  showQrCode?: boolean;
  qrPlacement?: 'TOP_RIGHT' | 'TOP_LEFT' | 'BOTTOM_RIGHT';
  qrCustomUrl?: string;
  productPrice?: number;
}

export default function ShortsVideoSurface({
  src,
  autoplay = true,
  muted = false,
  onMuteToggle,
  onTimeUpdate,
  onEnded,
  onSurfaceTap,
  isPaused = false,
  seekTime = null,
  layoutMode = 'FIT_BLUR',
  words = [],
  highlightColor = 'AMBER',
  fontSize = 32,
  verticalPosition = 75,
  showQrCode = false,
  qrPlacement = 'TOP_RIGHT',
  qrCustomUrl,
  productPrice,
}: ShortsVideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  const activeHighlight = HIGHLIGHT_COLORS[highlightColor] || HIGHLIGHT_COLORS.AMBER;

  // Sync isPaused
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused && !video.paused) {
      video.pause();
      setIsPlaying(false);
    } else if (!isPaused && video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPaused]);

  // Sync seekTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || seekTime === null || isNaN(seekTime)) return;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  }, [seekTime]);

  // Auto-group words into 3-word pacing chunks
  const wordChunks = useMemo(() => {
    if (!words || words.length === 0) return [];
    const chunks: { start: number; end: number; words: SubtitleWord[] }[] = [];
    const chunkSize = 3;
    for (let i = 0; i < words.length; i += chunkSize) {
      const slice = words.slice(i, i + chunkSize);
      chunks.push({
        start: slice[0].start,
        end: slice[slice.length - 1].end,
        words: slice,
      });
    }
    return chunks;
  }, [words]);

  const activeChunk = useMemo(() => {
    return wordChunks.find((c) => currentTime >= c.start - 0.05 && currentTime <= c.end + 0.15);
  }, [wordChunks, currentTime]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime, video.duration || 0);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    if (autoplay) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      setShowPlayIcon(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
    }
    onSurfaceTap?.();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={handleTap}
    >
      {/* Main High-Definition Video Surface */}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoplay}
        muted={muted}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: layoutMode === 'COVER_CROP' ? 'cover' : 'contain',
          zIndex: 2,
        }}
      />

      {/* 3. Play / Pause Center Ripple Indicator */}
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 0 30px rgba(0,0,0,0.8)',
            }}
          >
            <Play size={30} color="#fff" style={{ marginLeft: '4px' }} />
          </div>
        </div>
      )}

      {/* 4. Live Animated Kinetic Subtitle Overlay */}
      {activeChunk && (
        <div
          style={{
            position: 'absolute',
            top: `${verticalPosition}%`,
            left: '14px',
            right: '14px',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 20,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {activeChunk.words.map((w) => {
            const isWordActive = currentTime >= w.start - 0.05 && currentTime <= w.end + 0.05;
            return (
              <span
                key={w.id}
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  fontSize: `${fontSize}px`,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.5px',
                  textTransform: 'uppercase',
                  color: isWordActive ? activeHighlight.hex : '#ffffff',
                  textShadow: isWordActive
                    ? `0 0 20px ${activeHighlight.glow}, 0 4px 12px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000`
                    : '0 4px 10px rgba(0,0,0,0.95), 2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000',
                  transform: isWordActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                  transition: 'transform 0.08s ease-out, color 0.08s ease-out',
                  display: 'inline-block',
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      )}

      {/* 5. Ambient Micro-Scrubber Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            background: activeHighlight.hex,
            boxShadow: `0 0 8px ${activeHighlight.glow}`,
          }}
        />
      </div>
    </div>
  );
}
