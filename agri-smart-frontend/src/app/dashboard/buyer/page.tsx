'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  MapPin,
  Loader2,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Package,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardNav from '@/components/DashboardNav';
import StatCard from '@/components/StatCard';
import ChatModal from '@/components/ChatModal';

interface Product {
  product_id: string;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  latest_price?: number | string | null;
}

interface OrderItem {
  order_id: string;
  quantity: number;
  status: string;
  created_at: string;
  product?: Product;
  farmer?: {
    farm_name?: string;
    user?: {
      email?: string;
      phone?: string;
    };
  };
  ai_report?: {
    ai_grade: string;
    quality_score: number;
    final_price: number | string;
    image_url?: string;
  };
}

interface Listing {
  listing_id: string;
  quantity: number;
  ai_grade: string;
  quality_score: number;
  price_per_kg: number | string;
  image_url?: string;
  product?: Product;
  farmer?: {
    farm_name?: string;
    user?: { email?: string };
  };
}

// ─── Buy-Now Confirmation Modal ────────────────────────────────────────────────
interface BuyNowModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: (listingId: string, quantity: number) => Promise<void>;
}

function BuyNowModal({ listing, onClose, onConfirm }: BuyNowModalProps) {
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
            className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
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
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BuyerDashboard() {
  const { user, session, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [buyerStats, setBuyerStats] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const [buyNowListing, setBuyNowListing] = useState<Listing | null>(null);

  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number | ''>('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  const fetchStats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const statsRes = await fetch(`${API_URL}/dashboard/buyer/stats/${user.id}`);
      if (statsRes.ok) setBuyerStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching buyer stats:', err);
    }
  }, [API_URL, user?.id]);

  const fetchOrders = React.useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    try {
      const ordersRes = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (ordersRes.ok) setMyOrders(await ordersRes.json());
    } catch (err) {
      console.error('Error fetching my orders:', err);
    }
  }, [API_URL, user?.id, session?.access_token]);

  const fetchListings = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/listings`);
      if (res.ok) setListings(await res.json());
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  }, [API_URL]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch(`${API_URL}/products`);
        if (productsRes.ok) setProducts(await productsRes.json());
        await Promise.all([fetchListings(), fetchStats(), fetchOrders()]);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setFetching(false);
      }
    };
    if (user?.id) fetchData();
  }, [API_URL, user?.id, fetchStats, fetchOrders, fetchListings]);

  if (loading) return <LoadingScreen />;

  const name = profile?.full_name?.split(' ')[0] ?? 'Buyer';
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProductId || !orderQuantity) return;
    setCreatingOrder(true);
    setOrderMessage(null);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          product_id: orderProductId,
          quantity: Number(orderQuantity),
          latitude: 6.9271,
          longitude: 79.8612,
        }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      setOrderMessage({
        type: 'success',
        text: 'Order created! Smart matching is finding the best farmer for you.',
      });
      setOrderProductId('');
      setOrderQuantity('');
      await Promise.all([fetchStats(), fetchOrders()]);
    } catch (err) {
      console.error(err);
      setOrderMessage({ type: 'error', text: 'Failed to create order. Please try again.' });
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleConfirmBuyNow = async (listingId: string, quantity: number) => {
    if (!user?.id) return;
    const res = await fetch(`${API_URL}/listings/${listingId}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ buyer_id: user.id, quantity }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to place order');
    }
    setOrderMessage({
      type: 'success',
      text: '✅ Order sent! The farmer has been notified and will accept or reject shortly.',
    });
    await Promise.all([fetchStats(), fetchOrders(), fetchListings()]);
  };

  const gradeStyleFor = (grade: string) =>
    grade === 'A'
      ? { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
      : grade === 'B'
      ? { bg: '#fefce8', text: '#a16207', border: '#fde68a' }
      : { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fffe 40%, #edf9f2 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <DashboardNav title="Buyer Marketplace" subtitle={`Hi, ${name}`} />

      <main className="flex-1 px-4 py-6 sm:px-6 max-w-screen-lg mx-auto w-full space-y-8">

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
          <StatCard icon="🛒" label="Cart Items" value={buyerStats?.cartItems?.toString() ?? '0'} sub="Ready to order" accent />
          <StatCard icon="📦" label="Active Orders" value={buyerStats?.activeOrders?.toString() ?? '0'} sub="In transit" />
          <StatCard icon="💸" label="Total Spent" value={`Rs. ${buyerStats?.totalSpent?.toFixed(2) ?? '0.00'}`} sub="This month" />
          <StatCard icon="⭐" label="Avg Grade" value={buyerStats?.avgGrade ?? 'N/A'} sub="Purchased" />
        </div>

        {/* ===== ORDER MESSAGE ===== */}
        {orderMessage && (
          <div
            className="p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-fade-in"
            style={orderMessage.type === 'success'
              ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
              : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
            }
          >
            {orderMessage.type === 'success'
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />
            }
            <span className="flex-1">{orderMessage.text}</span>
            <button
              className="p-1 rounded-lg transition-colors"
              onClick={() => setOrderMessage(null)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ===== CREATE ORDER ===== */}
        <section
          className="card p-5 sm:p-6 animate-fade-up"
          style={{
            background: '#fff',
            border: '1px solid rgba(22,163,74,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="p-2.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)' }}
            >
              <PlusCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Create Request / Order
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>
                Select a crop and quantity to start smart matching
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateOrder} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
                Product
              </label>
              <select
                value={orderProductId}
                onChange={(e) => setOrderProductId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900 transition-all"
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid rgba(22,163,74,0.14)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                required
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-36">
              <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
                Quantity (kg)
              </label>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder-gray-300 transition-all"
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid rgba(22,163,74,0.14)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                placeholder="e.g. 50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creatingOrder || !orderProductId || !orderQuantity}
              className="w-full sm:w-auto font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-white"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                boxShadow: '0 8px 20px rgba(22,163,74,0.28)',
              }}
            >
              {creatingOrder ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                'Submit Order'
              )}
            </button>
          </form>
        </section>

        {/* ===== FARMER LISTINGS ===== */}
        {listings.length > 0 && (
          <section
            className="rounded-2xl p-5 sm:p-6 animate-fade-up"
            style={{
              background: '#fff',
              border: '1px solid rgba(22,163,74,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="p-2.5 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)' }}
              >
                <ShoppingCart className="w-5 h-5" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Available Produce
                </h2>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>
                  Direct from verified farmers · AI-graded quality
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const gc = gradeStyleFor(listing.ai_grade);
                return (
                  <div key={listing.listing_id} className="product-card group">
                    <div className="relative overflow-hidden" style={{ height: 160 }}>
                      {listing.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.image_url}
                          alt={listing.product?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
                        >
                          <Package className="w-10 h-10" style={{ color: '#86efac' }} />
                        </div>
                      )}
                      <span
                        className="absolute top-3 left-3 text-[11px] font-black px-2.5 py-1 rounded-xl border"
                        style={{ background: gc.bg, color: gc.text, borderColor: gc.border, backdropFilter: 'blur(8px)' }}
                      >
                        Grade {listing.ai_grade}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-black text-gray-900 text-sm">{listing.product?.name}</h3>
                        <p className="text-xs font-medium mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                          {listing.farmer?.user?.email ?? 'Verified Farmer'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-sm font-bold">
                        <span style={{ color: '#64748b' }}>{listing.quantity} kg</span>
                        <span style={{ color: '#16a34a' }}>
                          Rs. {Number(listing.price_per_kg).toFixed(2)}/kg
                        </span>
                      </div>

                      <button
                        id={`buy-now-${listing.listing_id}`}
                        onClick={() => setBuyNowListing(listing)}
                        className="w-full font-bold py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 text-white"
                        style={{
                          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                          boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== MY ORDERS ===== */}
        <section
          className="rounded-2xl p-5 sm:p-6 animate-fade-up"
          style={{
            background: '#fff',
            border: '1px solid rgba(22,163,74,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)' }}
              >
                <Package className="w-5 h-5" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">My Orders</h2>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  {myOrders.length} order{myOrders.length !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all"
              style={{
                color: '#16a34a',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px solid #bbf7d0',
              }}
            >
              Refresh
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl space-y-4"
              style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
              >
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <p className="font-bold text-gray-700">No orders placed yet</p>
                <p className="text-sm font-medium mt-1" style={{ color: '#94a3b8' }}>
                  Browse listings above or create a request
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const isMatched = ['ACCEPTED', 'MATCHED', 'GRADED'].includes(order.status);
                const statusStyle =
                  isMatched
                    ? { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
                    : order.status === 'PENDING'
                    ? { bg: '#fefce8', text: '#a16207', border: '#fde68a' }
                    : { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };

                return (
                  <div
                    key={order.order_id}
                    className="p-4 sm:p-5 rounded-2xl transition-all"
                    style={{
                      border: '1px solid rgba(22,163,74,0.08)',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-base text-gray-900 truncate">
                          {order.product?.name ?? 'Crop Order'}
                        </p>
                        <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>
                          <span className="font-bold text-gray-700">{order.quantity} kg</span>
                          {order.created_at && (
                            <> · {new Date(order.created_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold border"
                          style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                        >
                          {order.status}
                        </span>
                        {isMatched && (
                          <button
                            onClick={() => setActiveChatOrderId(order.order_id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-white"
                            style={{
                              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                              boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                            }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PENDING */}
                    {order.status === 'PENDING' && (
                      <div
                        className="mt-3 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2"
                        style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' }}
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        Waiting for the farmer to accept your order…
                      </div>
                    )}

                    {/* Matched — AI report + farmer info */}
                    {isMatched && (
                      <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid rgba(22,163,74,0.08)' }}>
                        {order.ai_report ? (
                          <div
                            className="p-4 rounded-2xl flex items-center gap-4"
                            style={{ background: '#f8fafc', border: '1px solid rgba(22,163,74,0.08)' }}
                          >
                            {order.ai_report.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={order.ai_report.image_url}
                                alt="Live vegetable photo"
                                className="w-16 h-16 rounded-2xl object-cover shrink-0"
                                style={{ border: '1px solid #e2e8f0' }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                  AI Grade
                                </span>
                                {(() => {
                                  const gc = gradeStyleFor(order.ai_report.ai_grade);
                                  return (
                                    <span
                                      className="px-2.5 py-0.5 rounded-full text-xs font-black border"
                                      style={{ background: gc.bg, color: gc.text, borderColor: gc.border }}
                                    >
                                      {order.ai_report.ai_grade}
                                    </span>
                                  );
                                })()}
                                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                                  ({Number(order.ai_report.quality_score).toFixed(1)}%)
                                </span>
                              </div>
                              <p className="text-sm font-black" style={{ color: '#16a34a' }}>
                                Rs. {Number(order.ai_report.final_price).toFixed(2)}/kg
                              </p>
                              <p className="text-[11px] font-medium mt-1" style={{ color: '#94a3b8' }}>
                                Updated price after live photo re-grading
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2"
                            style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' }}
                          >
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            Farmer accepted. Waiting for live photo AI re-grading…
                          </div>
                        )}

                        {order.farmer && (
                          <div
                            className="text-xs font-medium flex flex-wrap items-center gap-x-4 gap-y-2 p-3.5 rounded-2xl"
                            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #f1f5f9' }}
                          >
                            <span className="font-bold text-gray-700 flex items-center gap-1.5">
                              👨‍🌾 {order.farmer.farm_name || 'Verified Farmer'}
                            </span>
                            {order.farmer.user?.email && (
                              <span className="flex items-center gap-1">
                                📧 {order.farmer.user.email}
                              </span>
                            )}
                            {order.farmer.user?.phone && (
                              <span className="flex items-center gap-1">
                                📞 {order.farmer.user.phone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== SEARCH ===== */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#94a3b8' }}
          />
          <input
            id="search-products"
            type="text"
            placeholder="Search crops, vegetables, fruits…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm text-gray-900 placeholder-gray-300 transition-all"
            style={{
              background: '#fff',
              border: '1.5px solid rgba(22,163,74,0.12)',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          />
        </div>

        {/* ===== PRODUCT GRID ===== */}
        {fetching ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22c55e' }} />
            <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>Loading produce…</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="text-center py-16 space-y-4 rounded-2xl"
            style={{
              background: '#fff',
              border: '1px solid rgba(22,163,74,0.08)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
            >
              <span className="text-4xl">🌾</span>
            </div>
            <div>
              <p className="font-black text-gray-700">
                {searchTerm ? 'No matching crops found' : 'No produce listed yet'}
              </p>
              <p className="text-sm font-medium mt-1 max-w-xs mx-auto" style={{ color: '#94a3b8' }}>
                {searchTerm
                  ? 'Try a different search term'
                  : 'Check back soon — farmers are adding new listings'}
              </p>
            </div>
          </div>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.product_id} className="product-card group">
                  <div className="relative overflow-hidden" style={{ height: 176 }}>
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
                      >
                        <span className="text-5xl opacity-50">🥦</span>
                      </div>
                    )}
                    <span
                      className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        color: '#334155',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      {product.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs flex items-center gap-1 mt-1 font-medium" style={{ color: '#94a3b8' }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        Near you
                      </p>
                    </div>

                    <div
                      className="flex justify-between items-center pt-3"
                      style={{ borderTop: '1px solid rgba(22,163,74,0.08)' }}
                    >
                      <span className="text-base font-black" style={{ color: '#16a34a' }}>
                        {product.latest_price != null
                          ? `Rs. ${Number(product.latest_price).toFixed(0)}/kg`
                          : product.description ?? '—'}
                      </span>
                      <button
                        id={`order-btn-${product.product_id}`}
                        onClick={() => {
                          setOrderProductId(product.product_id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sign out (mobile) */}
        <button
          id="sign-out-mobile"
          onClick={handleSignOut}
          className="w-full font-semibold py-3.5 rounded-2xl text-sm sm:hidden transition-all"
          style={{
            background: '#fff',
            border: '1px solid rgba(22,163,74,0.10)',
            color: '#64748b',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          Sign Out
        </button>
      </main>

      {/* Buy-Now Confirmation Modal */}
      {buyNowListing && (
        <BuyNowModal
          listing={buyNowListing}
          onClose={() => setBuyNowListing(null)}
          onConfirm={handleConfirmBuyNow}
        />
      )}

      {/* Chat Modal */}
      {activeChatOrderId && (
        <ChatModal orderId={activeChatOrderId} onClose={() => setActiveChatOrderId(null)} />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fffe 40%, #edf9f2 100%)' }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-3xl mx-auto animate-pulse-soft"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            boxShadow: '0 8px 32px rgba(22,163,74,0.35)',
          }}
        />
        <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>Loading marketplace…</p>
      </div>
    </div>
  );
}