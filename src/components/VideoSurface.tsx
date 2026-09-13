import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

interface VideoSurfaceProps {
  src?: string;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onSurfaceTap?: () => void;
  isPaused?: boolean;
  seekTime?: number | null;
}

export default function VideoSurface({
  src,
  isLive = false,
  autoplay = true,
  muted = false,
  onTimeUpdate,
  onEnded,
  onSurfaceTap,
  isPaused = false,
  seekTime = null,
}: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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


    </div>
  );
}
