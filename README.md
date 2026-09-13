# DigitPop Interactive Video Player (`dp-player-react`)

Next-generation AI-native interactive video player built in **React 18 + Vite 5 + TypeScript**.

## Key Capabilities
- 🎬 **Dual Video Pipeline**: Native Cloudflare R2 MP4 VOD playback + ultra-low-latency HLS.js live streaming (`/live/:id` or `?streamKey=...`).
- ⚡ **Real-Time Overlays**: Sub-10ms WebSocket synchronizer listening for `LIVE_OVERLAY_TRIGGER` events from `DigitPopMasterControl` and AI sidecar.
- 🛒 **Shoppable Modes**:
  - `SIDE_PANEL`: Slide-out glassmorphism drawer on the right/bottom edge.
  - `TAP_TO_REVEAL`: Interactive animated beacons/hotspots directly on video frames.
  - `PAUSE_INSPECT`: Canvas freeze-frame grabber with blurred background modal for detailed item examination.
- 💳 **1-Click Stripe Basket Commerce**: Multi-item bundle selection, quantity picker, instant checkout redirect.
- 🎯 **Watch-to-Earn Quiz Engine**: Embedded PopCoin verification questions awarding candidate/viewer tokens.
- 🌐 **Cross-Domain IFrame Protocol**: `window.parent.postMessage` bridge for fluid parent container responsiveness.

## Development & Build

```bash
# Install dependencies
npm install

# Start local player dev server (Port 4201)
npm run dev

# Build for production
npm run build
```
