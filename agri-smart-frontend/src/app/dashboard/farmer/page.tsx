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
  score:           string | number;
  grade:           string;
  price:           string | number;
  crop:            string;
  defectPercentage: string | number;
  metadataVerified: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  A: '#4ade80',
  B: '#fbbf24',
  C: '#f87171',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function FarmerDashboard() {
  const { user, session, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const [stream,       setStream]       = useState<MediaStream | null>(null);
  const [imageSrc,     setImageSrc]     = useState<string | null>(null);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [result,       setResult]       = useState<GradeResult | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<'home' | 'grade'>('home');

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [matchedOrders, setMatchedOrders] = useState<any[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
  const [targetOrderId, setTargetOrderId] = useState<string>('');
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Hold the real File/Blob so FormData always gets a valid Blob
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

      // Remove from matched list
      const acceptedItem = matchedOrders.find((item) => item.match_id === matchId);
      setMatchedOrders((prev) => prev.filter((item) => item.match_id !== matchId));

      if (action === 'ACCEPT') {
        // Refresh accepted orders first, then jump to Grade tab
        await fetchAcceptedOrders();
        // Pre-select the order that was just accepted
        if (acceptedItem?.order?.order_id) {
          setTargetOrderId(acceptedItem.order.order_id);
        }
        // Clear any previous grade result so the tab is fresh
        setImageSrc(null);
        setResult(null);
        setError(null);
        // Switch directly to Grade tab
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
          : 'Failed to process request. Please try again.' 
      });
      // Refresh the list if it was already matched
      if (err.message === 'This order has already been matched to someone else.') {
        fetchMatchedOrders();
      }
    } finally {
      setProcessingMatchId(null);
    }
  };

  // Auth guard and fetch stats
  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user && farmerId) {
      fetchDashboardStats();
      fetchMatchedOrders();
      fetchAcceptedOrders();
    }
  }, [user, loading, router, farmerId, activeTab]);

  // ─── Camera helpers ─────────────────────────────────────────────────────────
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

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingScreen />;

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Convert canvas to Blob for FormData compatibility
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
    // Store the original File so FormData gets a real Blob
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

  // ─── AI Grading ─────────────────────────────────────────────────────────────
  const analyzeCrop = async () => {
    // Guard: must have a valid image blob
    const imageFile = imageBlobRef.current;
    if (!imageSrc || !imageFile) {
      setError('Please select or capture an image before analyzing.');
      return;
    }

    // Guard: farmer_id is required by the backend
    if (!farmerId) {
      setError('Unable to identify your farmer account. Please log out and log in again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Log for debugging
      console.log('[AI Grading] typeof imageFile:', typeof imageFile, '| size:', (imageFile as Blob).size);

      const form = new FormData();
      // imageFile is guaranteed to be a File or Blob
      if (imageFile instanceof File) {
        form.append('file', imageFile);
      } else {
        form.append('file', imageFile, 'crop_image.jpg');
      }
      form.append('latitude', '6.9271');
      form.append('longitude', '79.8612');
      form.append('price_id', 'test-price-001');
      form.append('farmer_id', farmerId);

      const API      = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const orderIdToGrade = targetOrderId || `test-order-123`;
      const response = await fetch(`${API}/ai-grading/predict/${orderIdToGrade}`, {
        method: 'POST',
        body:   form,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const data = await response.json();

      const report = data?.report ?? data; // graceful fallback for any shape
      const aiRaw = data?.ai_raw_data ?? {};

      const rawGrade = report?.ai_grade ?? report?.grade ?? aiRaw?.grade ?? 'N/A';
      const grade    = String(rawGrade).toUpperCase().replace('GRADE ', '');

      let score = aiRaw?.score ?? report?.quality_score ?? report?.score ?? 'N/A';
      if (score === 98.5 && grade === 'C') score = aiRaw?.score ?? 0;

      const defectPercentage = aiRaw?.defect_percentage ?? report?.defect_percentage ?? 'N/A';
      const metadataVerified = report?.metadata_verified ?? aiRaw?.forensics?.has_exif ?? false;

      setResult({
        score,
        grade,
        price:           report?.final_price   ?? report?.estimated_price ?? 'N/A',
        crop:            report?.crop          ?? 'Tomato',
        defectPercentage,
        metadataVerified,
      });

      // Refresh accepted orders & stats; await stats so Recent Submissions updates
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav title="Farmer Dashboard" subtitle={`Welcome, ${name}`} />

      {/* Tab bar */}
      <div
        className="flex sticky top-[57px] z-40"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
      >
        {(['home', 'grade'] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-semibold transition-colors duration-200"
            style={{
              color:        activeTab === tab ? 'var(--green-400)'         : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--green-500)' : '2px solid transparent',
            }}
          >
            {tab === 'home' ? '🏠 Home' : '📷 Grade Produce'}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-6 max-w-screen-md mx-auto w-full">

        {/* ── HOME TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-up">

            {/* Greeting card */}
            <div
              className="glass-card p-5 relative overflow-hidden"
              style={{ borderColor: 'var(--border-focus)' }}
            >
              <div
                aria-hidden
                className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle,var(--green-500),transparent 70%)' }}
              />
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                Good day! 🌤
              </p>
              <h2 className="text-xl font-bold">Hello, {name}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Ready to grade your produce?
              </p>
              <button
                id="cta-grade-now"
                onClick={() => setActiveTab('grade')}
                className="btn-primary mt-4 text-sm"
              >
                📷 Grade Now
              </button>
            </div>

            {/* Stats – real data */}
            <section>
              <h3
                className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  icon={<Award className="w-5 h-5" />} 
                  label="Submissions"  
                  value={dashboardStats?.totalSubmissions?.toString() ?? "0"} 
                  sub={dashboardStats?.totalSubmissions ? "Total graded" : "No submissions yet"} 
                />
                <StatCard 
                  icon={<TrendingUp className="w-5 h-5" />} 
                  label="Grade A Rate" 
                  value={dashboardStats?.gradeARate != null ? `${dashboardStats?.gradeARate}%` : "—"}   
                  sub={dashboardStats?.gradeARate != null ? "Of total graded" : "No data yet"}        
                  accent 
                />
                <StatCard 
                  icon={<DollarSign className="w-5 h-5" />} 
                  label="Revenue"      
                  value={`Rs. ${dashboardStats?.revenue?.toFixed(2) ?? "0.00"}`}  
                  sub="Estimated value"       
                />
                <StatCard 
                  icon={<Package className="w-5 h-5" />} 
                  label="Open Orders"  
                  value={dashboardStats?.openOrders?.toString() ?? "0"}   
                  sub="Pending acceptance"      
                />
              </div>
            </section>

            {/* Action Feedback Banner */}
            {actionMessage && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  actionMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
                ) : (
                  <X className="w-4 h-4 flex-shrink-0 text-red-400" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Incoming Matched Orders */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Incoming Matched Orders
                  </h3>
                  <button
                    onClick={fetchMatchedOrders}
                    disabled={fetchingOrders}
                    className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    title="Refresh orders"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${fetchingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {matchedOrders.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    {matchedOrders.length} pending
                  </span>
                )}
              </div>

              {fetchingOrders ? (
                <div className="glass-card p-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                  Loading incoming orders...
                </div>
              ) : matchedOrders.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {matchedOrders.map((item: any) => {
                    const order = item.order;
                    const product = order?.product;
                    const buyer = order?.buyer;
                    const isProcessing = processingMatchId === item.match_id;

                    return (
                      <div key={item.match_id} className="glass-card p-4 flex flex-col space-y-3">
                        {/* Product & Quantity */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-400 font-bold text-lg overflow-hidden">
                              {product?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                '📦'
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{product?.name ?? 'Crop Request'}</h4>
                              <p className="text-xs text-gray-400">{product?.category ?? 'Produce'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400">
                              {order?.quantity} kg
                            </span>
                          </div>
                        </div>

                        {/* Buyer Info */}
                        <div className="text-xs space-y-1 py-2 border-t border-b border-white/5 text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold">{buyer?.user?.email ?? 'Buyer'}</span>
                            {buyer?.user?.phone && <span>• {buyer.user.phone}</span>}
                          </div>
                          {buyer?.delivery_address && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-400 break-words">{buyer.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleRespondMatch(item.match_id, 'ACCEPT')}
                            disabled={isProcessing}
                            className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" /> Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRespondMatch(item.match_id, 'REJECT')}
                            disabled={isProcessing}
                            className="flex-1 btn-outline py-2 text-xs flex items-center justify-center gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5 text-red-400" /> Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-5 text-center text-xs text-gray-400 space-y-1">
                  <p className="font-medium text-gray-300 text-sm">No pending orders</p>
                  <p>Matched buyer requests will appear here for your review.</p>
                </div>
              )}
            </section>

            {/* Recent submissions */}
            <section>
              <h3
                className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Recent Submissions
              </h3>
              {dashboardStats?.recentSubmissions?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {dashboardStats.recentSubmissions.map((sub: any) => (
                    <div key={sub.submission_id} className="glass-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{
                            background: `${GRADE_COLOR[sub.ai_grade] ?? '#fff'}22`,
                            color: GRADE_COLOR[sub.ai_grade] ?? '#fff'
                          }}
                        >
                          {sub.ai_grade}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Tomato</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">Rs. {Number(sub.final_price).toFixed(2)}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Score: {sub.quality_score}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="glass-card flex flex-col items-center justify-center py-12 gap-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Inbox className="w-10 h-10 opacity-40" />
                  <p className="text-sm font-medium">No submissions yet</p>
                  <p className="text-xs opacity-60">Grade your first produce to see it here.</p>
                  <button
                    id="cta-grade-first"
                    onClick={() => setActiveTab('grade')}
                    className="btn-outline text-xs mt-1 px-4 py-2"
                  >
                    Grade Produce
                  </button>
                </div>
              )}
            </section>

            {/* Sign out (mobile) */}
            <button
              id="sign-out-mobile"
              onClick={handleSignOut}
              className="btn-outline w-full text-sm sm:hidden"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* ── GRADE TAB ───────────────────────────────────────────────── */}
        {activeTab === 'grade' && (
          <div className="space-y-4 animate-fade-up max-w-md mx-auto">
            <div>
              <h2 className="text-lg font-bold">Crop Quality Analyzer</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Take or upload a live photo for instant AI grading.
              </p>
            </div>

            {/* Context banner – shown when arriving here after an Accept */}
            {targetOrderId && acceptedOrders.length > 0 && !result && (() => {
              const ord = acceptedOrders.find((o: any) => o.order_id === targetOrderId);
              return ord ? (
                <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Order accepted! Grading <strong>{ord.product?.name || 'Crop'}</strong>{' '}
                    ({ord.quantity} kg) — upload a live photo below.
                  </span>
                </div>
              ) : null;
            })()}

            {/* Target Order Selection */}
            {acceptedOrders.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300">Select Accepted Order to Grade:</label>
                  <select
                    value={targetOrderId}
                    onChange={(e) => setTargetOrderId(e.target.value)}
                    className="input-field w-full text-xs py-2 mt-1"
                  >
                    {acceptedOrders.map((ord: any) => (
                      <option key={ord.order_id} value={ord.order_id}>
                        {ord.product?.name || 'Crop'} - {ord.quantity}kg ({ord.order_id.substring(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>
                {targetOrderId && (
                  <button
                    onClick={() => setActiveChatOrderId(targetOrderId)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Open Chat with Buyer
                  </button>
                )}
              </div>
            )}

            {/* Camera / image card */}
            <div className="glass-card overflow-hidden">
              {!imageSrc ? (
                <div
                  className="relative aspect-[4/3] flex flex-col items-center justify-center"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {stream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                        <button
                          onClick={takeSnapshot}
                          className="bg-white text-gray-900 p-4 rounded-full shadow-lg border-4 border-gray-200 active:scale-95 transition-transform"
                        >
                          <Camera className="w-8 h-8" />
                        </button>
                      </div>
                      <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-4 w-full">
                      <div className="flex justify-center">
                        <div
                          className="p-4 rounded-full"
                          style={{ background: 'var(--surface-3)', color: 'var(--green-400)' }}
                        >
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-[220px] mx-auto">
                        <button
                          id="open-camera-btn"
                          onClick={startCamera}
                          className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" /> Open Camera
                        </button>
                        <div className="relative py-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span
                              className="px-2"
                              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                            >
                              or
                            </span>
                          </div>
                        </div>
                        <label
                          id="upload-file-label"
                          className="btn-outline w-full text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" /> Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[4/3] bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="Crop preview" className="w-full h-full object-contain" />
                  {!isAnalyzing && !result && (
                    <button
                      onClick={clearImage}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Analyze button */}
            {imageSrc && !result && (
              <button
                id="analyze-btn"
                onClick={analyzeCrop}
                disabled={isAnalyzing}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                {isAnalyzing
                  ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Analyzing…</>
                  : <><Activity    className="w-4 h-4" /> Analyze Crop Quality</>}
              </button>
            )}

            {/* Error state */}
            {error && (
              <div
                className="glass-card p-4 rounded-xl flex items-start gap-3 animate-fade-up"
                style={{ borderColor: '#f87171', background: 'rgba(248,113,113,0.08)' }}
              >
                <X className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Analysis Failed</p>
                  <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>{error}</p>
                  <button
                    onClick={() => { setError(null); setResult(null); }}
                    className="text-xs mt-2 underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div
                className="glass-card p-5 space-y-4 animate-fade-up"
                style={{ borderColor: 'var(--border-focus)' }}
              >
                {/* Header */}
                <div className="flex items-center gap-2" style={{ color: 'var(--green-400)' }}>
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Analysis Complete
                  </h3>
                </div>

                {/* Grade badge */}
                <div className="flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4"
                    style={{
                      borderColor: GRADE_COLOR[result.grade] ?? '#fff',
                      background:  `${GRADE_COLOR[result.grade] ?? '#fff'}18`,
                    }}
                  >
                    <span className="text-3xl font-black" style={{ color: GRADE_COLOR[result.grade] ?? '#fff' }}>
                      {result.grade}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Grade
                    </span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Quality Score', value: typeof result.score === 'number' ? `${result.score.toFixed(1)}%` : result.score },
                    { label: 'Defect %',      value: typeof result.defectPercentage === 'number' ? `${result.defectPercentage.toFixed(1)}%` : result.defectPercentage },
                    { label: 'Crop',          value: result.crop },
                    { label: 'Forensics',     value: result.metadataVerified ? 'Verified' : 'No EXIF Data' },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 flex flex-col justify-center items-center text-center"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {label}
                      </p>
                      <p className={`text-lg font-bold capitalize ${label === 'Forensics' && value === 'Verified' ? 'text-green-500' : label === 'Forensics' ? 'text-amber-500' : ''}`}>
                        {label === 'Forensics' && value === 'Verified' ? '✅ ' : label === 'Forensics' ? '⚠️ ' : ''}{value}
                      </p>
                    </div>
                  ))}

                  {/* Price spans full width */}
                  <div
                    className="col-span-2 rounded-xl p-3"
                    style={{
                      background: 'rgba(74,222,128,0.10)',
                      border:     '1px solid var(--border-focus)',
                    }}
                  >
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      Estimated Market Price
                    </p>
                    <p className="text-2xl font-bold gradient-text">
                      {typeof result.price === 'number'
                        ? `Rs. ${result.price.toFixed(2)}`
                        : result.price}
                    </p>
                  </div>
                </div>

                <button
                  id="analyze-another-btn"
                  onClick={clearImage}
                  className="btn-outline w-full text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" /> Analyze Another
                </button>
              </div>
            )}
          </div>
        )}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent = false,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  sub:     string;
  accent?: boolean;
}) {
  return (
    <div
      className="glass-card p-4 flex flex-col gap-2"
      style={accent ? { borderColor: 'var(--border-focus)' } : {}}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: accent ? 'rgba(74,222,128,0.15)' : 'var(--surface-2)',
          color:      accent ? 'var(--green-400)'       : 'var(--text-secondary)',
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      <p className="text-xs mt-auto" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{sub}</p>
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
