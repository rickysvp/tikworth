'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, TrendingUp, DollarSign, Users, Activity, BarChart3, Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'

// ── Types ──
interface StatsData {
  overview: {
    totalRevenue: number
    revenueToday: number
    revenueWeek: number
    revenueMonth: number
    totalPayers: number
    payersToday: number
    payersWeek: number
    payersMonth: number
    evaluationsToday: number
    evaluationsWeek: number
    evaluationsMonth: number
    remainingCredits: number
  }
  funnel: {
    pageViews: number
    searches: number
    evaluateStarts: number
    paywallViews: number
    paywallClicks: number
    purchases: number
  }
  revenue: {
    byDay: { date: string; amount: number }[]
    byPackage: { id: string; count: number; revenue: number }[]
  }
}

type Tab = 'overview' | 'funnel' | 'revenue' | 'ops'

// ── Helpers ──
function fmtUsd(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}
function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
function pct(a: number, b: number): string {
  if (b === 0) return '0.0%'
  return `${((a / b) * 100).toFixed(1)}%`
}

const TAB_COLORS: Record<Tab, string> = {
  overview: 'border-[#00F2EA] text-[#00F2EA]',
  funnel: 'border-[#FF0050] text-[#FF0050]',
  revenue: 'border-green-400 text-green-400',
  ops: 'border-amber-400 text-amber-400',
}

const PIE_COLORS = ['#00F2EA', '#FF0050', '#22c55e', '#a855f7']

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Credit grant form state
  const [grantMode, setGrantMode] = useState<'single' | 'batch'>('single')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantBatchEmails, setGrantBatchEmails] = useState('')
  const [grantCredits, setGrantCredits] = useState(5)
  const [grantReason, setGrantReason] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantResult, setGrantResult] = useState<{ success: boolean; msg: string } | null>(null)

  // Credit history
  const [history, setHistory] = useState<Array<{ id: number; target_email: string; credits: number; reason: string; created_at: string }>>([])

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

  const fetchStats = useCallback(async () => {
    if (!token) { router.push('/tiktokmaster'); return }
    try {
      const res = await fetch('/api/tiktokmaster/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/tiktokmaster'); return }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, router])

  const fetchHistory = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/tiktokmaster/credits/history?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setHistory(data.items || [])
    } catch {}
  }, [token])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (tab === 'ops') fetchHistory() }, [tab, fetchHistory])

  async function handleGrant() {
    if (!token) return
    const emails = grantMode === 'single'
      ? [grantEmail]
      : grantBatchEmails.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)

    if (emails.length === 0) {
      setGrantResult({ success: false, msg: 'Please enter at least one email' })
      return
    }
    if (!grantReason.trim()) {
      setGrantResult({ success: false, msg: 'Reason is required' })
      return
    }

    setGrantLoading(true)
    setGrantResult(null)
    try {
      const res = await fetch('/api/tiktokmaster/credits/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails, credits: grantCredits, reason: grantReason }),
      })
      const data = await res.json()
      if (res.ok) {
        setGrantResult({ success: true, msg: `Granted ${data.granted} x ${grantCredits} = ${data.totalCredits} evaluations to ${data.granted} email(s)` })
        setGrantEmail('')
        setGrantBatchEmails('')
        setGrantReason('')
        fetchHistory()
        fetchStats()
      } else {
        setGrantResult({ success: false, msg: data.error || 'Failed' })
      }
    } catch {
      setGrantResult({ success: false, msg: 'Network error' })
    } finally {
      setGrantLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/tiktokmaster')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F2EA]" />
      </main>
    )
  }

  if (error && !stats) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </main>
    )
  }

  const o = stats!.overview
  const f = stats!.funnel
  const r = stats!.revenue

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { key: 'funnel', label: 'Funnel', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'revenue', label: 'Revenue', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'ops', label: 'Operations', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/tokvalue.png" alt="TokValue" width={100} height={24} className="h-6 w-auto object-contain" />
            <span className="text-xs text-neutral-600 border-l border-neutral-800 pl-3">Admin Console</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                tab === t.key
                  ? `${TAB_COLORS[t.key]}`
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Tab: Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Row 1: Revenue */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Revenue" value={fmtUsd(o.totalRevenue)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue Today" value={fmtUsd(o.revenueToday)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue This Week" value={fmtUsd(o.revenueWeek)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue This Month" value={fmtUsd(o.revenueMonth)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
            </div>
            {/* Row 2: Payers */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Payers" value={fmtNum(o.totalPayers)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers Today" value={fmtNum(o.payersToday)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers This Week" value={fmtNum(o.payersWeek)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers This Month" value={fmtNum(o.payersMonth)} icon={<Users className="h-4 w-4" />} color="pink" />
            </div>
            {/* Row 3: Evaluations */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Evaluations Today" value={fmtNum(o.evaluationsToday)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Evaluations This Week" value={fmtNum(o.evaluationsWeek)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Evaluations This Month" value={fmtNum(o.evaluationsMonth)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Remaining Unused" value={fmtNum(o.remainingCredits)} icon={<TrendingUp className="h-4 w-4" />} color="amber" />
            </div>

            {/* Revenue Trend Chart */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Revenue Trend (30 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#525252' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#525252' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#737373' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#00F2EA" strokeWidth={2} dot={false} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Funnel ── */}
        {tab === 'funnel' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-6">Conversion Funnel (30 Days)</h3>
              <div className="space-y-3">
                {[
                  { label: 'Page Views', value: f.pageViews, color: '#525252' },
                  { label: 'Searches', value: f.searches, color: '#737373' },
                  { label: 'Evaluate Starts', value: f.evaluateStarts, color: '#a855f7' },
                  { label: 'Paywall Views', value: f.paywallViews, color: '#f59e0b' },
                  { label: 'Paywall Clicks', value: f.paywallClicks, color: '#FF0050' },
                  { label: 'Purchases', value: f.purchases, color: '#22c55e' },
                ].map((step, i) => {
                  const prev = i > 0 ? [f.pageViews, f.searches, f.evaluateStarts, f.paywallViews, f.paywallClicks][i - 1] : f.pageViews
                  const rate = i === 0 ? '100%' : pct(step.value, prev)
                  const maxVal = Math.max(f.pageViews, 1)
                  const width = `${Math.max((step.value / maxVal) * 100, 2)}%`
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-neutral-300">{step.label}</span>
                        <span className="text-xs text-neutral-500">
                          {fmtNum(step.value)} · {rate}
                        </span>
                      </div>
                      <div className="h-8 bg-[#0f0f0f] rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all flex items-center px-3"
                          style={{ width, backgroundColor: step.color }}
                        >
                          <span className="text-xs font-semibold text-white">{fmtNum(step.value)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Revenue ── */}
        {tab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Package Distribution Pie */}
              <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-4">Package Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={r.byPackage} dataKey="count" nameKey="id" cx="50%" cy="50%" outerRadius={80} label={(props: PieLabelRenderProps) => `${props.name}: ${props.value}`}>
                        {r.byPackage.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Revenue Bar */}
              <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-4">Daily Revenue</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={r.byDay.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#525252' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#525252' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                      <Bar dataKey="amount" fill="#00F2EA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Revenue Table */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Package Sales</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-600 border-b border-neutral-800">
                    <th className="pb-3 font-medium">Package</th>
                    <th className="pb-3 font-medium text-right">Count</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {r.byPackage.map((pkg, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-3 text-neutral-300">{pkg.id}</td>
                      <td className="py-3 text-right tabular-nums">{pkg.count}</td>
                      <td className="py-3 text-right tabular-nums text-[#00F2EA]">{fmtUsd(pkg.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Operations ── */}
        {tab === 'ops' && (
          <div className="space-y-6">
            {/* Credit Grant Form */}
            <div className="rounded-2xl border border-[#00F2EA]/20 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Grant Evaluations</h3>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setGrantMode('single')}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${grantMode === 'single' ? 'border-[#00F2EA] text-[#00F2EA] bg-[#00F2EA]/10' : 'border-neutral-700 text-neutral-500'}`}
                >
                  Single Email
                </button>
                <button
                  onClick={() => setGrantMode('batch')}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${grantMode === 'batch' ? 'border-[#00F2EA] text-[#00F2EA] bg-[#00F2EA]/10' : 'border-neutral-700 text-neutral-500'}`}
                >
                  Batch (CSV)
                </button>
              </div>

              {grantMode === 'single' ? (
                <input
                  type="email"
                  value={grantEmail}
                  onChange={e => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none mb-4"
                />
              ) : (
                <textarea
                  value={grantBatchEmails}
                  onChange={e => setGrantBatchEmails(e.target.value)}
                  placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                  rows={4}
                  className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none mb-4 resize-none"
                />
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Evaluations to Grant</label>
                  <input
                    type="number"
                    value={grantCredits}
                    onChange={e => setGrantCredits(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white focus:border-[#00F2EA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Reason</label>
                  <input
                    type="text"
                    value={grantReason}
                    onChange={e => setGrantReason(e.target.value)}
                    placeholder="Customer refund / promotion"
                    className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGrant}
                disabled={grantLoading}
                className="w-full rounded-xl bg-[#00F2EA] text-black font-semibold py-2.5 text-sm hover:bg-[#00D8D0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {grantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {grantLoading ? 'Granting...' : 'Grant Evaluations'}
              </button>

              {grantResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${grantResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {grantResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                  {grantResult.msg}
                </div>
              )}
            </div>

            {/* Credit History */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Recent Grant History</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-600 border-b border-neutral-800">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium text-right">Evaluations</th>
                    <th className="pb-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-3 text-neutral-500 text-xs">{new Date(h.created_at).toLocaleString('en-US')}</td>
                      <td className="py-3 text-neutral-300">{h.target_email}</td>
                      <td className="py-3 text-right tabular-nums text-[#00F2EA]">{h.credits}</td>
                      <td className="py-3 text-neutral-500 text-xs">{h.reason}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-neutral-600">No grant history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Metric Card Component ──
function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'cyan' | 'pink' | 'green' | 'amber' }) {
  const borderColor = color === 'cyan' ? 'border-[#00F2EA]/20' : color === 'pink' ? 'border-[#FF0050]/20' : color === 'green' ? 'border-green-500/20' : 'border-amber-500/20'
  const iconColor = color === 'cyan' ? 'text-[#00F2EA]' : color === 'pink' ? 'text-[#FF0050]' : color === 'green' ? 'text-green-400' : 'text-amber-400'
  return (
    <div className={`rounded-xl border ${borderColor} bg-[#141414] p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}