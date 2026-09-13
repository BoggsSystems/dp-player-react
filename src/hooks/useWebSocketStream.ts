import { useEffect, useRef, useState } from 'react';
import { ProductGroup, ViewingMode } from '../types';

interface UseWebSocketStreamProps {
  streamKey?: string;
  sessionId?: string;
  onLiveOverlay?: (productGroup: ProductGroup, viewingMode: ViewingMode) => void;
}

export function useWebSocketStream({
  streamKey,
  sessionId,
  onLiveOverlay,
}: UseWebSocketStreamProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<{
    productGroup: ProductGroup;
    viewingMode: ViewingMode;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname || 'localhost'}:9000`;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Subscribe to stream session channel
          const payload = {
            action: 'subscribe',
            streamKey: streamKey || 'jeff_speedrun',
            sessionId: sessionId || 'default',
          };
          ws.send(JSON.stringify(payload));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'LIVE_OVERLAY_TRIGGER' && data.productGroup) {
              const mode: ViewingMode = data.viewingMode || data.productGroup.viewingMode || 'SIDE_PANEL';
              setActiveOverlay({
                productGroup: data.productGroup,
                viewingMode: mode,
              });
              if (onLiveOverlay) {
                onLiveOverlay(data.productGroup, mode);
              }
            }
          } catch (err) {
            // Ignore non-json frames
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Attempt auto reconnect after 3 seconds
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimerRef.current = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [streamKey, sessionId, onLiveOverlay]);

  return { isConnected, activeOverlay, setActiveOverlay };
}
