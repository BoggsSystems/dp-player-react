import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ShortsShoppableDrawerProps {
  product?: Product | null;
  onBuy?: (product: Product) => void;
}

export default function ShortsShoppableDrawer({
  product,
  onBuy,
}: ShortsShoppableDrawerProps) {
  if (!product) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '12px',
        right: '12px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 184, 0, 0.45)',
        padding: '10px 14px',
        zIndex: 45,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 184, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.title}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            objectFit: 'cover',
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0,
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
            gap: '4px',
          }}
        >
          <ShoppingBag size={11} color="#FFB800" />
          <span>⚡ Featured In Clip</span>
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginTop: '1px',
          }}
        >
          {product.title}
        </div>
        <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 800 }}>
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </div>

      <button
        onClick={() => onBuy?.(product)}
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
  );
}
