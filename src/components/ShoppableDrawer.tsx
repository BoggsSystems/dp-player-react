import { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Info, 
  Coins, 
  ExternalLink, 
  Check, 
  Sparkles,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Compass,
  Layers,
  Zap
} from 'lucide-react';
import { ProductGroup, QuizQuestion } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

interface ShoppableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup | null;
  onSeekAndPlay?: (seconds: number) => void;
  onOpenAllGroups?: () => void;
}

export default function ShoppableDrawer({
  isOpen,
  onClose,
  productGroup,
  onSeekAndPlay,
  onOpenAllGroups,
}: ShoppableDrawerProps) {
  const {
    items: cartItems,
    addToCart,
    addAllToCart,
    removeFromCart,
    updateQuantity,
    totalCount,
    subtotal,
    bundleDiscount,
    totalPrice,
  } = useCart();

  const [activeTab, setActiveTab] = useState<'buy' | 'details' | 'earn'>('buy');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeDetailPhotos, setActiveDetailPhotos] = useState<Record<string, number>>({});

  // Quiz state
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{ success: boolean; earnedTokens?: number; explanation?: string } | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'earn' && quizzes.length === 0) {
      api.getActiveQuizzes().then(setQuizzes);
    }
  }, [isOpen, activeTab, quizzes.length]);

  if (!productGroup) return null;

  const handleCartCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);
    try {
      const items = cartItems.map((item) => ({
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        imageUrl: item.product.imageUrl || item.product.imageUrls?.[0],
        quantity: item.quantity,
      }));
      const { checkoutUrl } = await api.createCheckout('global_cart', items);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (err: any) {
      alert(`Checkout error: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (selectedOption === null || quizzes.length === 0) return;
    setIsSubmittingQuiz(true);
    try {
      const currentQuiz = quizzes[0];
      const res = await api.submitQuizAnswer(currentQuiz.id, selectedOption);
      setQuizResult(res);
    } catch (err: any) {
      alert(`Quiz submission error: ${err.message}`);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <aside className={`drawer-container ${isOpen ? '' : 'closed'}`}>
      {/* Header */}
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {productGroup.title || productGroup.name || 'Shoppable Moment'}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onSeekAndPlay && (
            <button
              type="button"
              onClick={() => {
                onSeekAndPlay(productGroup.timestampSeconds);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: 'rgba(20, 184, 166, 0.2)',
                border: '1px solid var(--accent-teal, #14B8A6)',
                borderRadius: '6px',
                color: 'var(--accent-teal-light, #5EEAD4)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title={`Seek video to @ ${productGroup.timestampSeconds.toFixed(1)}s and play`}
            >
              <Compass size={12} />
              <span>Seek & Play</span>
            </button>
          )}

          {onOpenAllGroups && (
            <button
              type="button"
              onClick={() => {
                onOpenAllGroups();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="View all moments across the timeline"
            >
              <Layers size={12} />
              <span>All</span>
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close drawer"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="drawer-tabs">
        <button
          type="button"
          className={`drawer-tab-btn ${activeTab === 'buy' ? 'active' : ''}` }
          onClick={() => setActiveTab('buy')}
        >
          <ShoppingBag size={13} />
          <span>Bag {totalCount > 0 ? `(${totalCount})` : ''}</span>
        </button>
        <button
          type="button"
          className={`drawer-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={13} />
          <span>Details</span>
        </button>
        <button
          type="button"
          className={`drawer-tab-btn ${activeTab === 'earn' ? 'active' : ''}`}
          onClick={() => setActiveTab('earn')}
        >
          <Coins size={13} color="var(--accent-amber)" />
          <span>Earn Tokens</span>
        </button>
      </div>

      {/* Body */}
      <div className="drawer-body">
        {activeTab === 'buy' && (
          <>
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <div className="cart-empty-icon">
                  <ShoppingBag size={42} strokeWidth={1.5} color="var(--text-muted)" />
                </div>
                <h4 className="cart-empty-title">Your Bag is Empty</h4>
                <p className="cart-empty-subtitle">
                  Tap or click any product in the video stream to inspect and add items to your global shopping bag.
                </p>
                {productGroup && productGroup.products.length > 0 && (
                  <button
                    type="button"
                    className="btn-add-collection-to-empty-cart"
                    onClick={() => addAllToCart(productGroup.products, productGroup.id, productGroup.title || productGroup.name)}
                  >
                    <Zap size={14} color="var(--accent-amber)" />
                    <span>+ Add Current Moment ({productGroup.products.length} Items)</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cartItems.map((item) => {
                    const displayImg = item.product.imageUrl || item.product.imageUrls?.[0];
                    return (
                      <div key={item.product.id} className="product-card">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={item.product.title}
                            className="product-thumb"
                          />
                        ) : (
                          <div
                            className="product-thumb"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <ShoppingBag size={24} />
                          </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {item.product.title}
                              </div>
                              <button
                                type="button"
                                className="btn-remove-item"
                                onClick={() => removeFromCart(item.product.id)}
                                title="Remove from bag"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {item.groupTitle && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                From: {item.groupTitle}
                              </div>
                            )}

                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                              ${(Number(item.product.price) || 0).toFixed(2)}
                            </div>
                          </div>

                          {/* Quantity Controls & Line Total */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="icon-btn"
                                style={{ width: '24px', height: '24px', background: 'var(--bg-surface-elevated)' }}
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center' }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="icon-btn"
                                style={{ width: '24px', height: '24px', background: 'var(--bg-surface-elevated)' }}
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              ${((Number(item.product.price) || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Summary */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Subtotal ({totalCount} {totalCount === 1 ? 'item' : 'items'})</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>${(Number(subtotal) || 0).toFixed(2)}</span>
                  </div>

                  {bundleDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--accent-cyan)' }}>
                      <span>Bundle Discount (15%)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>-${(Number(bundleDiscount) || 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      height: '1px',
                      background: 'var(--border-subtle)',
                      margin: '4px 0',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                      ${(Number(totalPrice) || 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-checkout"
                    onClick={handleCartCheckout}
                    disabled={isCheckingOut}
                    style={{ marginTop: '8px' }}
                  >
                    <CreditCard size={16} />
                    <span>{isCheckingOut ? 'Opening Checkout...' : 'CHECKOUT WITH STRIPE'}</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {productGroup.products.map((product) => {
              const images = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
                ? product.imageUrls
                : (product.imageUrl ? [product.imageUrl] : []);
              const currentIdx = activeDetailPhotos[product.id] || 0;
              const currentImg = images[currentIdx] || images[0] || product.imageUrl;

              return (
                <div
                  key={product.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                  }}
                >
                  {currentImg && (
                    <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '10px', background: '#000' }}>
                      <img
                        src={currentImg}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'opacity 0.2s ease',
                        }}
                      />

                      {/* Photo counter */}
                      {images.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <ImageIcon size={10} />
                          <span>{currentIdx + 1}/{images.length}</span>
                        </div>
                      )}

                      {/* Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailPhotos(prev => ({
                                ...prev,
                                [product.id]: currentIdx > 0 ? currentIdx - 1 : images.length - 1
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              left: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailPhotos(prev => ({
                                ...prev,
                                [product.id]: currentIdx < images.length - 1 ? currentIdx + 1 : 0
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Micro Thumbnails row */}
                  {images.length > 1 && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveDetailPhotos(prev => ({ ...prev, [product.id]: i }))}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: `2px solid ${i === currentIdx ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            opacity: i === currentIdx ? 1 : 0.6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {product.title}
                  </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {product.description || 'Featured product in interactive showcase.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{
                      width: 'auto',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      background: 'var(--accent-emerald)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => addToCart(product, productGroup.id, productGroup.title || productGroup.name, 1)}
                  >
                    <ShoppingBag size={13} />
                    <span>+ Add to Bag</span>
                  </button>

                  {product.externalUrl && (
                    <button
                      type="button"
                      className="icon-btn"
                      style={{
                        width: 'auto',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        background: 'var(--bg-surface-elevated)',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-cyan)',
                      }}
                      onClick={() => window.open(product.externalUrl, '_blank')}
                    >
                      <ExternalLink size={12} />
                      <span>View Official Store</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {activeTab === 'earn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'var(--accent-emerald-subtle)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Coins size={20} color="var(--accent-amber)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  Watch-to-Earn Verification
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Answer the verification prompt to claim PopCoin reward credits.
                </div>
              </div>
            </div>

            {quizzes.length > 0 ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {quizzes[0].questionText}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quizzes[0].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${selectedOption === idx ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                        background: selectedOption === idx ? 'var(--accent-cyan-subtle)' : 'var(--bg-surface-elevated)',
                        color: selectedOption === idx ? '#fff' : 'var(--text-secondary)',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onClick={() => setSelectedOption(idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {quizResult ? (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: quizResult.success ? 'var(--accent-emerald-subtle)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${quizResult.success ? 'var(--accent-emerald)' : 'var(--accent-red)'}`,
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: quizResult.success ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                      {quizResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{quizResult.success ? `+${quizResult.earnedTokens || 25} PopCoins Credited!` : 'Incorrect verification'}</span>
                    </div>
                    {quizResult.explanation && (
                      <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.4 }}>
                        {quizResult.explanation}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-checkout"
                    style={{ background: 'var(--accent-cyan)' }}
                    onClick={handleQuizSubmit}
                    disabled={selectedOption === null || isSubmittingQuiz}
                  >
                    <Sparkles size={16} />
                    <span>{isSubmittingQuiz ? 'Verifying...' : 'Submit Verification'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active quizzes for this broadcast moment.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
