import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Zap, 
  Plus, 
  Check, 
  Clock, 
  Layers, 
  CreditCard, 
  Eye, 
  Package,
  Maximize2
} from 'lucide-react';
import { ProductGroup, Product } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface LiveShoppableRailProps {
  productGroup: ProductGroup | null;
  allGroups?: ProductGroup[];
  onInspectProduct: (product: Product) => void;
  onOpenAllGroups?: () => void;
  onCollapseRail?: () => void;
}

export default function LiveShoppableRail({
  productGroup,
  allGroups = [],
  onInspectProduct,
  onOpenAllGroups,
  onCollapseRail,
}: LiveShoppableRailProps) {
  const {
    items,
    addToCart,
    addAllToCart,
    totalCount,
    totalPrice,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAddSingle = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productGroup) return;
    addToCart(product, productGroup.id, productGroup.title || productGroup.name);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
    showToast(`Added "${product.title}" to bag`);
  };

  const handleAddAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productGroup || !productGroup.products || productGroup.products.length === 0) return;
    addAllToCart(productGroup.products, productGroup.id, productGroup.title || productGroup.name);
    showToast(`Added ${productGroup.products.length} item${productGroup.products.length === 1 ? '' : 's'} to bag`);
  };

  const handleBuyCollection = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productGroup || !productGroup.products || productGroup.products.length === 0) return;
    setIsCheckingOut(true);
    try {
      const checkoutItems = productGroup.products.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl,
        quantity: 1,
      }));
      const { checkoutUrl } = await api.createCheckout(productGroup.id, checkoutItems);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank') || (window.location.href = checkoutUrl);
      }
    } catch (err) {
      console.error('[LiveShoppableRail] Checkout failed:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCartCheckout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const checkoutItems = items.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        imageUrl: i.product.imageUrl,
        quantity: i.quantity,
      }));
      const groupId = items[0]?.groupId || productGroup?.id || 'live_cart';
      const { checkoutUrl } = await api.createCheckout(groupId, checkoutItems);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank') || (window.location.href = checkoutUrl);
      }
    } catch (err) {
      console.error('[LiveShoppableRail] Cart checkout failed:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const products = productGroup?.products || [];

  return (
    <aside className="live-shoppable-rail" aria-label="Live Shoppable Co-Pilot Rail">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="live-rail-toast">
          <Check size={14} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <header className="live-rail-header">
        <div className="live-rail-header-top">
          <div className="live-rail-header-info">
            <div className="live-rail-meta-row">
              {productGroup && (
                <span className="live-rail-time-pill" title="Playback Moment">
                  <Clock size={11} />
                  <span>
                    {formatTime(productGroup.timestampSeconds)}
                    {productGroup.endTimestampSeconds != null
                      ? ` - ${formatTime(productGroup.endTimestampSeconds)}`
                      : ''}
                  </span>
                </span>
              )}
              <span className="live-rail-count-pill">
                <Package size={11} />
                <span>{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
              </span>
            </div>
            <h2 className="live-rail-title">
              {productGroup?.title || productGroup?.name || 'Featured Collection'}
            </h2>
            {productGroup?.subtitle && (
              <p className="live-rail-subtitle">{productGroup.subtitle}</p>
            )}
          </div>

          <div className="live-rail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenAllGroups && allGroups.length > 1 && (
              <button
                type="button"
                className="live-rail-moments-btn"
                onClick={onOpenAllGroups}
                title="Browse all moments"
              >
                <Layers size={14} />
                <span>Moments</span>
              </button>
            )}
            {onCollapseRail && (
              <button
                type="button"
                className="btn-rail-collapse"
                onClick={onCollapseRail}
                title="Expand Video to Full Screen"
              >
                <Maximize2 size={13} />
                <span>Fullscreen</span>
              </button>
            )}
          </div>
        </div>

        {/* Group Actions Banner */}
        {products.length > 0 && (
          <div className="live-rail-actions-banner">
            <button
              className="btn-rail-buy-collection"
              onClick={handleBuyCollection}
              disabled={isCheckingOut}
              title="Instant 1-Click Stripe Checkout for all featured items"
            >
              <Zap size={14} className="zap-icon" />
              <span>{isCheckingOut ? 'Starting Checkout...' : '⚡ BUY COLLECTION'}</span>
            </button>
            <button
              className="btn-rail-add-all"
              onClick={handleAddAll}
              title="Add all items to shopping bag"
            >
              <Plus size={14} />
              <span>+ ADD ALL TO BAG</span>
            </button>
          </div>
        )}
      </header>

      {/* Scrollable Products List */}
      <section className="live-rail-products">
        {products.length === 0 ? (
          <div className="live-rail-empty">
            <ShoppingBag size={32} className="empty-icon" />
            <p className="empty-text">No products tagged in this moment</p>
            {onOpenAllGroups && (
              <button className="btn-rail-browse" onClick={onOpenAllGroups}>
                <Layers size={14} />
                <span>Browse All Moments</span>
              </button>
            )}
          </div>
        ) : (
          products.map((product) => {
            const isAdded = Boolean(addedItemIds[product.id]);
            return (
              <article key={product.id} className="live-rail-card">
                <div 
                  className="live-rail-thumb-container" 
                  onClick={() => onInspectProduct(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onInspectProduct(product); }}
                  title="Inspect Product Details"
                >
                  <img
                    src={product.imageUrl || '/assets/images/placeholder-product.png'}
                    alt={product.title}
                    className="live-rail-thumb"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (product.imageUrls && product.imageUrls.length > 1 && img.src !== product.imageUrls[1]) {
                        img.src = product.imageUrls[1];
                      } else {
                        img.src = '/assets/images/placeholder-product.png';
                      }
                    }}
                  />
                  <span className="live-rail-thumb-overlay">
                    <Eye size={16} />
                  </span>
                </div>

                <div className="live-rail-card-body">
                  <div className="live-rail-card-header">
                    <h3 
                      className="live-rail-card-title" 
                      onClick={() => onInspectProduct(product)}
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                    <div className="live-rail-card-price-row">
                      <span className="live-rail-card-price">${product.price.toFixed(2)}</span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="live-rail-card-compare-price">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.description && (
                    <p className="live-rail-card-desc">{product.description}</p>
                  )}

                  <div className="live-rail-card-actions">
                    <button
                      className={`btn-rail-add ${isAdded ? 'added' : ''}`}
                      onClick={(e) => handleAddSingle(product, e)}
                      title="Add to shopping bag"
                    >
                      {isAdded ? (
                        <>
                          <Check size={13} />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn-rail-inspect"
                      onClick={() => onInspectProduct(product)}
                      title="Deep product inspection and media gallery"
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Sticky Cart Footer */}
      <footer className="live-rail-cart-footer">
        {totalCount > 0 ? (
          <div className="live-rail-cart-filled">
            <div className="live-rail-cart-summary">
              <div className="live-rail-cart-pill">
                <ShoppingBag size={14} className="bag-icon" />
                <span className="cart-count-label">
                  Bag ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                </span>
              </div>
              <div className="live-rail-cart-total-val">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
            <button
              className="btn-rail-checkout"
              onClick={handleCartCheckout}
              disabled={isCheckingOut}
            >
              <CreditCard size={15} />
              <span>
                {isCheckingOut ? 'Redirecting...' : `CHECKOUT ($${totalPrice.toFixed(2)})`}
              </span>
            </button>
          </div>
        ) : (
          <div className="live-rail-cart-empty-hint">
            <ShoppingBag size={14} className="cart-empty-icon" />
            <span>Bag is empty</span>
          </div>
        )}
      </footer>
    </aside>
  );
}
