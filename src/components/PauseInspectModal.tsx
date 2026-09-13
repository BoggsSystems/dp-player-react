import { Play, ShoppingBag, CreditCard, ExternalLink, X } from 'lucide-react';
import { ProductGroup } from '../types';
import { api } from '../services/api';

interface PauseInspectModalProps {
  isOpen: boolean;
  onResume: () => void;
  productGroup: ProductGroup | null;
}

export default function PauseInspectModal({
  isOpen,
  onResume,
  productGroup,
}: PauseInspectModalProps) {
  if (!isOpen || !productGroup) return null;

  const handleCheckout = async (productId: string) => {
    try {
      const { checkoutUrl } = await api.createCheckout(productGroup.id, [{ id: productId, quantity: 1 }]);
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    } catch (e: any) {
      alert(`Checkout error: ${e.message}`);
    }
  };

  return (
    <div className="pause-inspect-overlay">
      <div className="inspect-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {productGroup.name} (Inspection Mode)
            </h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onResume}
            aria-label="Close inspection"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          {productGroup.products.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                gap: '14px',
              }}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                    ${p.price.toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {p.externalUrl && (
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: '32px', height: '32px', background: 'var(--bg-surface-elevated)' }}
                        onClick={() => window.open(p.externalUrl, '_blank')}
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-checkout"
                      style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleCheckout(p.id)}
                    >
                      <CreditCard size={13} />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Resume playback */}
        <button
          type="button"
          className="btn-checkout"
          style={{ background: 'var(--accent-cyan)', marginTop: '8px' }}
          onClick={onResume}
        >
          <Play size={16} />
          <span>Resume Video Playback</span>
        </button>
      </div>
    </div>
  );
}
