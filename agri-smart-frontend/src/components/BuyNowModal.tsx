import React, { useState } from 'react';
import { X, Package, Loader2, ShoppingCart } from 'lucide-react';

export interface BuyNowListing {
  listing_id: string;
  quantity: number;
  ai_grade: string;
  quality_score: number;
  price_per_kg: number | string;
  image_url?: string;
  product?: {
    product_id?: string;
    name: string;
    category?: string;
    description?: string;
    image_url?: string;
    latest_price?: number | string | null;
  };
  farmer?: {
    farm_name?: string;
    user?: { email?: string; phone?: string };
  };
}

export interface BuyNowModalProps {
  listing: BuyNowListing;
  onClose: () => void;
  onConfirm: (listingId: string, quantity: number) => Promise<void>;
}

export default function BuyNowModal({ listing, onClose, onConfirm }: BuyNowModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxQty = listing.quantity;
  const pricePerKg = Number(listing.price_per_kg);
  const total = (pricePerKg * quantity).toFixed(2);

  const gradeColor =
    listing.ai_grade === 'A'
      ? { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
      : listing.ai_grade === 'B'
      ? { bg: '#fefce8', text: '#a16207', border: '#fde68a' }
      : { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(listing.listing_id, quantity);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-sm overflow-hidden animate-scale-in"
        style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(22,163,74,0.10)',
          border: '1px solid rgba(22,163,74,0.10)',
        }}
      >
        {/* Header */}
        <div
          className="relative px-5 py-5"
          style={{ borderBottom: '1px solid rgba(22,163,74,0.08)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:bg-slate-100"
            style={{ color: '#94a3b8', background: '#f8fafc' }}
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-black text-gray-900">Confirm Order</h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>
            Review details before placing your order
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Product summary */}
          <div
            className="flex items-center gap-3.5 p-3.5 rounded-2xl"
            style={{ background: '#f8fafc', border: '1px solid rgba(22,163,74,0.08)' }}
          >
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt={listing.product?.name}
                className="w-16 h-16 rounded-2xl object-cover shrink-0"
                style={{ border: '1px solid #e2e8f0' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
              >
                <Package className="w-7 h-7" style={{ color: '#86efac' }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900 truncate">{listing.product?.name ?? 'Produce'}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>
                by {listing.farmer?.user?.email ?? 'Verified Farmer'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                  style={{ background: gradeColor.bg, color: gradeColor.text, borderColor: gradeColor.border }}
                >
                  Grade {listing.ai_grade}
                </span>
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  {Number(listing.quality_score).toFixed(1)}% quality
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold" style={{ color: '#64748b' }}>Price per kg</span>
            <span className="text-sm font-black" style={{ color: '#16a34a' }}>
              Rs. {pricePerKg.toFixed(2)}
            </span>
          </div>

          {/* Quantity selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
              Quantity (kg)
            </label>
            <div className="relative">
              <input
                id="buy-now-qty"
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= maxQty) setQuantity(v);
                }}
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900 pr-16 transition-all"
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid rgba(22,163,74,0.14)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#94a3b8' }}>
                / {maxQty} kg
              </span>
            </div>
            <p className="text-[11px] font-medium mt-1.5 ml-1" style={{ color: '#94a3b8' }}>
              Max available: {maxQty} kg
            </p>
          </div>

          {/* Total estimate */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}
          >
            <span className="text-sm font-bold" style={{ color: '#166534' }}>Estimated Total</span>
            <span className="text-xl font-black" style={{ color: '#15803d' }}>Rs. {total}</span>
          </div>

          <p className="text-[11px] font-medium leading-relaxed" style={{ color: '#94a3b8' }}>
            The farmer will be notified and must accept your order. After acceptance, they will
            upload a live photo for AI re-grading. The final price may change slightly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all hover:bg-slate-100"
            style={{ border: '1.5px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}
          >
            Cancel
          </button>
          <button
            id="confirm-order-btn"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 8px 20px rgba(22,163,74,0.28)',
            }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Placing…</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Confirm Order</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
