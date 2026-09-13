export type ViewingMode = 'SIDE_PANEL' | 'TAP_TO_REVEAL' | 'PAUSE_INSPECT';

export interface ProductVariant {
  id: string;
  name: string;
  priceDelta?: number;
  sku?: string;
  inStock?: boolean;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  stripePriceId?: string;
  variants?: ProductVariant[];
  brand?: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  timestampSeconds: number;
  endTimestampSeconds?: number;
  viewingMode: ViewingMode;
  products: Product[];
  stripePriceId?: string;
  bundleDiscountPercent?: number;
  hotspotX?: number; // percentage 0-100
  hotspotY?: number; // percentage 0-100
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  masterVodUrl?: string;
  hlsManifestUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  productGroups?: ProductGroup[];
  isActive?: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  bonusTokens?: number;
  explanation?: string;
}

export interface LiveOverlayEvent {
  type: 'LIVE_OVERLAY_TRIGGER';
  sessionId: string;
  timestampSeconds: number;
  productGroup: ProductGroup;
  viewingMode: ViewingMode;
  metadata?: Record<string, any>;
}

export interface PlayerTelemetryEvent {
  eventType: 'IMPRESSION' | 'WATCH_TIME' | 'PIN_CLICK' | 'CHECKOUT_INIT' | 'QUIZ_ANSWER';
  projectId?: string;
  sessionId?: string;
  productGroupId?: string;
  productId?: string;
  watchTimeSeconds?: number;
  metadata?: Record<string, any>;
}
