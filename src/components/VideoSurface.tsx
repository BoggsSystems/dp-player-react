import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoSurfaceProps {
  src?: string;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export default function VideoSurface({
  src,
  isLive = false,
  autoplay = true,
  muted = false,
  onTimeUpdate,
  onEnded,
}: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

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

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive || !videoRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const newTime = clickRatio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      className="player-container"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="video-element"
        playsInline
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
      />

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

      {/* Controls Overlay */}
      <div
        className={`controls-overlay ${showControls ? '' : 'hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber (only in VOD mode) */}
        {!isLive && duration > 0 && (
          <div className="scrubber-track" onClick={handleScrubberClick}>
            <div
              className="scrubber-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="scrubber-thumb" />
            </div>
          </div>
        )}

        {/* Control Buttons Row */}
        <div className="controls-row">
          <div className="controls-group">
            <button
              type="button"
              className="icon-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} color="var(--accent-red)" /> : <Volume2 size={18} />}
            </button>

            {!isLive ? (
              <span className="time-readout">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            ) : (
              <span className="time-readout" style={{ color: 'var(--accent-emerald)' }}>
                ● Synchronized Stream
              </span>
            )}
          </div>

          <div className="controls-group">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
