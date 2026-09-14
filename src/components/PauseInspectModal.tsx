import React, { useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, Compass, ChevronLeft, ChevronRight, Layers, ArrowUp, X, CreditCard, ShoppingBag, Zap, Check, Plus, Minus, Trash2, Columns, ExternalLink } from 'lucide-react';
import { ProductGroup, Product } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

interface PauseInspectModalProps {
  isOpen: boolean;
  onResume: () => void;
  onResumeToSplit?: () => void;
  productGroup: ProductGroup | null;
  allGroups?: ProductGroup[];
  initialProduct?: Product | null;
  onSelectGroup?: (group: ProductGroup) => void;
  onSeekAndPlay?: (seconds: number) => void;
  onOpenAllGroups?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

type ViewState = 'ProductGroup' | 'Product' | 'AllProductGroups' | 'Cart';

export default function PauseInspectModal({
  isOpen,
  onResume,
  onResumeToSplit,
  productGroup,
  allGroups = [],
  initialProduct = null,
  onSelectGroup,
  onSeekAndPlay,
  onOpenAllGroups,
  isMuted = false,
  onToggleMute,
}: PauseInspectModalProps) {
  if (!isOpen || !productGroup) return null;

  const {
    items,
    totalCount,
    subtotal,
    bundleDiscount,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    addToCart,
    addAllToCart,
  } = useCart();
  const [viewState, setViewState] = useState<ViewState>(initialProduct ? 'Product' : 'ProductGroup');
  const [previousViewState, setPreviousViewState] = useState<ViewState>('ProductGroup');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Reset to group or initialProduct view when productGroup or initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setViewState('Product');
    } else {
      setViewState('ProductGroup');
      setSelectedProduct(null);
    }
    setPreviousViewState('ProductGroup');
    setSelectedImageIndex(0);
  }, [productGroup.id, initialProduct]);

  // Group navigation index
  const currentIndex = allGroups.findIndex((g) => g.id === productGroup.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allGroups.length - 1;

  const handlePrevGroup = () => {
    if (hasPrevious && onSelectGroup) {
      onSelectGroup(allGroups[currentIndex - 1]);
      setViewState('ProductGroup');
    }
  };

  const handleNextGroup = () => {
    if (hasNext && onSelectGroup) {
      onSelectGroup(allGroups[currentIndex + 1]);
      setViewState('ProductGroup');
    }
  };

  const handleSeek = () => {
    if (onSeekAndPlay) {
      onSeekAndPlay(productGroup.timestampSeconds);
    }
  };

  const handleAllGroups = () => {
    if (onOpenAllGroups) {
      onOpenAllGroups();
    } else {
      setPreviousViewState(viewState);
      setViewState('AllProductGroups');
    }
  };

  const handleProductClick = (product: Product) => {
    setPreviousViewState(viewState);
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setViewState('Product');
  };

  const handleBackToGroup = () => {
    setViewState('ProductGroup');
    setSelectedProduct(null);
  };

  const handleToggleBag = () => {
    if (viewState === 'Cart') {
      setViewState(previousViewState);
    } else {
      setPreviousViewState(viewState);
      setViewState('Cart');
    }
  };

  const handleCartCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const groupId = items[0]?.groupId || productGroup.id;
      const checkoutItems = items.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        imageUrl: i.product.imageUrl || i.product.imageUrls?.[0],
        quantity: i.quantity,
      }));
      const { checkoutUrl } = await api.createCheckout(groupId, checkoutItems);
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    } catch (e: any) {
      alert(`Checkout error: ${e.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckoutSingle = async (product: Product) => {
    setIsCheckingOut(true);
    try {
      const { checkoutUrl } = await api.createCheckout(productGroup.id, [{
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl || product.imageUrls?.[0],
        quantity: 1,
      }]);
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    } catch (e: any) {
      alert(`Checkout error: ${e.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleBuyCollection = async () => {
    setIsCheckingOut(true);
    try {
      const items = productGroup.products.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl || p.imageUrls?.[0],
        quantity: 1,
      }));
      const { checkoutUrl } = await api.createCheckout(productGroup.id, items);
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    } catch (e: any) {
      alert(`Checkout error: ${e.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddAllToBag = () => {
    addAllToCart(productGroup.products, productGroup.id, productGroup.title || productGroup.name);
    showToast(`Added all ${productGroup.products.length} collection items to bag!`);
  };

  const handleAddSingleToBag = (product: Product) => {
    addToCart(product, productGroup.id, productGroup.title || productGroup.name, 1);
    showToast(`Added "${product.title}" to bag!`);
  };

  const handleBuyNow = (product: Product) => {
    const isExternal = product.checkoutType && product.checkoutType !== 'NATIVE_STRIPE';
    if (isExternal && product.externalUrl) {
      window.open(product.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    addToCart(product, productGroup.id, productGroup.title || productGroup.name, 1);
    setPreviousViewState('Product');
    setViewState('Cart');
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const productImages = selectedProduct
    ? (selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0
        ? selectedProduct.imageUrls
        : selectedProduct.imageUrl ? [selectedProduct.imageUrl] : [])
    : [];

  return (
    <div className="main-product-grid" onClick={(e) => e.stopPropagation()}>
      {/* Metro HUD Navigation Header */}
      <nav className="nav">
        <div className="video-player-nav">
          {/* Resume Button */}
          <button
            type="button"
            onClick={onResume}
            className="button-resume-grid button-base"
            title="Resume Video"
          >
            <div className="btn-disc">
              <Play size={20} fill="#ffffff" strokeWidth={0} />
            </div>
            <span className="btn-label">Resume</span>
          </button>

          {/* Toggle Sound */}
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="button-sound-grid button-base"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              <div className="btn-disc">
                {isMuted ? (
                  <VolumeX size={20} strokeWidth={2} color="#ffffff" />
                ) : (
                  <Volume2 size={20} strokeWidth={2} color="#ffffff" />
                )}
              </div>
              <span className="btn-label">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          )}

          {/* Split View Docking Button */}
          {onResumeToSplit && (
            <button
              type="button"
              onClick={onResumeToSplit}
              className="button-split-grid button-base"
              title="Resume in Split View (Co-Pilot Mode)"
            >
              <div className="btn-disc">
                <Columns size={20} strokeWidth={2} color="#ffffff" />
              </div>
              <span className="btn-label">Split View</span>
            </button>
          )}

          {/* Dynamic Header Title */}
          <div className="title">
            {viewState === 'ProductGroup' && (productGroup.title || productGroup.name || 'Featured Products')}
            {viewState === 'Product' && (selectedProduct?.title || 'Product Details')}
            {viewState === 'AllProductGroups' && 'All Shoppable Moments'}
            {viewState === 'Cart' && `Shopping Bag (${totalCount} item${totalCount === 1 ? '' : 's'})`}
          </div>

          {/* Action buttons depending on viewState */}
          {viewState === 'ProductGroup' && (
            <>
              {onSeekAndPlay && (
                <button
                  type="button"
                  onClick={handleSeek}
                  className="button-locate-grid button-base"
                  title="Seek and Play from this moment"
                >
                  <div className="btn-disc">
                    <Compass size={21} strokeWidth={2} color="#ffffff" />
                  </div>
                  <span className="btn-label">Seek &amp; Play</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrevGroup}
                disabled={!hasPrevious}
                className={`button-prev-grid button-base ${!hasPrevious ? 'disabled' : ''}`}
                title="Previous Group"
              >
                <div className="btn-disc">
                  <ChevronLeft size={22} strokeWidth={2.5} color="#ffffff" />
                </div>
                <span className="btn-label">Previous</span>
              </button>

              <button
                type="button"
                onClick={handleAllGroups}
                className="button-all-grid button-base"
                title="View All Product Groups"
              >
                <div className="btn-disc">
                  <Layers size={20} strokeWidth={2} color="#ffffff" />
                </div>
                <span className="btn-label">All Groups</span>
              </button>

              <button
                type="button"
                onClick={handleNextGroup}
                disabled={!hasNext}
                className={`button-next-grid button-base ${!hasNext ? 'disabled' : ''}`}
                title="Next Group"
              >
                <div className="btn-disc">
                  <ChevronRight size={22} strokeWidth={2.5} color="#ffffff" />
                </div>
                <span className="btn-label">Next</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBag}
                className="button-bag-grid button-base"
                title="Shopping Bag"
              >
                <div className="btn-disc" style={{ position: 'relative' }}>
                  <ShoppingBag size={20} strokeWidth={2} color="#ffffff" />
                  {totalCount > 0 && (
                    <span className="btn-disc-badge badge-pill">{totalCount}</span>
                  )}
                </div>
                <span className="btn-label">Bag</span>
              </button>
            </>
          )}

          {viewState === 'Product' && (
            <>
              <button
                type="button"
                onClick={handleToggleBag}
                className="button-bag-grid button-base"
                title="Shopping Bag"
              >
                <div className="btn-disc" style={{ position: 'relative' }}>
                  <ShoppingBag size={20} strokeWidth={2} color="#ffffff" />
                  {totalCount > 0 && (
                    <span className="btn-disc-badge badge-pill">{totalCount}</span>
                  )}
                </div>
                <span className="btn-label">Bag</span>
              </button>

              <button
                type="button"
                onClick={handleBackToGroup}
                className="button-up-grid button-base"
                title="Back to Group"
              >
                <div className="btn-disc">
                  <ArrowUp size={20} strokeWidth={2.5} color="#ffffff" />
                </div>
                <span className="btn-label">Back</span>
              </button>
            </>
          )}

          {viewState === 'AllProductGroups' && (
            <button
              type="button"
              onClick={handleBackToGroup}
              className="button-up-grid button-base"
              title="Back to Group"
            >
              <div className="btn-disc">
                <ArrowUp size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <span className="btn-label">Back</span>
            </button>
          )}

          {viewState === 'Cart' && (
            <button
              type="button"
              onClick={() => setViewState(previousViewState)}
              className="button-up-grid button-base"
              title="Back"
            >
              <div className="btn-disc">
                <ArrowUp size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <span className="btn-label">Back</span>
            </button>
          )}

          {/* Close HUD Button */}
          <button
            type="button"
            onClick={onResume}
            className="button-start-grid button-base"
            title="Close"
          >
            <div className="btn-disc">
              <X size={20} strokeWidth={2.5} color="#ffffff" />
            </div>
            <span className="btn-label">Close</span>
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="player-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Product Group Tile List */}
      {viewState === 'ProductGroup' && (
        <div className="pg-products-list">
          {/* Group Actions Banner */}
          {(() => {
            const groupRawTotal = productGroup.products.reduce((acc, p) => acc + (p.price || 0), 0);
            const bundleDiscountPct = productGroup.bundleDiscountPercent || (productGroup.products.length > 1 ? 15 : 0);
            const groupDiscountAmount = (groupRawTotal * bundleDiscountPct) / 100;
            const groupBundleTotal = groupRawTotal - groupDiscountAmount;

            return (
              <div className="group-actions-banner">
                <div className="group-actions-info">
                  <div className="group-actions-title">
                    <Zap size={16} color="var(--accent-amber)" />
                    <span className="group-count-text">{productGroup.products.length} Items in Collection</span>
                    {bundleDiscountPct > 0 && (
                      <span className="group-discount-pill">{bundleDiscountPct}% OFF BUNDLE</span>
                    )}
                  </div>
                  <div className="group-actions-pricing">
                    <span className="group-bundle-price">${groupBundleTotal.toFixed(2)}</span>
                    {bundleDiscountPct > 0 && (
                      <span className="group-raw-price">${groupRawTotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="group-actions-buttons">
                  <button
                    type="button"
                    className="btn-buy-collection"
                    onClick={handleBuyCollection}
                    disabled={isCheckingOut}
                  >
                    <Zap size={15} fill="#ffffff" strokeWidth={0} />
                    <span>{isCheckingOut ? 'Loading...' : '⚡ BUY COLLECTION'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-add-all"
                    onClick={handleAddAllToBag}
                  >
                    <ShoppingBag size={15} />
                    <span>+ ADD ALL TO BAG</span>
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="products-container">
            {productGroup.products.map((pt) => {
              const image = pt.imageUrl || pt.imageUrls?.[0] || '/assets/images/shoppable-video-touch.svg';
              return (
                <div
                  key={pt.id}
                  className="product-template"
                  onClick={() => handleProductClick(pt)}
                >
                  <img src={image} alt={pt.title} className="product-template-image" />
                  <span className="product-template-name">{pt.title}</span>
                  <div className="product-template-description-container">
                    <p className="product-template-description">
                      {pt.description || 'Click to inspect product details and checkout.'}
                    </p>
                  </div>
                  <div className="product-template-footer">
                    <span className="product-template-price">${pt.price?.toFixed(2)}</span>
                    <span className="product-template-action">Inspect</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Product Inspect View */}
      {viewState === 'Product' && selectedProduct && (
        <>
          <section className="product-subtitle" title={selectedProduct.brand || productGroup.title}>
            {selectedProduct.brand || productGroup.title || 'DigitPop Verified Item'}
          </section>

          <section className="product-price">
            ${selectedProduct.price?.toFixed(2)}
          </section>

          {/* Dual Actions: Dynamic Destination & Add to Bag */}
          <div className="product-dual-actions">
            {(() => {
              const checkoutType = selectedProduct.checkoutType || 'NATIVE_STRIPE';
              const isAmazon = checkoutType === 'AMAZON';
              const isShopify = checkoutType === 'SHOPIFY';
              const isExternal = checkoutType === 'EXTERNAL_LINK';
              
              let label = selectedProduct.buttonTextOverride;
              if (!label) {
                if (isAmazon) label = 'BUY ON AMAZON';
                else if (isShopify) label = 'BUY ON SHOPIFY';
                else if (isExternal) label = 'VISIT STORE';
                else label = 'BUY NOW';
              }

              return (
                <button
                  type="button"
                  className={`product-buy-now ${isAmazon ? 'destination-amazon' : ''} ${isShopify ? 'destination-shopify' : ''}`}
                  onClick={() => handleBuyNow(selectedProduct)}
                  title={label}
                >
                  {isAmazon || isShopify || isExternal ? (
                    <ExternalLink size={18} />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  <span>{label}</span>
                </button>
              );
            })()}

            <button
              type="button"
              className="product-add-to-bag"
              onClick={() => handleAddSingleToBag(selectedProduct)}
            >
              <ShoppingBag size={18} />
              <span>+ ADD TO BAG</span>
            </button>
          </div>

          <div className="product-description-panel">
            {(selectedProduct.description || 'No extended description available for this item.')
              .split('\n\n')
              .map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
          </div>

          {/* Image Iterator Container */}
          <div className="image-iterator-container">
            <img
              src={productImages[selectedImageIndex] || '/assets/images/shoppable-video-touch.svg'}
              alt={selectedProduct.title}
              className="product-main-image"
              onClick={() => {
                if (productImages.length > 1) {
                  setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
                }
              }}
              title={productImages.length > 1 ? 'Click to view next image' : undefined}
            />

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="image-nav-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
                  }}
                  title="Previous image"
                >
                  <ChevronLeft size={20} color="#ffffff" />
                </button>

                <button
                  type="button"
                  className="image-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
                  }}
                  title="Next image"
                >
                  <ChevronRight size={20} color="#ffffff" />
                </button>

                <div className="image-counter-badge">
                  {selectedImageIndex + 1} / {productImages.length}
                </div>
              </>
            )}
          </div>

          {productImages.length > 1 && (
            <div className="product-image-thumbnails">
              {productImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`product-thumbnail ${selectedImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Panoramic All Product Groups View */}
      {viewState === 'AllProductGroups' && (
        <div className="all-product-groups">
          <div className="product-groups-container">
            {allGroups.map((pg, idx) => {
              const thumb = pg.products[0]?.imageUrl || pg.products[0]?.imageUrls?.[0] || '/assets/images/shoppable-video-touch.svg';
              const isCurrent = pg.id === productGroup.id;
              return (
                <div
                  key={pg.id || idx}
                  className={`product-group-tile ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    if (onSelectGroup) onSelectGroup(pg);
                    setViewState('ProductGroup');
                  }}
                >
                  <img src={thumb} alt={pg.title || 'Product Group'} className="product-group-thumbnail" />
                  <span className="product-group-badge">{formatTime(pg.timestampSeconds)}</span>
                  <span className="product-group-title">{pg.title || pg.name || `Moment ${idx + 1}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-Screen Metro Shopping Bag View */}
      {viewState === 'Cart' && (
        <div className="cart-full-grid">
          {/* Left Column: Cart Items */}
          <div className="cart-items-column">
            {items.length === 0 ? (
              <div className="cart-empty-state">
                <div className="cart-empty-icon">
                  <ShoppingBag size={48} strokeWidth={1.5} color="rgba(255,255,255,0.3)" />
                </div>
                <h3 className="cart-empty-title">Your shopping bag is empty</h3>
                <p className="cart-empty-subtitle">
                  Browse interactive products in the video and add them to your bag.
                </p>
                <button
                  type="button"
                  className="cart-empty-btn"
                  onClick={() => setViewState(previousViewState)}
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item) => {
                  const thumb = item.product.imageUrl || item.product.imageUrls?.[0] || '/assets/images/shoppable-video-touch.svg';
                  return (
                    <div key={item.product.id} className="cart-item-card">
                      <img
                        src={thumb}
                        alt={item.product.title}
                        className="cart-item-image"
                      />
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <h4 className="cart-item-title">{item.product.title}</h4>
                          <span className="cart-item-group-tag">
                            From {item.groupTitle || 'Video Moment'}
                          </span>
                        </div>
                        <div className="cart-item-price-row">
                          <span className="cart-item-price">
                            ${item.product.price ? item.product.price.toFixed(2) : '0.00'}
                          </span>
                          {item.product.compareAtPrice && item.product.compareAtPrice > (item.product.price || 0) && (
                            <span className="cart-item-compare-price">
                              ${item.product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="cart-item-actions">
                        <div className="cart-quantity-stepper">
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            title="Decrease quantity"
                          >
                            <Minus size={14} strokeWidth={2.5} />
                          </button>
                          <span className="stepper-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            title="Increase quantity"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(item.product.id)}
                          title="Remove item"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>

              <div className="cart-summary-row">
                <span>Subtotal ({totalCount} item{totalCount === 1 ? '' : 's'})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {bundleDiscount > 0 && (
                <div className="cart-summary-row cart-discount-row">
                  <span>Bundle Savings (15%)</span>
                  <span>-${bundleDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="cart-summary-row">
                <span>Estimated Shipping</span>
                <span className="cart-free-shipping">FREE</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total-row">
                <span>Total</span>
                <span className="cart-total-amount">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                type="button"
                className="btn-stripe-checkout"
                disabled={items.length === 0 || isCheckingOut}
                onClick={handleCartCheckout}
              >
                {isCheckingOut ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCard size={18} strokeWidth={2} />
                    <span>CHECKOUT WITH STRIPE</span>
                  </>
                )}
              </button>

              <div className="cart-checkout-badges">
                <span className="badge-secure">🔒 Secure 256-Bit SSL Checkout</span>
                <span className="badge-payments">Accepts Apple Pay • Google Pay • Visa • Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
