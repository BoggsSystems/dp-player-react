import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingBag, Share2, Volume2, VolumeX } from 'lucide-react';
import VideoSurface from './components/VideoSurface';
import ShortsVideoSurface from './components/ShortsVideoSurface';
import ShortsShoppableDrawer from './components/ShortsShoppableDrawer';
import LiveBadge from './components/LiveBadge';
import ShoppableDrawer from './components/ShoppableDrawer';
import PauseInspectModal from './components/PauseInspectModal';
import AllGroupsModal from './components/AllGroupsModal';
import LiveShoppableRail from './components/LiveShoppableRail';
import { ShareModal } from './components/ShareModal';
import { useWebSocketStream } from './hooks/useWebSocketStream';
import { Project, ProductGroup, ViewingMode, Product } from './types';
import { api, OPPORTUNITY_OS_ABOUT_PROJECT, OPPORTUNITY_OS_JOB_APPLICATION_PROJECT } from './services/api';
import { CartProvider, useCart } from './context/CartContext';

function Player() {
  const { totalCount } = useCart();
  const [project, setProject] = useState<Project | null>(null);
  const [activeGroup, setActiveGroup] = useState<ProductGroup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isAllGroupsOpen, setIsAllGroupsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // View Mode: IMMERSIVE vs SPLIT_PANEL (Co-Pilot Side-by-Side)
  const [viewMode, setViewMode] = useState<'IMMERSIVE' | 'SPLIT_PANEL'>(() => {
    try {
      const stored = localStorage.getItem('dp_view_mode');
      if (stored === 'SPLIT_PANEL' || stored === 'IMMERSIVE') {
        return stored;
      }
    } catch {}
    return 'SPLIT_PANEL';
  });

  const handleModeChange = (mode: 'IMMERSIVE' | 'SPLIT_PANEL') => {
    setViewMode(mode);
    try {
      localStorage.setItem('dp_view_mode', mode);
    } catch (err) {
      console.warn('Failed to save view mode to localStorage', err);
    }
  };

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

  // Extract project ID / slug from /v/:slug, /ad/:id, ?projectId=, or ?slug=
  const vMatch = pathname.match(/\/v\/([^/?#]+)/);
  const adMatch = pathname.match(/\/ad\/([^/?#]+)/);
  const projectId = vMatch ? vMatch[1] : (adMatch ? adMatch[1] : (queryParams.get('projectId') || queryParams.get('slug') || 'demo-project-1'));

  // Parse initial timestamp from ?t=11s or ?t=11
  const tParam = queryParams.get('t');
  const initialTimestamp = useMemo(() => {
    if (!tParam) return null;
    const parsed = parseFloat(tParam.replace('s', ''));
    return isNaN(parsed) ? null : parsed;
  }, [tParam]);

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
      setIsPaused(true);
      setIsDrawerOpen(false);
    } else {
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
      const matchingGroup = project.productGroups.find((g, i) => {
        const start = g.timestampSeconds;
        const next = project.productGroups![i + 1];
        const end = next ? next.timestampSeconds : (g.endTimestampSeconds || start + 20);
        return time >= start && time < end;
      });

      if (matchingGroup && matchingGroup.id !== activeGroup?.id) {
        setActiveGroup(matchingGroup);
        if (matchingGroup.viewingMode === 'SIDE_PANEL') {
          setIsDrawerOpen(true);
        }
      }
    }
  };

  // Signature DigitPop full-surface tap handler: opens full-screen product view directly
  const handleSurfaceTap = () => {
    const groups = project?.productGroups || [];
    let target = groups.find((g, i) => {
      const start = g.timestampSeconds;
      const next = groups[i + 1];
      const end = next ? next.timestampSeconds : (g.endTimestampSeconds || start + 20);
      return currentTime >= start && currentTime < end;
    });

    if (!target) {
      target = activeGroup || groups[0];
    }
    if (target) {
      setActiveGroup(target);
    }

    // Open full multi-product collection view for the current moment
    setInspectProduct(null);
    setIsPaused(true);
    setIsInspectOpen(true);
    setIsDrawerOpen(false);
  };

  // Keyboard controls: ArrowLeft/Right seek 5s, Space play/pause, M mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newTime = Math.max(0, currentTime - 5);
        setSeekTime(newTime);
        setTimeout(() => setSeekTime(null), 100);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const duration = project?.durationSeconds || 636;
        const newTime = Math.min(duration, currentTime + 5);
        setSeekTime(newTime);
        setTimeout(() => setSeekTime(null), 100);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, project?.durationSeconds]);

  const handleResumeFromInspect = () => {
    setIsInspectOpen(false);
    setInspectProduct(null);
    setIsPaused(false);
  };

  const handleInspectProduct = (product: Product) => {
    setInspectProduct(product);
    setIsPaused(true);
    setIsInspectOpen(true);
  };

  const handleSeekAndPlay = (seconds: number) => {
    setSeekTime(seconds);
    setIsInspectOpen(false);
    setInspectProduct(null);
    setIsAllGroupsOpen(false);
    setIsDrawerOpen(false);
    setIsPaused(false);
    setTimeout(() => setSeekTime(null), 100);
  };

  const isShort = useMemo(() => {
    return Boolean(
      queryParams.get('mode') === 'short' ||
      queryParams.get('format') === 'short' ||
      queryParams.get('aspect') === '9:16' ||
      project?.isShort ||
      project?.aspectRatio === '9:16'
    );
  }, [queryParams, project]);

  // Catalog pool for product lookup and auto-resolution
  const catalogLookup = useMemo<Map<string, Product>>(() => {
    const map = new Map<string, Product>();
    // Index demo/standard project catalog items
    const demoGroups = [
      ...(OPPORTUNITY_OS_JOB_APPLICATION_PROJECT.productGroups || []),
      ...(OPPORTUNITY_OS_ABOUT_PROJECT.productGroups || []),
    ];
    for (const group of demoGroups) {
      if (group.products) {
        for (const prod of group.products) {
          if (prod && prod.id) {
            map.set(prod.id, prod);
            map.set(prod.title.toLowerCase(), prod);
          }
        }
      }
    }
    // Also index project-level products if available
    if (project?.productGroups) {
      for (const group of project.productGroups) {
        if (group.products) {
          for (const prod of group.products) {
            if (prod && prod.id) {
              map.set(prod.id, prod);
              map.set(prod.title.toLowerCase(), prod);
            }
          }
        }
      }
    }
    return map;
  }, [project]);

  // Unified list of all products belonging to this project / workspace
  const allAvailableProducts = useMemo<Product[]>(() => {
    const list: Product[] = [];
    const seen = new Set<string>();

    const addProduct = (prod: Product | null | undefined) => {
      if (!prod || !prod.id || seen.has(prod.id)) return;
      seen.add(prod.id);
      list.push(prod);
    };

    // 1. Products from canonical product groups attached to the project
    if (project?.productGroups) {
      for (const group of project.productGroups) {
        if (group.products) {
          for (const prod of group.products) {
            addProduct(prod);
          }
        }
      }
    }

    // 2. If project has a specific productTitle or productId, resolve it from catalog or add it
    if (project?.productTitle || (project as any)?.productId) {
      const matchKey = (project as any)?.productId || project?.productTitle?.toLowerCase();
      const matched = matchKey ? catalogLookup.get(matchKey) : null;
      if (matched) {
        addProduct(matched);
      } else if (project?.productTitle) {
        addProduct({
          id: (project as any)?.productId || 'short-featured-prod',
          title: project.productTitle,
          price: project.productPrice ?? 0,
          imageUrl: project.productImageUrl,
          externalUrl: project.productBuyUrl,
        } as Product);
      }
    }

    // 3. Fallback to workspace catalog items if still empty
    if (list.length === 0) {
      const defaultGroup = OPPORTUNITY_OS_JOB_APPLICATION_PROJECT.productGroups?.[0] || OPPORTUNITY_OS_ABOUT_PROJECT.productGroups?.[0];
      if (defaultGroup && defaultGroup.products) {
        for (const prod of defaultGroup.products) {
          addProduct(prod);
        }
      }
    }

    return list;
  }, [project, catalogLookup]);

  const featuredShortProduct = useMemo(() => {
    if (project?.productTitle) {
      const match = catalogLookup.get(project.productTitle.toLowerCase()) || 
                    ((project as any)?.productId ? catalogLookup.get((project as any).productId) : null);
      if (match) return match;
      return {
        id: (project as any)?.productId || 'short-featured-prod',
        title: project.productTitle,
        price: project.productPrice ?? 0,
        imageUrl: project.productImageUrl,
        externalUrl: project.productBuyUrl,
      } as Product;
    }
    if (activeGroup?.products && activeGroup.products.length > 0) {
      return activeGroup.products[0];
    }
    if (allAvailableProducts.length > 0) {
      return allAvailableProducts[0];
    }
    return null;
  }, [project, activeGroup, catalogLookup, allAvailableProducts]);

  // Tier 1: Auto-rotating hero carousel products
  const shortCarouselProducts = useMemo<Product[]>(() => {
    if (project?.carouselProductIds && project.carouselProductIds.length > 0) {
      const mapped = project.carouselProductIds
        .map((id) => allAvailableProducts.find((p) => p.id === id) || catalogLookup.get(id))
        .filter((p): p is Product => Boolean(p));
      if (mapped.length > 0) return mapped;
    }
    // If no explicit carousel sequence is defined, provide full catalog sequence
    if (allAvailableProducts.length > 1) {
      return allAvailableProducts.slice(0, 5);
    }
    if (featuredShortProduct) return [featuredShortProduct];
    return allAvailableProducts.slice(0, 3);
  }, [project?.carouselProductIds, allAvailableProducts, catalogLookup, featuredShortProduct]);

  // Tier 2: Full interactive collection tray
  const shortIncludedProducts = useMemo<Product[]>(() => {
    if (project?.includedProductIds && project.includedProductIds.length > 0) {
      const mapped = project.includedProductIds
        .map((id) => allAvailableProducts.find((p) => p.id === id) || catalogLookup.get(id))
        .filter((p): p is Product => Boolean(p));
      if (mapped.length > 0) return mapped;
    }
    return allAvailableProducts.length > 0 ? allAvailableProducts : (featuredShortProduct ? [featuredShortProduct] : []);
  }, [project?.includedProductIds, allAvailableProducts, catalogLookup, featuredShortProduct]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Determine media source URL
  const videoSourceUrl = useMemo(() => {
    const customVideoUrl = queryParams.get('videoUrl');
    if (customVideoUrl) {
      return customVideoUrl;
    }
    if (isLive) {
      return `http://${window.location.hostname || 'localhost'}:8080/live/${streamKey}.m3u8`;
    }
    return (
      project?.masterVodUrl ||
      project?.hlsManifestUrl ||
      'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_presentation.mp4'
    );
  }, [isLive, streamKey, project, queryParams]);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Main Player Surface */}
      {isShort ? (
        <div className="player-shorts-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Top Bar: Floating Unmute & Share Buttons */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              zIndex: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '20px',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                {isMuted ? <VolumeX size={14} color="#FFB800" /> : <Volume2 size={14} color="#10b981" />}
                <span>{isMuted ? 'UNMUTE' : 'SOUND ON'}</span>
              </button>
            </div>

            <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '20px',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                <Share2 size={14} color="#38bdf8" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* 9:16 Shorts Video Surface with Kinetic Captions & Fit-Blur */}
          <ShortsVideoSurface
            src={videoSourceUrl}
            autoplay
            muted={isMuted}
            onMuteToggle={(m) => setIsMuted(m)}
            onTimeUpdate={handleTimeUpdate}
            onSurfaceTap={handleSurfaceTap}
            isPaused={isPaused}
            seekTime={seekTime ?? initialTimestamp}
            layoutMode={project?.layoutMode || 'FIT_BLUR'}
            words={project?.words || []}
            highlightColor={project?.highlightColor || 'AMBER'}
            fontSize={project?.fontSize || 30}
            verticalPosition={project?.verticalPosition || 74}
            showQrCode={project?.showQrCode}
            qrPlacement={project?.qrPlacement}
            qrCustomUrl={project?.qrCustomUrl}
            productPrice={featuredShortProduct?.price}
          />

          {/* Two-Tier Rotating Hero Carousel Drawer */}
          {(featuredShortProduct || shortCarouselProducts.length > 0 || shortIncludedProducts.length > 0) && (
            <ShortsShoppableDrawer
              product={featuredShortProduct}
              carouselProducts={shortCarouselProducts}
              includedProducts={shortIncludedProducts}
              rotationSpeed={project?.carouselRotationSpeed ?? 8}
              onBuy={(p) => {
                if (p.externalUrl) {
                  window.open(p.externalUrl, '_blank', 'noopener,noreferrer');
                } else {
                  handleInspectProduct(p);
                }
              }}
            />
          )}
        </div>
      ) : viewMode === 'SPLIT_PANEL' ? (
        <div className="player-split-layout">
          {/* Left Split: Video Surface */}
          <div className="split-video-pane">
            {isLive && <LiveBadge />}
            <VideoSurface
              src={videoSourceUrl}
              isLive={isLive}
              autoplay
              muted={isMuted}
              onMuteToggle={(mutedVal) => setIsMuted(mutedVal)}
              onTimeUpdate={handleTimeUpdate}
              onSurfaceTap={handleSurfaceTap}
              isPaused={isPaused}
              seekTime={seekTime ?? initialTimestamp}
            />

            {!isPaused && !isInspectOpen && !isAllGroupsOpen && !isDrawerOpen && (
              <div
                className="shoppable-video-tutorial-container"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSurfaceTap();
                }}
                title="Click on product for more details"
              >
                <div className="shoppable-tooltip">Click on product for more details</div>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <img
                    src="/assets/images/shoppable-video-touch.svg"
                    alt="Shoppable Video"
                    className="shoppable-video-tutorial"
                  />
                  {totalCount > 0 && (
                    <span className="cart-badge">{totalCount}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Split: Live Shoppable Rail */}
          <LiveShoppableRail
            productGroup={activeGroup}
            allGroups={project?.productGroups || []}
            onInspectProduct={handleInspectProduct}
            onOpenAllGroups={() => setIsAllGroupsOpen(true)}
            onCollapseRail={() => handleModeChange('IMMERSIVE')}
          />
        </div>
      ) : (
        <div className="player-immersive-layout" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {isLive && <LiveBadge />}
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-float-share"
              onClick={() => setIsShareOpen(true)}
              title="Share Video & Deals"
              style={{
                background: 'rgba(2, 6, 23, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: '#ffffff',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <Share2 size={14} color="#38bdf8" />
              <span>Share</span>
            </button>
            <button
              type="button"
              className="btn-float-shop"
              onClick={() => handleModeChange('SPLIT_PANEL')}
              title="Open Co-Pilot Shopping Rail"
              style={{ position: 'static' }}
            >
              <ShoppingBag size={15} />
              <span>Shop</span>
            </button>
          </div>
          <VideoSurface
            src={videoSourceUrl}
            isLive={isLive}
            autoplay
            muted={isMuted}
            onMuteToggle={(mutedVal) => setIsMuted(mutedVal)}
            onTimeUpdate={handleTimeUpdate}
            onSurfaceTap={handleSurfaceTap}
            isPaused={isPaused}
            seekTime={seekTime ?? initialTimestamp}
          />
          {!isPaused && !isInspectOpen && !isAllGroupsOpen && !isDrawerOpen && (
            <div
              className="shoppable-video-tutorial-container"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceTap();
              }}
              title="Click on product for more details"
            >
              <div className="shoppable-tooltip">Click on product for more details</div>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <img
                  src="/assets/images/shoppable-video-touch.svg"
                  alt="Shoppable Video"
                  className="shoppable-video-tutorial"
                />
                {totalCount > 0 && (
                  <span className="cart-badge">{totalCount}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shoppable Slide-out Drawer */}
      <ShoppableDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productGroup={activeGroup}
        onSeekAndPlay={handleSeekAndPlay}
        onOpenAllGroups={() => setIsAllGroupsOpen(true)}
      />

      {/* Deep Inspection Modal with Full Catalog Navigation */}
      <PauseInspectModal
        isOpen={isInspectOpen}
        onResume={handleResumeFromInspect}
        onResumeToSplit={() => {
          handleModeChange('SPLIT_PANEL');
          handleResumeFromInspect();
        }}
        project={project}
        currentTime={currentTime}
        productGroup={activeGroup}
        allGroups={project?.productGroups || []}
        initialProduct={inspectProduct}
        onSelectGroup={(g) => setActiveGroup(g)}
        onSeekAndPlay={handleSeekAndPlay}
        onOpenAllGroups={() => setIsAllGroupsOpen(true)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      {/* Established DigitPop All Groups Timeline Catalog Modal */}
      <AllGroupsModal
        isOpen={isAllGroupsOpen}
        onClose={() => setIsAllGroupsOpen(false)}
        allGroups={project?.productGroups || []}
        activeGroupId={activeGroup?.id}
        onSeekAndPlay={handleSeekAndPlay}
        onSelectGroup={(g) => setActiveGroup(g)}
      />

      {/* Interactive Social Media Sharing & Embed Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        project={project}
        currentTime={currentTime}
        activeProduct={inspectProduct || activeGroup?.products?.[0]}
      />
    </main>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Player />
    </CartProvider>
  );
}
