'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShoppingBag,
  Layers,
  MessageCircle,
  Award,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Loader2,
  UserCheck,
  Check,
  X
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import DashboardNav from '@/components/DashboardNav';
import ChatModal, { ChatMessage } from '@/components/ChatModal';
import BuyNowModal, { BuyNowListing } from '@/components/BuyNowModal';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';

// Mock sample listing for BuyNowModal preview
const DEMO_LISTING: BuyNowListing = {
  listing_id: 'lst-demo-101',
  quantity: 150,
  ai_grade: 'A',
  quality_score: 96.5,
  price_per_kg: 380,
  image_url: '',
  product: {
    product_id: 'prod-01',
    name: 'Export Quality Greenhouse Tomatoes',
    category: 'Vegetables',
  },
  farmer: {
    farm_name: 'Green Horizon Farm',
    user: { email: 'farmer.kamal@agrismart.local', phone: '+94 77 987 6543' },
  },
};

// Mock sample chat messages for ChatModal preview
const DEMO_MESSAGES: ChatMessage[] = [
  {
    message_id: 'msg-1',
    sender_id: 'farmer-user-id',
    sender_role: 'farmer',
    text: 'Hello! I have harvested 150kg of Grade A tomatoes this morning. All AI quality checks passed.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    message_id: 'msg-2',
    sender_id: 'me',
    sender_role: 'buyer',
    text: 'Wonderful! Can you confirm if delivery can be arranged to the Colombo warehouse tomorrow morning?',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    message_id: 'msg-3',
    sender_id: 'farmer-user-id',
    sender_role: 'farmer',
    text: 'Yes, transport is scheduled for 8:00 AM. I will upload final departure photos right before dispatch.',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

export default function DevComponentsShowcase() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_BACKDOOR !== 'true') {
    notFound();
  }

  const { devRole, setDevRole } = useAuth();

  // Active category filter
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Interactive Chat Modal state
  const [showChatModal, setShowChatModal] = useState(false);

  // Interactive BuyNowModal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buySuccessNotice, setBuySuccessNotice] = useState<string | null>(null);

  // Interactive AI Grading Card State
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C'>('A');

  // Interactive StatCard playground state
  const [playgroundLabel, setPlaygroundLabel] = useState('Total Harvest');
  const [playgroundValue, setPlaygroundValue] = useState('2,450 kg');
  const [playgroundSub, setPlaygroundSub] = useState('+18% vs last week');
  const [playgroundAccent, setPlaygroundAccent] = useState(true);

  // Categories
  const categories = [
    { id: 'all', label: 'All Components' },
    { id: 'nav', label: 'Navigation & Headers' },
    { id: 'stats', label: 'Stat & Metric Cards' },
    { id: 'modals', label: 'Chat & Order Modals' },
    { id: 'grading', label: 'AI Grading & Listings' },
    { id: 'orders', label: 'Order Workflows' },
    { id: 'admin', label: 'Admin Forensics' },
    { id: 'tokens', label: 'Form Controls & Tokens' },
  ];

  const handleSimulateRole = (role: UserRole) => {
    if (setDevRole) {
      setDevRole(role);
    }
  };

  const gradeDetails = {
    A: {
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#86efac',
      score: 96.4,
      crop: 'Greenhouse Tomatoes',
      defect: 2.1,
      price: 'Rs. 420.00 / kg',
      verified: true,
      summary: 'Optimal ripeness, high firmness, zero fungal blemishes.',
    },
    B: {
      color: '#a16207',
      bg: '#fefce8',
      border: '#fde68a',
      score: 79.2,
      crop: 'Organic Carrots',
      defect: 11.5,
      price: 'Rs. 280.00 / kg',
      verified: true,
      summary: 'Acceptable size consistency, minor superficial curvature.',
    },
    C: {
      color: '#be123c',
      bg: '#fff1f2',
      border: '#fda4af',
      score: 54.0,
      crop: 'Red Potatoes',
      defect: 26.8,
      price: 'Rs. 165.00 / kg',
      verified: false,
      summary: 'Irregular skin texture and moderate surface scabbing detected.',
    },
  }[selectedGrade];

  return (
    <div className="min-h-screen bg-[#f4fbf6] text-gray-900 pb-24">
      {/* ─── Top Dev Announcement Banner ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-900 via-gray-950 to-emerald-950 text-white px-4 py-3 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <strong className="tracking-wide uppercase text-emerald-400 font-black">
              Development UI Backdoor
            </strong>
            <span className="text-gray-400">· Isolated UI Sandbox & Component Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Quick Jump:</span>
            <Link
              href="/dashboard/farmer"
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-600 transition-colors text-[11px] font-semibold"
            >
              Farmer Dashboard
            </Link>
            <Link
              href="/dashboard/buyer"
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-600 transition-colors text-[11px] font-semibold"
            >
              Buyer Dashboard
            </Link>
            <Link
              href="/dashboard/admin"
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-600 transition-colors text-[11px] font-semibold"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Header & Category Filter ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-600/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    AgriSmart UI Component Library
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Catalog of all interactive components, modals, stat widgets, and styling tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Role Simulation Quick Strip */}
            <div className="flex items-center gap-2 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-500/15">
              <span className="text-[11px] font-bold text-emerald-800 px-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                Role:
              </span>
              {(['farmer', 'buyer', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleSimulateRole(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    devRole === r
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-emerald-100 text-gray-700 border border-emerald-200/50'
                  }`}
                >
                  {r}
                </button>
              ))}
              {devRole && (
                <button
                  onClick={() => setDevRole && setDevRole(null)}
                  className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                  title="Clear simulated session"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === c.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white hover:bg-emerald-50 text-gray-600 border border-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* SECTION 1: DashboardNav Previews */}
        {(activeCategory === 'all' || activeCategory === 'nav') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                1. Dashboard Navigation Header (`DashboardNav.tsx`)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sticky header showing brand logo, role title, contextual subtitle, profile initials avatar, and sign-out action.
              </p>
            </div>

            <div className="space-y-4 rounded-3xl bg-white p-5 border border-emerald-600/10 shadow-xs">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Farmer Variant</p>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <DashboardNav title="Farmer Dashboard" subtitle="Manage crops, AI grading & matched orders" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Buyer Variant</p>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <DashboardNav title="Buyer Marketplace" subtitle="Verified agricultural produce & real-time chat" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Variant</p>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <DashboardNav title="Admin Overview" subtitle="Platform metrics & AI forensics" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: StatCard Showcase & Interactive Playground */}
        {(activeCategory === 'all' || activeCategory === 'stats') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                2. Metric & Statistics Card (`StatCard.tsx`)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Displays core operational KPIs with gradient icon containers, typography scaling, and subtle/accent variants.
              </p>
            </div>

            {/* Static Variations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Award className="w-5 h-5 text-emerald-600" />}
                label="Quality Grade"
                value="Grade A"
                sub="Top 5% Harvest"
                accent={true}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-slate-600" />}
                label="Estimated Revenue"
                value="Rs. 184,500"
                sub="+12.4% this month"
                accent={false}
              />
              <StatCard
                icon="🍅"
                label="Active Produce"
                value="8 Crops"
                sub="3 ready for harvest"
                accent={false}
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                label="Market Average"
                value="Rs. 385/kg"
                sub="Updated 5m ago"
                accent={true}
              />
            </div>

            {/* Interactive StatCard Playground */}
            <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Interactive StatCard Playground</h3>
                  <p className="text-xs text-gray-500">Tweak props in real time to preview styling</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                  Live Preview
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Inputs */}
                <div className="space-y-3 md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Label</label>
                      <input
                        type="text"
                        value={playgroundLabel}
                        onChange={(e) => setPlaygroundLabel(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Value</label>
                      <input
                        type="text"
                        value={playgroundValue}
                        onChange={(e) => setPlaygroundValue(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={playgroundSub}
                        onChange={(e) => setPlaygroundSub(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="accent-toggle"
                        checked={playgroundAccent}
                        onChange={(e) => setPlaygroundAccent(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="accent-toggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                        Enable Accent (Green Gradient & Glow)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Rendered output */}
                <div className="flex justify-center p-4 bg-emerald-50/40 rounded-2xl border border-emerald-500/10">
                  <div className="w-full max-w-[220px]">
                    <StatCard
                      icon={<Activity className={`w-5 h-5 ${playgroundAccent ? 'text-emerald-600' : 'text-slate-600'}`} />}
                      label={playgroundLabel}
                      value={playgroundValue}
                      sub={playgroundSub}
                      accent={playgroundAccent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: Modals (ChatModal & BuyNowModal) */}
        {(activeCategory === 'all' || activeCategory === 'modals') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                3. Interactive Modals (`ChatModal.tsx` & `BuyNowModal.tsx`)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Full-featured modal dialogues for live farmer-buyer chat and instant marketplace checkout.
              </p>
            </div>

            {buySuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-between text-xs font-semibold animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{buySuccessNotice}</span>
                </div>
                <button onClick={() => setBuySuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chat Modal Card */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-200">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Live Order Chat Modal</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Interactive drawer/modal supporting two-way chat bubbles, auto-scroll, timestamps, sender roles, and simulated instant replies.
                  </p>

                  {/* Inline preview of chat bubbles */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                    <div className="flex flex-col items-start gap-1">
                      <div className="chat-bubble-them px-3 py-1.5 text-xs max-w-[85%]">
                        Farmer: &quot;Crops are packed in crates and ready.&quot;
                      </div>
                      <span className="text-[10px] text-gray-400 ml-1">farmer · 08:30 AM</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="chat-bubble-me px-3 py-1.5 text-xs max-w-[85%]">
                        Buyer: &quot;Confirmed, driver dispatched!&quot;
                      </div>
                      <span className="text-[10px] text-gray-400 mr-1">buyer · 08:32 AM</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowChatModal(true)}
                  className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-green-500 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Launch Interactive Chat Modal
                </button>
              </div>

              {/* Buy Now Modal Card */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-200">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Buy-Now Order Modal</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Modal for confirming order details, dynamic kilogram quantity adjustments, grade tag indicators, and automatic total price calculations.
                  </p>

                  <div className="mt-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Crop:</span>
                      <span className="font-bold text-gray-900">{DEMO_LISTING.product?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Unit Price:</span>
                      <span className="font-bold text-emerald-700">Rs. {DEMO_LISTING.price_per_kg} / kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">AI Quality:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Grade {DEMO_LISTING.ai_grade} · 96.5%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowBuyModal(true)}
                  className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-green-500 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Launch Buy-Now Order Modal
                </button>
              </div>
            </div>

            {/* Active ChatModal Render */}
            {showChatModal && (
              <ChatModal
                orderId="demo-order-789"
                onClose={() => setShowChatModal(false)}
                mockMessages={DEMO_MESSAGES}
              />
            )}

            {/* Active BuyNowModal Render */}
            {showBuyModal && (
              <BuyNowModal
                listing={DEMO_LISTING}
                onClose={() => setShowBuyModal(false)}
                onConfirm={async (_id, qty) => {
                  setBuySuccessNotice(`Simulated order confirmed for ${qty} kg of ${DEMO_LISTING.product?.name}! Total: Rs. ${(Number(DEMO_LISTING.price_per_kg) * qty).toFixed(2)}`);
                }}
              />
            )}
          </section>
        )}

        {/* SECTION 4: AI Grading Card & Marketplace Listing Card */}
        {(activeCategory === 'all' || activeCategory === 'grading') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                4. AI Quality Grading & Marketplace Listings
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI visual grading report widgets, color-coded grade badges (A, B, C), and marketplace produce cards.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dynamic AI Grading Report Card */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">AI Quality Analysis Result</h3>
                    <p className="text-xs text-gray-500">Live preview with grade switcher</p>
                  </div>
                  {/* Grade Switcher */}
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    {(['A', 'B', 'C'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                          selectedGrade === g
                            ? 'bg-white shadow-xs text-emerald-700'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade Card */}
                <div
                  className="p-5 rounded-2xl border transition-all space-y-4"
                  style={{
                    background: gradeDetails.bg,
                    borderColor: gradeDetails.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-xs"
                        style={{ background: '#fff', color: gradeDetails.color }}
                      >
                        {selectedGrade}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          AI Certified
                        </span>
                        <h4 className="text-base font-black text-gray-900 leading-tight">
                          Grade {selectedGrade} Produce
                        </h4>
                        <p className="text-xs text-gray-500">{gradeDetails.crop}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-500 block">Recommended</span>
                      <span className="text-sm font-black" style={{ color: gradeDetails.color }}>
                        {gradeDetails.price}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-white/80 p-3 rounded-xl border border-black/5">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Quality Score</span>
                      <span className="text-base font-black text-gray-900">{gradeDetails.score}%</span>
                    </div>
                    <div className="bg-white/80 p-3 rounded-xl border border-black/5">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Defect Margin</span>
                      <span className="text-base font-black text-gray-900">{gradeDetails.defect}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" style={{ color: gradeDetails.color }} />
                      <span className="font-semibold text-gray-700">
                        {gradeDetails.verified ? 'Metadata Verified (GPS & Timestamp)' : 'Metadata Warning'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 italic">TensorFlow Vision</span>
                  </div>

                  <p className="text-xs text-gray-600 bg-white/60 p-2.5 rounded-xl border border-black/5">
                    {gradeDetails.summary}
                  </p>
                </div>
              </div>

              {/* Marketplace Listing Card Preview */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Buyer Marketplace Produce Card</h3>
                  <p className="text-xs text-gray-500">Standard card used in buyer search and marketplace</p>
                </div>

                <div className="p-5 rounded-2xl border border-emerald-500/15 bg-white shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center text-2xl">
                        🍅
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            Grade A
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">96.5% quality</span>
                        </div>
                        <h4 className="text-sm font-black text-gray-900 mt-1">Export Quality Tomatoes</h4>
                        <p className="text-[11px] text-gray-500">Green Horizon Farms · Nuwara Eliya</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-700">Rs. 380</span>
                      <span className="text-[10px] text-gray-400 block font-medium">per kilogram</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">Available: <strong className="text-gray-800">150 kg</strong></span>
                    <button
                      onClick={() => setShowBuyModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: Order Cards & Status Workflow */}
        {(activeCategory === 'all' || activeCategory === 'orders') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                5. Order Cards & Status Workflows
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Matched order cards, action triggers, and status badge conventions across farmer and buyer dashboards.
              </p>
            </div>

            {/* Status Pills Library */}
            <div className="p-5 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Pills Library</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  PENDING
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  MATCHED
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACCEPTED
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  COMPLETED
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  REJECTED
                </span>
                <span className="badge-soft-green px-3 py-1 rounded-full text-xs font-bold">
                  AI VERIFIED
                </span>
              </div>
            </div>

            {/* Farmer Matched Order Card */}
            <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Farmer Matched Order Card</h3>
                  <p className="text-xs text-gray-500">Appears when buyer places an order matching farmer inventory</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  Action Required
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">Order #ORD-8821</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Matched with buyer: supermarket_chain@buyer.local</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-gray-400 block font-medium">Offered Payout</span>
                    <span className="text-base font-black text-emerald-700">Rs. 57,000.00</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-500/10">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Crop</span>
                    <strong className="text-gray-800">Fresh Tomatoes</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Quantity</span>
                    <strong className="text-gray-800">150 kg</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Required Grade</span>
                    <strong className="text-emerald-700">Grade A (95%+)</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Destination</span>
                    <strong className="text-gray-800">Colombo Depot</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowChatModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat with Buyer
                  </button>
                  <button className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors">
                    Reject Match
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Accept Match
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: Admin Metrics & Forensic Audit Logs */}
        {(activeCategory === 'all' || activeCategory === 'admin') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                6. Admin Forensics & Audit Logs
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI grading forensic verification entries, dispute flagging, and audit table styling.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Recent AI Audit Logs</h3>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
                {[
                  { id: 'ADT-901', crop: 'Tomatoes', grade: 'A', time: '2 mins ago', status: 'Passed', score: '97.2%' },
                  { id: 'ADT-902', crop: 'Wheat', grade: 'C', time: '15 mins ago', status: 'Flagged', score: '52.1%' },
                  { id: 'ADT-903', crop: 'Potatoes', grade: 'B', time: '1 hour ago', status: 'Passed', score: '82.4%' },
                  { id: 'ADT-904', crop: 'Rice', grade: 'A', time: '3 hours ago', status: 'Passed', score: '94.8%' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-400">{item.id}</span>
                      <div>
                        <strong className="text-gray-800">{item.crop}</strong>
                        <span className="text-gray-400 text-[11px] ml-2">Grade {item.grade} · {item.score}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-gray-400">{item.time}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: Design Tokens & Form Controls */}
        {(activeCategory === 'all' || activeCategory === 'tokens') && (
          <section className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                7. Form Controls, Buttons & UI Tokens
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Standard interactive elements complying with the soft green design palette.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Button Styles</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-green-500 transition-all">
                    Primary Gradient
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-white border border-emerald-600/30 text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors">
                    Secondary Outline
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors">
                    Ghost / Neutral
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors">
                    Danger / Destructive
                  </button>
                  <button disabled className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed">
                    Disabled State
                  </button>
                  <button disabled className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs opacity-75 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading…
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="p-6 rounded-3xl bg-white border border-emerald-600/10 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Input Controls</h3>
                <div className="space-y-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search produce, grade or farm…"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#f0fdf4] border border-emerald-600/15 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>

                  {/* Standard text input */}
                  <input
                    type="text"
                    defaultValue="Sample Produce Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />

                  {/* Notification banners */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Success notice banner: AI calibration completed successfully.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Warning banner: Camera lighting slightly below ideal calibration.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
