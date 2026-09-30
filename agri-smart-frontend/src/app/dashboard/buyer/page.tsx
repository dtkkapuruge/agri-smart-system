'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, MapPin, Loader2, PlusCircle, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
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
  latest_price?: number | string | null; // Rs./kg from latest MarketPrice row
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

export default function BuyerDashboard() {
  const { user, session, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [myOrders,   setMyOrders]   = useState<OrderItem[]>([]);
  const [fetching,   setFetching]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  
  const [buyerStats, setBuyerStats] = useState<any>(null);

  // Order form state
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number | ''>('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  // Fetch stats (called on mount and after order creation)
  const fetchStats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const statsRes = await fetch(`${API_URL}/dashboard/buyer/stats/${user.id}`);
      if (statsRes.ok) setBuyerStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching buyer stats:', err);
    }
  }, [API_URL, user?.id]);

  // Fetch my orders
  const fetchOrders = React.useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    try {
      const ordersRes = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (ordersRes.ok) setMyOrders(await ordersRes.json());
    } catch (err) {
      console.error('Error fetching my orders:', err);
    }
  }, [API_URL, user?.id, session?.access_token]);

  // Fetch products, stats, and orders on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes] = await Promise.all([
          fetch(`${API_URL}/products`),
        ]);
        if (productsRes.ok) setProducts(await productsRes.json());
        await fetchStats();
        await fetchOrders();
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setFetching(false);
      }
    };
    if (user?.id) {
      fetchData();
    }
  }, [API_URL, user?.id, fetchStats, fetchOrders]);

  if (loading) return <LoadingScreen />;

  const name = profile?.full_name?.split(' ')[0] ?? 'Buyer';

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => { await signOut(); router.push('/auth/login'); };

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
          latitude: 6.9271, // default Colombo coords
          longitude: 79.8612,
        }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      setOrderMessage({ type: 'success', text: 'Order created successfully! Matching in progress.' });
      setOrderProductId('');
      setOrderQuantity('');
      // Refresh stats and orders so UI updates immediately
      await Promise.all([fetchStats(), fetchOrders()]);
    } catch (err) {
      console.error(err);
      setOrderMessage({ type: 'error', text: 'Failed to create order. Please try again.' });
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav title="Buyer Marketplace" subtitle={`Hi, ${name}`} />

      <main className="flex-1 px-4 py-6 max-w-screen-lg mx-auto w-full space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="🛒" label="Cart Items"     value={buyerStats?.cartItems?.toString() ?? "0"}     sub="Ready to order" accent />
          <StatCard icon="📦" label="Active Orders"  value={buyerStats?.activeOrders?.toString() ?? "0"}     sub="In transit" />
          <StatCard icon="💸" label="Total Spent"    value={`Rs. ${buyerStats?.totalSpent?.toFixed(2) ?? "0.00"}`} sub="This month" />
          <StatCard icon="⭐" label="Avg Grade"      value={buyerStats?.avgGrade ?? "N/A"}     sub="Purchased" />
        </div>

        {/* Create Request / Order Form */}
        <section className="glass-card p-6 border-l-4" style={{ borderColor: 'var(--green-500)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold">Create Request / Order</h2>
          </div>
          <form onSubmit={handleCreateOrder} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Product</label>
              <select
                value={orderProductId}
                onChange={(e) => setOrderProductId(e.target.value)}
                className="input-field w-full"
                required
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Quantity (kg)</label>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value ? Number(e.target.value) : '')}
                className="input-field w-full"
                placeholder="e.g. 50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={creatingOrder || !orderProductId || !orderQuantity}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {creatingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Order'}
            </button>
          </form>

          {orderMessage && (
            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${orderMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {orderMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {orderMessage.text}
            </div>
          )}
        </section>

        {/* My Orders Section */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold">My Orders</h2>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="text-xs text-green-600 hover:underline font-semibold flex items-center gap-1"
            >
              Refresh
            </button>
          </div>

          {myOrders.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No orders placed yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => {
                const isMatched = ['ACCEPTED', 'MATCHED', 'GRADED'].includes(order.status);
                const statusColor =
                  isMatched
                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                    : order.status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/20';

                return (
                  <div
                    key={order.order_id}
                    className="p-4 rounded-xl border flex flex-col space-y-3"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-base">{order.product?.name ?? 'Crop Order'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Quantity: <span className="font-medium text-foreground">{order.quantity} kg</span>
                          {order.created_at && ` • ${new Date(order.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                          {order.status}
                        </span>
                        {isMatched && (
                          <button
                            onClick={() => setActiveChatOrderId(order.order_id)}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Chat
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Grade & Farmer Info Section if Matched/Accepted */}
                    {isMatched && (
                      <div className="pt-3 border-t border-white/5 space-y-3">
                        {/* AI Report Box */}
                        {order.ai_report ? (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {order.ai_report.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={order.ai_report.image_url}
                                  alt="Live vegetable photo"
                                  className="w-12 h-12 rounded-lg object-cover border border-green-500/30"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 font-semibold">AI Grade:</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-black ${
                                    order.ai_report.ai_grade === 'A'
                                      ? 'bg-green-500 text-black'
                                      : order.ai_report.ai_grade === 'B'
                                      ? 'bg-amber-400 text-black'
                                      : 'bg-red-500 text-white'
                                  }`}>
                                    Grade {order.ai_report.ai_grade}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    ({Number(order.ai_report.quality_score).toFixed(1)}%)
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-green-400 mt-1">
                                  Final Price: Rs. {Number(order.ai_report.final_price).toFixed(2)}/kg
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Market price × {order.ai_report.ai_grade === 'A' ? '1.0' : order.ai_report.ai_grade === 'B' ? '0.8' : '0.5'} ({order.ai_report.ai_grade} grade)
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                            ⏳ Farmer has accepted the order. Waiting for live photo AI grading upload...
                          </div>
                        )}

                        {/* Farmer Info */}
                        {order.farmer && (
                          <div className="text-xs text-gray-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="font-semibold text-gray-200">
                              👨‍🌾 Farmer: {order.farmer.farm_name || 'Verified Farmer'}
                            </span>
                            {order.farmer.user?.email && (
                              <span>Contact: {order.farmer.user.email}</span>
                            )}
                            {order.farmer.user?.phone && (
                              <span>Phone: {order.farmer.user.phone}</span>
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

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="search-products"
            type="text"
            placeholder="Search crops, vegetables, fruits…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* Product grid */}
        {fetching ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-500)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading produce…
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state (no products yet or search yielded nothing) */
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🌾</p>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'No matching crops found.' : 'No produce listed yet.'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Check back soon — farmers are adding new listings.
            </p>
          </div>
        ) : (
          <section>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              {filteredProducts.length} listing{filteredProducts.length !== 1 ? 's' : ''} found
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const productName = product.name;
                return (
                  <div
                    key={product.product_id}
                    className="glass-card overflow-hidden hover:scale-[1.01] transition-transform duration-200"
                  >
                    {/* Image */}
                    <div
                      className="h-40 flex items-center justify-center text-3xl overflow-hidden"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🥦</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm leading-tight">{productName}</h3>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#6b8a7a22', color: '#6b8a7a' }}
                        >
                          {product.category}
                        </span>
                      </div>

                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        Near you
                      </p>

                      <div
                        className="flex justify-between items-center pt-2 mt-2"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <span className="text-sm font-bold" style={{ color: 'var(--green-500)' }}>
                          {product.latest_price != null
                            ? `Rs. ${Number(product.latest_price).toFixed(0)}/kg`
                            : product.description ?? ''}
                        </span>
                        <button
                          id={`order-btn-${product.product_id}`}
                          onClick={() => {
                            setOrderProductId(product.product_id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Sign out (mobile) */}
        <button
          id="sign-out-mobile"
          onClick={handleSignOut}
          className="btn-outline w-full text-sm sm:hidden"
        >
          Sign Out
        </button>
      </main>

      {/* Chat Modal */}
      {activeChatOrderId && (
        <ChatModal
          orderId={activeChatOrderId}
          onClose={() => setActiveChatOrderId(null)}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div
          className="w-12 h-12 rounded-2xl mx-auto animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  );
}