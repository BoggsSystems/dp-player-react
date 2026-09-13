import React, { useState } from 'react';
import { 
  Play, 
  ShoppingBag, 
  CreditCard, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Layers,
  Sparkles
} from 'lucide-react';
import { ProductGroup, Product } from '../types';
import { api } from '../services/api';

interface PauseInspectModalProps {
  isOpen: boolean;
  onResume: () => void;
  productGroup: ProductGroup | null;
  allGroups?: ProductGroup[];
  onSelectGroup?: (group: ProductGroup) => void;
  onSeekAndPlay?: (seconds: number) => void;
}

export default function PauseInspectModal({
  isOpen,
  onResume,
  productGroup,
  allGroups = [],
  onSelectGroup,
  onSeekAndPlay,
}: PauseInspectModalProps) {
  if (!isOpen || !productGroup) return null;

  const [showAllGroups, setShowAllGroups] = useState(false);

  // Group navigation index
  const currentIndex = allGroups.findIndex((g) => g.id === productGroup.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allGroups.length - 1;

  const handlePrevGroup = () => {
    if (hasPrevious && onSelectGroup) {
      onSelectGroup(allGroups[currentIndex - 1]);
    }
  };

  const handleNextGroup = () => {
    if (hasNext && onSelectGroup) {
      onSelectGroup(allGroups[currentIndex + 1]);
    }
  };

  const handleSeek = () => {
    if (onSeekAndPlay) {
      onSeekAndPlay(productGroup.timestampSeconds);
    }
  };

  const handleCheckout = async (productId: string) => {
    try {
      const { checkoutUrl } = await api.createCheckout(productGroup.id, [{ id: productId, quantity: 1 }]);
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    } catch (e: any) {
      alert(`Checkout error: ${e.message}`);
    }
  };

  const groupTitle = productGroup.title || productGroup.name || 'Featured Collection';
  const groupSubtitle = productGroup.subtitle || productGroup.description || 'Interactive Video Showcase';

  return (
    <div className="pause-inspect-overlay" onClick={onResume}>
      <div 
        className="inspect-card" 
        style={{ maxWidth: '600px', width: '92vw', background: 'rgba(15, 23, 42, 0.94)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {groupTitle}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {groupSubtitle} • @ {productGroup.timestampSeconds.toFixed(1)}s
              </span>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onResume}
            aria-label="Close inspection"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Group Navigator Pills */}
        {allGroups.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-canvas)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePrevGroup}
                disabled={!hasPrevious}
                style={{ opacity: hasPrevious ? 1 : 0.4, cursor: hasPrevious ? 'pointer' : 'default', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: 'none', color: '#fff' }}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAllGroups(!showAllGroups)}
                style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', background: showAllGroups ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
              >
                <Layers size={11} />
                <span>Groups ({currentIndex + 1}/{allGroups.length})</span>
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={handleNextGroup}
                disabled={!hasNext}
                style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'default', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: 'none', color: '#fff' }}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>

            {onSeekAndPlay && (
              <button
                type="button"
                onClick={handleSeek}
                style={{
                  background: 'rgba(20, 184, 166, 0.2)',
                  border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal-light)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Compass size={11} /> Seek & Play
              </button>
            )}
          </div>
        )}

        {/* All Groups Dropdown Selector (if expanded) */}
        {showAllGroups && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '140px', overflowY: 'auto', background: 'var(--bg-canvas)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {allGroups.map((g, idx) => {
              const isSelected = g.id === productGroup.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    if (onSelectGroup) onSelectGroup(g);
                    setShowAllGroups(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: isSelected ? 'var(--accent-teal)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    #{idx + 1} {g.title || g.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.8, fontSize: '10px' }}>
                    {g.timestampSeconds.toFixed(1)}s
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Product Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
          {productGroup.products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No products attached to this moment in the video.
            </div>
          ) : (
            productGroup.products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '1px solid var(--border-subtle)',
                      background: '#000',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </h4>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 6px 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description || '1-click checkout item'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      ${p.price.toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {p.externalUrl && (
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: '28px', height: '28px', background: 'var(--bg-surface-elevated)' }}
                          onClick={() => window.open(p.externalUrl, '_blank')}
                          title="Open Store Link"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-checkout"
                        style={{ width: 'auto', padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleCheckout(p.id)}
                      >
                        <CreditCard size={12} />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Resume playback */}
        <button
          type="button"
          className="btn-checkout"
          style={{ background: 'var(--accent-cyan)', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={onResume}
        >
          <Play size={15} />
          <span>Resume Video Playback</span>
        </button>
      </div>
    </div>
  );
}
