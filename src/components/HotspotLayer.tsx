import { ShoppingBag, Tag } from 'lucide-react';
import { ProductGroup } from '../types';

interface HotspotLayerProps {
  productGroup: ProductGroup | null;
  onOpenDrawer: () => void;
  onOpenInspect: () => void;
}

export default function HotspotLayer({
  productGroup,
  onOpenDrawer,
  onOpenInspect,
}: HotspotLayerProps) {
  if (!productGroup || !productGroup.products || productGroup.products.length === 0) {
    return null;
  }

  const primaryProduct = productGroup.products[0];
  const posX = productGroup.hotspotX ?? 75;
  const posY = productGroup.hotspotY ?? 35;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productGroup.viewingMode === 'PAUSE_INSPECT') {
      onOpenInspect();
    } else {
      onOpenDrawer();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 35,
      }}
    >
      <button
        type="button"
        className="hotspot-beacon"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
      >
        <ShoppingBag size={14} color="var(--accent-cyan)" />
        <span>{primaryProduct.title}</span>
        <span
          style={{
            background: 'var(--accent-emerald)',
            color: '#fff',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
          }}
        >
          ${(Number(primaryProduct.price) || 0).toFixed(2)}
        </span>
      </button>
    </div>
  );
}
