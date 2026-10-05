'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Upload, X, CheckCircle, RefreshCcw,
  Activity, Image as ImageIcon, TrendingUp, Package,
  Award, DollarSign, Inbox, Check, MapPin, User, Loader2, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardNav from '@/components/DashboardNav';
import ChatModal from '@/components/ChatModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GradeResult {
  score: string | number;
  grade: string;
  price: string | number;
  crop: string;
  defectPercentage: string | number;
  metadataVerified: boolean;
}

const GRADE_COLOR: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
  A: { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', text: '#15803d', border: '#86efac', shadow: 'rgba(22,163,74,0.20)' },
  B: { bg: 'linear-gradient(135deg, #fefce8, #fef9c3)', text: '#a16207', border: '#fde68a', shadow: 'rgba(234,179,8,0.20)' },
  C: { bg: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', text: '#be123c', border: '#fda4af', shadow: 'rgba(225,29,72,0.20)' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function FarmerDashboard() {
  const { user, session, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'grade' | 'listings'>('home');

  const [products, setProducts] = useState<any[]>([]);
  const [listingProduct, setListingProduct] = useState('');
  const [listingQuantity, setListingQuantity] = useState('');
  const [listingImageFile, setListingImageFile] = useState<File | null>(null);
  const [isListing, setIsListing] = useState(false);
  const [listingResult, setListingResult] = useState<any>(null);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [matchedOrders, setMatchedOrders] = useState<any[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
  const [targetOrderId, setTargetOrderId] = useState<string>('');
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageBlobRef = useRef<File | Blob | null>(null);

  const name = profile?.full_name?.split(' ')[0] ?? 'Farmer';
  const farmerId = profile?.profile_id ?? profile?.id ?? user?.id;

  const fetchDashboardStats = async () => {
    if (!farmerId) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${API}/dashboard/farmer/stats/${farmerId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  };

  const fetchMatchedOrders = async () => {
    if (!farmerId) return;
    setFetchingOrders(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${API}/orders/farmer-matched/${farmerId}`, {
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMatchedOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch matched orders', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  const fetchAcceptedOrders = async () => {
    if (!farmerId) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${API}/orders/farmer-accepted/${farmerId}`, {
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAcceptedOrders(data);
        if (data.length > 0 && !targetOrderId) {
          setTargetOrderId(data[0].order_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch accepted orders', err);
    }
  };

  const handleRespondMatch = async (matchId: string, action: 'ACCEPT' | 'REJECT') => {
    setProcessingMatchId(matchId);
    setActionMessage(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const endpoint = action === 'ACCEPT' ? `/matching/accept/${matchId}` : `/matching/reject/${matchId}`;
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });

      if (response.status === 409) {
        throw new Error('This order has already been matched to someone else.');
      }

      if (!response.ok) throw new Error('Failed to respond to matched order');

      const acceptedItem = matchedOrders.find((item) => item.match_id === matchId);
      setMatchedOrders((prev) => prev.filter((item) => item.match_id !== matchId));

      if (action === 'ACCEPT') {
        await fetchAcceptedOrders();
        if (acceptedItem?.order?.order_id) {
          setTargetOrderId(acceptedItem.order.order_id);
        }
        setImageSrc(null);
        setResult(null);
        setError(null);
        setActiveTab('grade');
      } else {
        setActionMessage({ type: 'success', text: 'Order rejected.' });
      }
      fetchDashboardStats();
    } catch (err: any) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: err.message === 'This order has already been matched to someone else.'
          ? err.message
          : 'Failed to process request. Please try again.',
      });
      if (err.message === 'This order has already been matched to someone else.') {
        fetchMatchedOrders();
      }
    } finally {
      setProcessingMatchId(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${API}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (data.length > 0) setListingProduct(data[0].product_id);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user && farmerId) {
      fetchDashboardStats();
      fetchMatchedOrders();
      fetchAcceptedOrders();
      fetchProducts();
    }
  }, [user, loading, router, farmerId, activeTab]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      alert('Could not access camera. Use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  useEffect(() => () => stopCamera(), []);

  if (loading) return <LoadingScreen />;

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          imageBlobRef.current = blob;
          setImageSrc(canvas.toDataURL('image/jpeg'));
        }
      }, 'image/jpeg', 0.92);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    imageBlobRef.current = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
      setResult(null);
      setError(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageSrc(null);
    setResult(null);
    setError(null);
    imageBlobRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeCrop = async () => {
    const imageFile = imageBlobRef.current;
    if (!imageSrc || !imageFile) {
      setError('Please select or capture an image before analyzing.');
      return;
    }

    if (!farmerId) {
      setError('Unable to identify your farmer account. Please log out and log in again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const form = new FormData();
      if (imageFile instanceof File) {
        form.append('file', imageFile);
      } else {
        form.append('file', imageFile, 'crop_image.jpg');
      }
      form.append('latitude', '6.9271');
      form.append('longitude', '79.8612');
      form.append('price_id', 'test-price-001');
      form.append('farmer_id', farmerId);

      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const orderIdToGrade = targetOrderId || `test-order-123`;
      const response = await fetch(`${API}/ai-grading/predict/${orderIdToGrade}`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const report = data?.report ?? data;
      const aiRaw = data?.ai_raw_data ?? {};

      const rawGrade = report?.ai_grade ?? report?.grade ?? aiRaw?.grade ?? 'N/A';
      const grade = String(rawGrade).toUpperCase().replace('GRADE ', '');

      let score = aiRaw?.score ?? report?.quality_score ?? report?.score ?? 'N/A';
      if (score === 98.5 && grade === 'C') score = aiRaw?.score ?? 0;

      const defectPercentage = aiRaw?.defect_percentage ?? report?.defect_percentage ?? 'N/A';
      const metadataVerified = report?.metadata_verified ?? aiRaw?.forensics?.has_exif ?? false;

      setResult({
        score,
        grade,
        price: report?.final_price ?? report?.estimated_price ?? 'N/A',
        crop: report?.crop ?? 'Tomato',
        defectPercentage,
        metadataVerified,
      });

      fetchAcceptedOrders();
      await fetchDashboardStats();
    } catch (err: unknown) {
      console.error('[Farmer Dashboard] AI grading error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Analysis failed: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const tabs = [
    { key: 'home', label: '🏠', text: 'Home' },
    { key: 'grade', label: '🔬', text: 'Grade' },
    { key: 'listings', label: '🏪', text: 'Sell' },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fffe 40%, #edf9f2 100%)', backgroundAttachment: 'fixed' }}>
      <DashboardNav title="Farmer Dashboard" subtitle={`Welcome, ${name}`} />

      {/* Tab Bar */}
      <div
        className="sticky z-40"
        style={{
          top: '57px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(22,163,74,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="max-w-screen-md mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-3.5 text-sm font-bold transition-all relative flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === tab.key ? '#15803d' : '#94a3b8',
                background: activeTab === tab.key ? 'rgba(240,253,244,0.7)' : 'transparent',
              }}
            >
              <span className="text-base">{tab.label}</span>
              <span className="hidden sm:inline">{tab.text}</span>
              <span className="sm:hidden">{tab.text}</span>
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded-t-full"
                  style={{ background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-6 max-w-screen-md mx-auto w-full">

        {/* ── HOME TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-up">

            {/* Hero / Greeting Card */}
            <div className="hero-card glow-green p-6 text-white relative">
              <div className="relative z-10">
                <p className="text-green-200 text-sm mb-1 font-medium">Good day 👋</p>
                <h2 className="text-2xl font-black tracking-tight">Hello, {name}!</h2>
                <p className="text-green-100 text-sm mt-1 mb-5 font-medium">Ready to grade your produce today?</p>
                <button
                  onClick={() => setActiveTab('grade')}
                  className="font-bold text-sm px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-[0.98] inline-flex items-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: '#15803d',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Grade Now
                  <span className="text-base">→</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div>
              <p className="section-label mb-3">Overview</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Award className="w-4 h-4" />}
                  label="Submissions"
                  value={dashboardStats?.totalSubmissions?.toString() ?? "0"}
                  sub="Total graded"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Grade A Rate"
                  value={dashboardStats?.gradeARate != null ? `${dashboardStats?.gradeARate}%` : "—"}
                  sub="Of total graded"
                  accent
                />
                <StatCard
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Revenue"
                  value={`Rs. ${dashboardStats?.revenue?.toFixed(2) ?? "0.00"}`}
                  sub="Estimated value"
                />
                <StatCard
                  icon={<Package className="w-4 h-4" />}
                  label="Open Orders"
                  value={dashboardStats?.openOrders?.toString() ?? "0"}
                  sub="Pending acceptance"
                />
              </div>
            </div>

            {/* Action Message */}
            {actionMessage && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-fade-in"
                style={actionMessage.type === 'success'
                  ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                  : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
                }
              >
                {actionMessage.type === 'success'
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <X className="w-4 h-4 flex-shrink-0" />
                }
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Incoming Matched Orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="section-label">Incoming Orders</p>
                  <button
                    onClick={fetchMatchedOrders}
                    disabled={fetchingOrders}
                    className="p-1.5 rounded-xl transition-colors"
                    style={{ color: '#94a3b8' }}
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${fetchingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {matchedOrders.length > 0 && (
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)', color: '#15803d', border: '1px solid #bbf7d0' }}
                  >
                    {matchedOrders.length} pending
                  </span>
                )}
              </div>

              {fetchingOrders ? (
                <div
                  className="rounded-2xl p-8 flex items-center justify-center gap-3 text-sm font-medium"
                  style={{ background: '#fff', border: '1px solid rgba(22,163,74,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#22c55e' }} />
                  <span style={{ color: '#94a3b8' }}>Loading orders…</span>
                </div>
              ) : matchedOrders.length > 0 ? (
                <div className="space-y-3">
                  {matchedOrders.map((item: any) => {
                    const order = item.order;
                    const product = order?.product;
                    const buyer = order?.buyer;
                    const isProcessing = processingMatchId === item.match_id;

                    return (
                      <div
                        key={item.match_id}
                        className="rounded-2xl p-4 space-y-3 transition-all"
                        style={{
                          background: '#fff',
                          border: '1px solid rgba(22,163,74,0.08)',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 overflow-hidden flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}
                            >
                              {product?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{product?.name ?? 'Crop Request'}</h4>
                              <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{product?.category ?? 'Produce'}</p>
                            </div>
                          </div>
                          <span
                            className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                          >
                            {order?.quantity} kg
                          </span>
                        </div>

                        <div
                          className="text-xs space-y-2 py-3 px-3 rounded-xl"
                          style={{ background: '#f8fafc', color: '#64748b' }}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="font-medium text-gray-700">{buyer?.user?.email ?? 'Buyer'}</span>
                          </div>
                          {buyer?.delivery_address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                              <span className="break-words">{buyer.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondMatch(item.match_id, 'ACCEPT')}
                            disabled={isProcessing}
                            className="flex-1 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                              color: '#fff',
                              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                            }}
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                          </button>
                          <button
                            onClick={() => handleRespondMatch(item.match_id, 'REJECT')}
                            disabled={isProcessing}
                            className="flex-1 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Reject</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{ background: '#fff', border: '1px solid rgba(22,163,74,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div className="text-4xl mb-3 opacity-60">📭</div>
                  <p className="text-sm font-bold text-gray-700 mb-1">No pending orders</p>
                  <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Matched buyer requests will appear here.</p>
                </div>
              )}
            </div>

            {/* Accepted Orders */}
            {acceptedOrders.length > 0 && (
              <div>
                <p className="section-label mb-3">Accepted Orders</p>
                <div className="space-y-3">
                  {acceptedOrders.map((order: any) => {
                    const product = order.product;
                    const statusStyle =
                      order.status === 'GRADED'
                        ? { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
                        : order.status === 'MATCHED'
                        ? { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' }
                        : { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };

                    return (
                      <div
                        key={order.order_id}
                        className="rounded-2xl p-4 transition-all"
                        style={{
                          background: '#fff',
                          border: '1px solid rgba(22,163,74,0.08)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-green-600 overflow-hidden shrink-0"
                              style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}
                            >
                              {product?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{product?.name ?? 'Crop Order'}</h4>
                              <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>{order.quantity} kg</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold border"
                              style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                            >
                              {order.status}
                            </span>
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Submissions */}
            <div>
              <p className="section-label mb-3">Recent Submissions</p>
              {dashboardStats?.recentSubmissions?.length > 0 ? (
                <div className="space-y-2.5">
                  {dashboardStats.recentSubmissions.map((sub: any) => {
                    const gradeStyle = GRADE_COLOR[sub.ai_grade] ?? { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', shadow: 'rgba(0,0,0,0.08)' };
                    return (
                      <div
                        key={sub.submission_id}
                        className="rounded-2xl p-3.5 flex items-center justify-between transition-all"
                        style={{
                          background: '#fff',
                          border: '1px solid rgba(22,163,74,0.08)',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2"
                            style={{
                              background: gradeStyle.bg,
                              color: gradeStyle.text,
                              borderColor: gradeStyle.border,
                              boxShadow: `0 4px 12px ${gradeStyle.shadow}`,
                            }}
                          >
                            {sub.ai_grade}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">Tomato</p>
                            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                              {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">Rs. {Number(sub.final_price).toFixed(2)}</p>
                          <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Score: {sub.quality_score}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-2xl py-12 flex flex-col items-center gap-4"
                  style={{ background: '#fff', border: '1px solid rgba(22,163,74,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
                  >
                    <Inbox className="w-7 h-7" style={{ color: '#86efac' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">No submissions yet</p>
                    <p className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>Grade your first produce to see it here.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('grade')}
                    className="text-sm font-bold px-5 py-2.5 rounded-2xl transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    Grade Produce →
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full text-sm font-semibold py-3 rounded-2xl transition-all sm:hidden"
              style={{ background: '#fff', border: '1px solid rgba(22,163,74,0.10)', color: '#64748b' }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* ── GRADE TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'grade' && (
          <div className="space-y-4 max-w-md mx-auto animate-fade-up">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Crop Quality Analyzer</h2>
              <p className="text-sm font-medium mt-1" style={{ color: '#94a3b8' }}>
                Take or upload a photo for instant AI grading.
              </p>
            </div>

            {targetOrderId && acceptedOrders.length > 0 && !result && (() => {
              const ord = acceptedOrders.find((o: any) => o.order_id === targetOrderId);
              return ord ? (
                <div
                  className="p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-fade-in"
                  style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Order accepted! Grading <strong>{ord.product?.name || 'Crop'}</strong> ({ord.quantity} kg)
                  </span>
                </div>
              ) : null;
            })()}

            {acceptedOrders.length > 0 && (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: '#fff', border: '1px solid rgba(22,163,74,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Select Order to Grade</label>
                  <select
                    value={targetOrderId}
                    onChange={(e) => setTargetOrderId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm text-gray-900 transition-all"
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid rgba(22,163,74,0.14)',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    {acceptedOrders.map((ord: any) => (
                      <option key={ord.order_id} value={ord.order_id}>
                        {ord.product?.name || 'Crop'} - {ord.quantity}kg
                      </option>
                    ))}
                  </select>
                </div>
                {targetOrderId && (
                  <button
                    onClick={() => setActiveChatOrderId(targetOrderId)}
                    className="w-full font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <MessageCircle className="w-4 h-4" /> Open Chat with Buyer
                  </button>
                )}
              </div>
            )}

            {/* Camera / Image Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                border: '1px solid rgba(22,163,74,0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              {!imageSrc ? (
                <div className="relative aspect-[4/3] flex flex-col items-center justify-center" style={{ background: '#f8fffe' }}>
                  {stream ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
                        <button
                          onClick={takeSnapshot}
                          className="p-4 rounded-full shadow-lg active:scale-95 transition-transform"
                          style={{ background: '#fff', border: '2px solid #e2e8f0' }}
                        >
                          <Camera className="w-7 h-7 text-gray-900" />
                        </button>
                      </div>
                      <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 p-2 rounded-full shadow"
                        style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #e2e8f0', color: '#64748b' }}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-8 space-y-5 w-full">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                        style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)' }}
                      >
                        <ImageIcon className="w-7 h-7" style={{ color: '#16a34a' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">Upload or take a photo</p>
                        <p className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>We'll analyze it with AI instantly</p>
                      </div>
                      <div className="space-y-3 max-w-[220px] mx-auto">
                        <button
                          onClick={startCamera}
                          className="w-full font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-white"
                          style={{
                            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                            boxShadow: '0 4px 16px rgba(22,163,74,0.30)',
                          }}
                        >
                          <Camera className="w-4 h-4" /> Open Camera
                        </button>
                        <div className="relative py-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-3 font-medium" style={{ background: '#f8fffe', color: '#94a3b8' }}>or</span>
                          </div>
                        </div>
                        <label
                          className="w-full text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                          style={{
                            background: '#fff',
                            border: '1.5px solid rgba(22,163,74,0.14)',
                            color: '#16a34a',
                          }}
                        >
                          <Upload className="w-4 h-4" /> Upload Photo
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[4/3]" style={{ background: '#0f172a' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="Crop preview" className="w-full h-full object-contain" />
                  {!isAnalyzing && !result && (
                    <button
                      onClick={clearImage}
                      className="absolute top-4 right-4 p-2 rounded-full shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.92)', color: '#64748b' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {imageSrc && !result && !error && (
              <button
                onClick={analyzeCrop}
                disabled={isAnalyzing}
                className="w-full font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-white"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.30)',
                }}
              >
                {isAnalyzing
                  ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Analyzing…</>
                  : <><Activity className="w-4 h-4" /> Analyze Crop Quality</>}
              </button>
            )}

            {/* Error */}
            {error && (() => {
              const isNotTomato = error.toLowerCase().includes('does not look like a tomato')
                || error.toLowerCase().includes('not look like a tomato');
              return (
                <div
                  className="rounded-2xl overflow-hidden animate-fade-in"
                  style={{ border: '1px solid #fecaca', boxShadow: '0 4px 12px rgba(220,38,38,0.10)' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  >
                    <X className="w-4 h-4 text-white" />
                    <p className="text-sm font-bold text-white">
                      {isNotTomato ? '🍅 Not a Tomato' : 'Analysis Failed'}
                    </p>
                  </div>
                  <div className="px-5 py-4" style={{ background: '#fef2f2' }}>
                    <p className="text-sm text-red-600 break-words font-medium">{error}</p>
                    <button
                      onClick={clearImage}
                      className="mt-3 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      style={{ color: '#b91c1c', border: '1.5px solid #fecaca', background: '#fff' }}
                    >
                      Try again with a different image
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* AI Grade Result */}
            {result && (() => {
              const gradeStyle = GRADE_COLOR[result.grade] ?? { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', shadow: 'rgba(0,0,0,0.08)' };
              return (
                <div
                  className="rounded-2xl p-6 space-y-5 animate-scale-in"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(22,163,74,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                    <h3 className="text-base font-black text-gray-900">Analysis Complete</h3>
                  </div>

                  {/* Grade Badge */}
                  <div className="flex justify-center py-2">
                    <div
                      className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-4"
                      style={{
                        background: gradeStyle.bg,
                        borderColor: gradeStyle.border,
                        boxShadow: `0 12px 32px ${gradeStyle.shadow}`,
                      }}
                    >
                      <span className="text-5xl font-black" style={{ color: gradeStyle.text }}>
                        {result.grade}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: gradeStyle.text, opacity: 0.6 }}>
                        Grade
                      </span>
                    </div>
                  </div>

                  {/* Result Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Quality Score', value: typeof result.score === 'number' ? `${result.score.toFixed(1)}%` : result.score },
                      { label: 'Defect %', value: typeof result.defectPercentage === 'number' ? `${result.defectPercentage.toFixed(1)}%` : result.defectPercentage },
                      { label: 'Crop', value: result.crop },
                      { label: 'Forensics', value: result.metadataVerified ? 'Verified' : 'No EXIF Data' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-2xl p-3.5 flex flex-col items-center text-center"
                        style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                      >
                        <p className="text-[10px] uppercase tracking-wider font-black mb-1.5" style={{ color: '#94a3b8' }}>{label}</p>
                        <p className={`text-sm font-bold ${label === 'Forensics' && value === 'Verified' ? 'text-green-600' : label === 'Forensics' ? 'text-amber-500' : 'text-gray-900'}`}>
                          {label === 'Forensics' && value === 'Verified' ? '✅ ' : label === 'Forensics' ? '⚠️ ' : ''}{value}
                        </p>
                      </div>
                    ))}

                    <div
                      className="col-span-2 rounded-2xl p-5 flex flex-col items-center text-center"
                      style={{
                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-black mb-1.5" style={{ color: '#16a34a', opacity: 0.7 }}>
                        Estimated Market Price
                      </p>
                      <p className="text-2xl font-black" style={{ color: '#15803d' }}>
                        {typeof result.price === 'number' ? `Rs. ${result.price.toFixed(2)}` : result.price}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={clearImage}
                    className="w-full font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                  >
                    <RefreshCcw className="w-4 h-4" /> Analyze Another
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── LISTINGS (SELL) TAB ───────────────────────────────────────── */}
        {activeTab === 'listings' && (
          <div className="space-y-4 max-w-md mx-auto animate-fade-up">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Sell Produce</h2>
              <p className="text-sm font-medium mt-1" style={{ color: '#94a3b8' }}>
                Create an independent listing for buyers.
              </p>
            </div>

            <div
              className="rounded-2xl p-5 space-y-5"
              style={{
                background: '#fff',
                border: '1px solid rgba(22,163,74,0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2.5">
                  Vegetable Type
                </label>
                <select
                  value={listingProduct}
                  onChange={(e) => setListingProduct(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900 transition-all"
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid rgba(22,163,74,0.14)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2.5">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={listingQuantity}
                  onChange={(e) => setListingQuantity(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder-gray-300 transition-all"
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid rgba(22,163,74,0.14)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2.5">
                  Upload Photo
                </label>
                <label
                  className="block w-full px-4 py-4 rounded-2xl text-sm font-medium cursor-pointer transition-all text-center"
                  style={{
                    background: listingImageFile ? '#f0fdf4' : '#f8fafc',
                    border: `1.5px dashed ${listingImageFile ? '#22c55e' : '#d1d5db'}`,
                    color: listingImageFile ? '#15803d' : '#94a3b8',
                  }}
                >
                  {listingImageFile ? `✅ ${listingImageFile.name}` : '📷 Choose or drag photo here'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setListingImageFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={async () => {
                  if (!listingProduct || !listingQuantity || !listingImageFile) {
                    alert('Please fill all fields');
                    return;
                  }
                  setIsListing(true);
                  try {
                    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
                    const formData = new FormData();
                    formData.append('image', listingImageFile);
                    formData.append('farmer_id', farmerId);
                    formData.append('product_id', listingProduct);
                    formData.append('quantity', listingQuantity);

                    const res = await fetch(`${API}/listings/grade-and-list`, {
                      method: 'POST',
                      headers: {
                        Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                      },
                      body: formData,
                    });
                    if (!res.ok) {
                      const errText = await res.text().catch(() => res.statusText);
                      console.error('[Listing Error] Full response:', errText, 'Status:', res.status);
                      let errMsg = 'Failed to create listing';
                      try {
                        const errJson = JSON.parse(errText);
                        errMsg = errJson.message || errMsg;
                      } catch {
                        errMsg = errText;
                      }
                      throw new Error(errMsg);
                    }
                    const data = await res.json();
                    setListingResult(data);
                  } catch (err: any) {
                    console.error('[Listing Error] Catch block:', err);
                    alert(`Error: ${err.message || 'Failed to create listing'}`);
                  } finally {
                    setIsListing(false);
                  }
                }}
                disabled={isListing}
                className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-white"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.30)',
                }}
              >
                {isListing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Grade &amp; List</>}
              </button>

              {listingResult && (
                <div
                  className="p-5 rounded-2xl animate-fade-in"
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
                    <h3 className="font-black text-green-800 text-sm">Listing Created Successfully!</h3>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-widest font-black mb-1" style={{ color: '#16a34a', opacity: 0.7 }}>Grade</p>
                      <p className="text-2xl font-black text-green-700">{listingResult.ai_grade}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-widest font-black mb-1" style={{ color: '#16a34a', opacity: 0.7 }}>Price</p>
                      <p className="text-lg font-black text-green-700">Rs. {listingResult.price_per_kg}/kg</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {activeChatOrderId && (
        <ChatModal orderId={activeChatOrderId} onClose={() => setActiveChatOrderId(null)} />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={accent
          ? { background: 'linear-gradient(135deg, #d1fae5, #dcfce7)', color: '#16a34a' }
          : { background: 'linear-gradient(135deg, #f1f5f9, #f8fafc)', color: '#64748b' }
        }
      >
        {icon}
      </div>
      <p className="text-[1.6rem] font-black leading-none mb-1 tracking-tight" style={{ color: accent ? '#15803d' : '#0f172a' }}>
        {value}
      </p>
      <p className="text-xs font-semibold mb-0.5" style={{ color: accent ? '#16a34a' : '#64748b' }}>{label}</p>
      <p className="text-[11px]" style={{ color: '#94a3b8' }}>{sub}</p>
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
        <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>Loading…</p>
      </div>
    </div>
  );
}