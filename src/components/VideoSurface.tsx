import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

interface VideoSurfaceProps {
  src?: string;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onMuteToggle?: (isMuted: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onSurfaceTap?: () => void;
  isPaused?: boolean;
  seekTime?: number | null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function VideoSurface({
  src,
  isLive = false,
  autoplay = true,
  muted = false,
  onMuteToggle,
  onTimeUpdate,
  onEnded,
  onSurfaceTap,
  isPaused = false,
  seekTime = null,
}: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrubberTrackRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; time: number; pct: number } | null>(null);

  // Sync external isPaused prop
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

  // Sync external muted prop
  useEffect(() => {
    const video = videoRef.current;
    if (video && muted !== undefined) {
      video.muted = muted;
      setIsMuted(muted);
    }
  }, [muted]);

  // Sync external seekTime prop
  useEffect(() => {
    const video = videoRef.current;
    if (video && seekTime !== null && seekTime !== undefined) {
      video.currentTime = seekTime;
      setCurrentTime(seekTime);
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [seekTime]);

  // Initialize HLS or Native VOD source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHlsStream = src.includes('.m3u8') || isLive;

    if (isHlsStream) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) {
            video.play().catch(() => {
              // Browser autoplay policy muted fallback
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = src;
        if (autoplay) {
          video.play().catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        }
      }
    } else {
      // Standard MP4 / WebM VOD
      video.src = src;
      if (autoplay) {
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isLive, autoplay]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    if (onTimeUpdate) onTimeUpdate(cur, dur);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSurfaceClick = () => {
    if (onSurfaceTap) {
      onSurfaceTap();
    } else {
      togglePlay();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (onMuteToggle) {
      onMuteToggle(nextMuted);
    }
  };

  // Option A Ghost Ambient Scrubber Seek Calculations
  const calculateSeekTime = (clientX: number): { time: number; pct: number } => {
    if (!scrubberTrackRef.current || duration <= 0) return { time: 0, pct: 0 };
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = rect.width > 0 ? clampedX / rect.width : 0;
    const time = pct * duration;
    return { time, pct: pct * 100 };
  };

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingScrubber(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    const { time, pct } = calculateSeekTime(e.clientX);
    setHoverPosition({ x: e.clientX, time, pct });
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
      if (onTimeUpdate) onTimeUpdate(time, duration);
    }
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const { time, pct } = calculateSeekTime(e.clientX);
    setHoverPosition({ x: e.clientX, time, pct });
    if (isDraggingScrubber) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        setCurrentTime(time);
        if (onTimeUpdate) onTimeUpdate(time, duration);
      }
    }
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingScrubber(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="player-container"
      onClick={handleSurfaceClick}
    >
      <video
        ref={videoRef}
        className="video-element"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
      />

      {/* Floating Sound Toggle Icon (Original DigitPop Sound Glyph) */}
      <button
        type="button"
        className={`dp-sound-toggle-btn ${isMuted ? 'muted' : 'unmuted'}`}
        style={isLive ? { left: '160px' } : undefined}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        title={isMuted ? 'Click to unmute' : 'Click to mute'}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
      >
        <img
          src={isMuted ? '/assets/images/muted_icon.svg' : '/assets/images/speaker_icon.svg'}
          alt={isMuted ? 'Muted' : 'Sound On'}
          className="dp-sound-status-icon"
        />
        {isMuted && <span className="dp-sound-label">UNMUTE</span>}
      </button>

      {/* Center Play Beacon when paused */}
      {!isPlaying && (
        <button
          type="button"
          className="icon-btn"
          style={{
            position: 'absolute',
            width: '64px',
            height: '64px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            border: '2px solid rgba(255,255,255,0.2)',
            zIndex: 32,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <Play size={28} color="#fff" style={{ marginLeft: '4px' }} />
        </button>
      )}

      {/* Option A: Ghost Ambient Scrubber (Ultra-Minimalist seek bar) */}
      {!isLive && duration > 0 && (
        <div
          ref={scrubberTrackRef}
          className={`dp-ambient-scrubber-zone ${isHoveringScrubber || isDraggingScrubber ? 'active' : ''}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handleScrubberPointerDown}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
          onPointerEnter={() => setIsHoveringScrubber(true)}
          onPointerLeave={() => {
            if (!isDraggingScrubber) {
              setIsHoveringScrubber(false);
              setHoverPosition(null);
            }
          }}
          title="Drag or click to seek"
        >
          {/* Floating Time Pill Tooltip on Hover/Scrub */}
          {(isHoveringScrubber || isDraggingScrubber) && hoverPosition && (
            <div
              className="dp-scrubber-tooltip"
              style={{
                left: `${Math.max(4, Math.min(96, hoverPosition.pct))}%`,
              }}
            >
              <span>{formatTime(hoverPosition.time)}</span>
              <span className="dp-scrubber-tooltip-divider">/</span>
              <span className="dp-scrubber-tooltip-dur">{formatTime(duration)}</span>
            </div>
          )}

          {/* Scrubber Track Line */}
          <div className="dp-ambient-track">
            {/* Played Progress Bar */}
            <div
              className="dp-ambient-progress"
              style={{ width: `${Math.max(0, Math.min(100, (currentTime / duration) * 100))}%` }}
            >
              <div className="dp-ambient-thumb" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
