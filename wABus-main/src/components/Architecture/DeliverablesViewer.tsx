import React, { useState } from 'react';
import { POSTGRESQL_SCHEMA_SQL, REDIS_LOCKING_TYPESCRIPT, PAYMENT_WEBHOOK_TYPESCRIPT } from '../../data/deliverables';
import { Database, Code2, Copy, Check, Download, ShieldCheck, FileCode, Layers, Server } from 'lucide-react';

export const DeliverablesViewer: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'POSTGRESQL' | 'REDIS_LOCK' | 'PAYMENT_WEBHOOK' | 'ARCHITECTURE_DOC'>('POSTGRESQL');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeCodeTab) {
      case 'POSTGRESQL':
        return POSTGRESQL_SCHEMA_SQL;
      case 'REDIS_LOCK':
        return REDIS_LOCKING_TYPESCRIPT;
      case 'PAYMENT_WEBHOOK':
        return PAYMENT_WEBHOOK_TYPESCRIPT;
      case 'ARCHITECTURE_DOC':
        return `# ============================================================================
# WABUS / BHARATRIDE ENTERPRISE ARCHITECTURE BLUEPRINT & SYSTEM SPECIFICATIONS
# ============================================================================

1. REAL-TIME DISTRIBUTED SEAT LOCKING (REDIS + LUA ENGINE):
   - Key Schema: \`lock:trip:{tripId}:seat:{seatNumber}\`
   - Value: Session UUID (128-bit)
   - TTL: 600 seconds (10 minutes)
   - Mutex Guarantee: Atomic multi-key acquisition via custom Redis Lua script.
   - If any seat in a multi-seat selection is held by another concurrent user, 
     the Lua script immediately rolls back and returns 0 (Conflict).
   - Auto-Eviction: Redis TTL natively evicts stale locks upon checkout abandonment,
     restoring inventory to 'AVAILABLE' state with zero database polling overhead.

2. DYNAMIC PRICING & ZERO-DOWNTIME REMOTE CONFIGURATION:
   - Surge Multipliers applied at query-time via in-memory Feature Flags engine.
   - Dynamic formula:
     EffectiveFare = Round(BaseFare * (EnableSurge ? SurgeMultiplier : 1.0))
   - Zero-Downtime updates via REST & WebSockets broadcast to all active mobile & web clients.

3. CONDUCTOR QR SCANNER & CRYPTOGRAPHIC TICKET VALIDATION:
   - QR Payload: HMAC-SHA256(SecretKey, { PNR, TripID, Seats[], IssuedAt, Fare })
   - The on-coach mobile camera reads the QR hash and queries /api/conductor/scan.
   - Conductor app automatically marks check_in_status = 'BOARDED' with instant Web Audio chime.
   - Offline / Walk-in seat allocation instantly persists in PostgreSQL and broadcasts inventory reduction.

4. AUTOMATED MIDNIGHT SETTLEMENT & PAYOUT ENGINE:
   - Daily Cron job at 00:00:00 IST computes:
     GrossBookings - PlatformFee(8%) - TDS(1% Sec 194O) = NetOperatorPayout
   - Dispatches batch transfers via Razorpay Route / Stripe Connect APIs.
`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeCodeTab === 'POSTGRESQL' ? 'sql' : activeCodeTab === 'ARCHITECTURE_DOC' ? 'md' : 'ts';
    const filename = `wabus_${activeCodeTab.toLowerCase()}.${ext}`;
    const blob = new Blob([getCodeContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D84E55] text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">System Architecture & Production Code</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  Enterprise Production Spec
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Production-grade PostgreSQL DDL Schema, Redis distributed locking module, and payment webhooks
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white text-xs font-black shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveCodeTab('POSTGRESQL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCodeTab === 'POSTGRESQL'
                ? 'bg-[#D84E55] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. PostgreSQL DDL Schema (schema.sql)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('REDIS_LOCK')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCodeTab === 'REDIS_LOCK'
                ? 'bg-[#D84E55] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Redis 10m TTL Lock Engine (redis_lock.ts)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('PAYMENT_WEBHOOK')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCodeTab === 'PAYMENT_WEBHOOK'
                ? 'bg-[#D84E55] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>3. Automated Webhook & QR Engine (webhook.ts)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('ARCHITECTURE_DOC')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCodeTab === 'ARCHITECTURE_DOC'
                ? 'bg-[#D84E55] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>4. System Blueprint & Remote Config Doc</span>
          </button>
        </div>
      </div>

      {/* Syntax Viewer Box */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl text-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-950/80">
          <span className="text-xs font-mono font-bold text-gray-400">
            {activeCodeTab === 'POSTGRESQL' && 'schema.sql (PostgreSQL 15+ DDL, Enums, Foreign Keys & Indices)'}
            {activeCodeTab === 'REDIS_LOCK' && 'redis_locking.ts (ioredis Atomic Lua Script with Auto-Release)'}
            {activeCodeTab === 'PAYMENT_WEBHOOK' && 'payment_webhook.ts (HMAC-SHA256 Signature Verification & QR Generator)'}
            {activeCodeTab === 'ARCHITECTURE_DOC' && 'ARCHITECTURE_SPEC.md (System Blueprint)'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Production Verified
          </span>
        </div>

        <pre className="p-5 sm:p-6 text-xs text-red-200/90 font-mono overflow-x-auto leading-relaxed max-h-[550px] scrollbar-thin scrollbar-thumb-gray-700">
          {getCodeContent()}
        </pre>
      </div>
    </div>
  );
};
