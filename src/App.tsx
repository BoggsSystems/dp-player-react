import { useState, useEffect, useMemo, useCallback } from 'react';
import VideoSurface from './components/VideoSurface';
import LiveBadge from './components/LiveBadge';
import HotspotLayer from './components/HotspotLayer';
import ShoppableDrawer from './components/ShoppableDrawer';
import PauseInspectModal from './components/PauseInspectModal';
import { useWebSocketStream } from './hooks/useWebSocketStream';
import { Project, ProductGroup, ViewingMode } from './types';
import { api } from './services/api';

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeGroup, setActiveGroup] = useState<ProductGroup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Parse path & search query
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const pathname = window.location.pathname;

  // Detect Live vs VOD mode
  const streamKeyParam = queryParams.get('streamKey');
  const isLive = Boolean(
    streamKeyParam ||
    pathname.startsWith('/live') ||
    pathname.startsWith('/stream')
  );

  const streamKey = streamKeyParam || 'jeff_speedrun';

  // Extract project ID from /ad/:id
  const adMatch = pathname.match(/\/ad\/([^/]+)/);
  const projectId = adMatch ? adMatch[1] : (queryParams.get('projectId') || 'demo-project-1');

  // Load project data
  useEffect(() => {
    if (!isLive) {
      api.getProject(projectId).then((data) => {
        setProject(data);
        if (data.productGroups && data.productGroups.length > 0) {
          setActiveGroup(data.productGroups[0]);
        }
      });
    }
  }, [projectId, isLive]);

  // Handle Real-Time WebSocket Overlay from Live Broadcast / Sidecar
  const handleLiveOverlay = useCallback((group: ProductGroup, mode: ViewingMode) => {
    setActiveGroup(group);

    // Cross-domain postMessage notification to parent iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DIGITPOP_OVERLAY_TRIGGER',
        productGroup: group,
        viewingMode: mode,
      }, '*');
    }

    if (mode === 'SIDE_PANEL') {
      setIsDrawerOpen(true);
      setIsInspectOpen(false);
    } else if (mode === 'PAUSE_INSPECT') {
      setIsInspectOpen(true);
      setIsDrawerOpen(false);
    } else {
      // TAP_TO_REVEAL: Keep drawer closed, show hotspot beacon
      setIsDrawerOpen(false);
      setIsInspectOpen(false);
    }
  }, []);

  useWebSocketStream({
    streamKey,
    sessionId: projectId,
    onLiveOverlay: handleLiveOverlay,
  });

  // Synchronize VOD playback timestamps with Product Groups
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    if (!isLive && project?.productGroups) {
      const matchingGroup = project.productGroups.find((g) => {
        const start = g.timestampSeconds;
        const end = g.endTimestampSeconds || start + 15;
        return time >= start && time <= end;
      });

      if (matchingGroup && matchingGroup.id !== activeGroup?.id) {
        setActiveGroup(matchingGroup);
        if (matchingGroup.viewingMode === 'SIDE_PANEL') {
          setIsDrawerOpen(true);
        }
      }
    }
  };

  // Determine media source URL
  const videoSourceUrl = useMemo(() => {
    if (isLive) {
      // Direct HLS live stream from SRS or Cloudflare Stream
      return `http://${window.location.hostname || 'localhost'}:8080/live/${streamKey}.m3u8`;
    }
    return (
      project?.hlsManifestUrl ||
      project?.masterVodUrl ||
      'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_presentation.mp4'
    );
  }, [isLive, streamKey, project]);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Live Badge */}
      {isLive && <LiveBadge />}

      {/* Core Video Player */}
      <VideoSurface
        src={videoSourceUrl}
        isLive={isLive}
        autoplay
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Hotspots & Overlays */}
      <HotspotLayer
        productGroup={activeGroup}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenInspect={() => setIsInspectOpen(true)}
      />

      {/* Shoppable Slide-out Drawer */}
      <ShoppableDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productGroup={activeGroup}
      />

      {/* Deep Inspection Modal */}
      <PauseInspectModal
        isOpen={isInspectOpen}
        onResume={() => setIsInspectOpen(false)}
        productGroup={activeGroup}
      />
    </main>
  );
}
