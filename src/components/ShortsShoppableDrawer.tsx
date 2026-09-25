import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, X, ExternalLink, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface ShortsShoppableDrawerProps {
  product?: Product | null;
  carouselProducts?: Product[];
  includedProducts?: Product[];
  rotationSpeed?: number;
  onBuy?: (product: Product) => void;
  onInspect?: (product: Product) => void;
  isDesktopExpanded?: boolean;
  onToggleDesktopExpand?: () => void;
}

export default function ShortsShoppableDrawer({
  product,
  carouselProducts = [],
  includedProducts = [],
  rotationSpeed = 8,
  onBuy,
  onInspect,
  isDesktopExpanded = false,
  onToggleDesktopExpand,
}: ShortsShoppableDrawerProps) {
  // Normalize effective carousel products list
  const activeProducts = useMemo<Product[]>(() => {
    if (carouselProducts.length > 0) return carouselProducts;
    if (product) return [product];
    if (includedProducts.length > 0) return includedProducts;
    return [];
  }, [carouselProducts, product, includedProducts]);

  const allCatalogProducts = useMemo<Product[]>(() => {
    if (includedProducts.length > 0) return includedProducts;
    if (activeProducts.length > 0) return activeProducts;
    if (product) return [product];
    return [];
  }, [includedProducts, activeProducts, product]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);

  // Auto-rotating timer
  useEffect(() => {
    if (rotationSpeed <= 0 || activeProducts.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeProducts.length);
    }, rotationSpeed * 1000);

    return () => clearInterval(interval);
  }, [rotationSpeed, activeProducts.length]);

  if (activeProducts.length === 0 && !product) return null;

  const currentProduct = activeProducts[activeIndex % activeProducts.length] || activeProducts[0] || product;
  if (!currentProduct) return null;

  const handleDrawerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // On desktop/tablet, toggle the expanded side-by-side shopping pane
    if (window.innerWidth >= 768 && onToggleDesktopExpand) {
      onToggleDesktopExpand();
    } else if (allCatalogProducts.length > 1) {
      setIsCatalogOpen(true);
    } else {
      onBuy?.(currentProduct);
    }
  };

  const handleBuyClick = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (prod.externalUrl) {
      window.open(prod.externalUrl, '_blank', 'noopener,noreferrer');
    }
    onBuy?.(prod);
  };

  return (
    <>
      {/* Tier 1: Animated Rotating Hero Drawer */}
      <div
        onClick={handleDrawerClick}
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 184, 0, 0.55)',
          padding: '10px 14px',
          zIndex: 45,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(255, 184, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentProduct.imageUrl && (
            <img
              key={currentProduct.id}
              src={currentProduct.imageUrl}
              alt={currentProduct.title}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                objectFit: 'cover',
                background: '#000',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
                animation: 'fadeIn 0.25s ease-out',
              }}
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '9.5px',
                color: '#FFB800',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShoppingBag size={11} color="#FFB800" />
                <span>⚡ Featured In Clip</span>
                {activeProducts.length > 1 && (
                  <span style={{ opacity: 0.8, fontWeight: 700, marginLeft: '2px' }}>
                    ({activeIndex + 1}/{activeProducts.length})
                  </span>
                )}
              </div>

              {allCatalogProducts.length > 1 && (
                <span
                  style={{
                    fontSize: '9px',
                    color: '#38BDF8',
                    textTransform: 'none',
                    letterSpacing: 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '1px 6px',
                    borderRadius: '8px',
                  }}
                >
                  Tap for all <ChevronRight size={10} />
                </span>
              )}
            </div>

            <div
              key={`title-${currentProduct.id}`}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                marginTop: '1px',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {currentProduct.title}
            </div>

            <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 800 }}>
              ${typeof currentProduct.price === 'number' ? currentProduct.price.toFixed(2) : currentProduct.price}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => handleBuyClick(e, currentProduct)}
            style={{
              background: 'linear-gradient(135deg, #FFB800, #F59E0B)',
              color: '#0b1120',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(255, 184, 0, 0.4)',
              transition: 'transform 0.15s ease, filter 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            1-Click Buy
          </button>
        </div>

        {/* Live Pagination Indicators (● ○ ○) */}
        {activeProducts.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              paddingTop: '2px',
            }}
          >
            {activeProducts.map((p, idx) => {
              const isDotActive = idx === (activeIndex % activeProducts.length);
              return (
                <button
                  key={`dot-${p.id}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  style={{
                    width: isDotActive ? '16px' : '5px',
                    height: '4px',
                    borderRadius: '2px',
                    background: isDotActive ? 'var(--accent-amber, #FFB800)' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  title={p.title}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Tier 2: Interactive Slide-Up Collection Modal Sheet */}
      {isCatalogOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsCatalogOpen(false);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 15, 29, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Sheet Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '12px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="#FFB800" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                    Products In This Video ({allCatalogProducts.length})
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Tap any item to view details or checkout
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Products List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {allCatalogProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={(e) => handleBuyClick(e, prod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 184, 0, 0.5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  {prod.imageUrl && (
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        background: '#000',
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {prod.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 800 }}>
                      ${typeof prod.price === 'number' ? prod.price.toFixed(2) : prod.price}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleBuyClick(e, prod)}
                    style={{
                      background: 'rgba(255, 184, 0, 0.18)',
                      border: '1px solid rgba(255, 184, 0, 0.4)',
                      color: '#FFB800',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Buy</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
