'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Headphones,
  ArrowLeft,
  Activity,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Filter,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  user_id: string;
  user_name: string;
  user_risk_tier: number;
  channel: string;
  session_status: string;
  sentiment_score: number;
  started_at: string;
}

interface AuditRecord {
  id: string;
  session_id: string;
  user_id: string;
  tool_name: string;
  policy_passed: boolean;
  policy_rules_evaluated: any[];
  llm_reasoning_trace: string;
  raw_payload: any;
  created_at: string;
}

export default function AdminSupervisorDashboard() {
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: 'session_nexus_live',
      user_id: 'usr_elena_rostova',
      user_name: 'Elena Rostova',
      user_risk_tier: 1,
      channel: 'WEBRTC_VOICE_STREAM',
      session_status: 'ACTIVE',
      sentiment_score: 0.92,
      started_at: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: 'session_flagged_902',
      user_id: 'usr_marcus_vance',
      user_name: 'Marcus Vance',
      user_risk_tier: 3,
      channel: 'WEBSOCKET_AUDIO',
      session_status: 'WARM_TRANSFER_TRIGGERED',
      sentiment_score: 0.35,
      started_at: new Date(Date.now() - 420000).toISOString(),
    },
    {
      id: 'session_std_441',
      user_id: 'usr_sophia_chen',
      user_name: 'Sophia Chen',
      user_risk_tier: 2,
      channel: 'WEBRTC_VOICE_STREAM',
      session_status: 'ACTIVE',
      sentiment_score: 0.81,
      started_at: new Date(Date.now() - 90000).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditRecord | null>(null);
  const [filterPassed, setFilterPassed] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [takeoverSessionId, setTakeoverSessionId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const [sessionsRes, logsRes] = await Promise.all([
        fetch(`${apiBase}/api/sessions/active`),
        fetch(`${apiBase}/api/audit-logs?limit=50`),
      ]);

      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        if (sData && sData.length > 0) setSessions(sData);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (lData) setAuditLogs(lData);
      }
    } catch (e) {
      console.warn('Backend not responding yet, displaying initial state.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeover = (sessionId: string) => {
    setTakeoverSessionId(sessionId);
    alert(`Supervisor Takeover Initiated: You are now patched into audio session ${sessionId}.`);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterPassed === 'PASSED') return log.policy_passed;
    if (filterPassed === 'FAILED') return !log.policy_passed;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Top SOC Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider text-white uppercase">
                  Supervisor SOC & Compliance Audit Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  HITL DISPATCH ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Real-time supervisor escalation monitoring, deterministic policy enforcement & audit trails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>1 Warm Transfer Queue Alert</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main SOC Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>Active Servicing Sessions</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{sessions.length}</div>
            <div className="text-[10px] text-cyan-400/80 mt-1 font-mono">100% Biometric Monitored</div>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>Autonomous Resolution Rate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">94.2%</div>
            <div className="text-[10px] text-slate-400 mt-1">Actions executed without escalation</div>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>Blocked Fraud Attempts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">8</div>
            <div className="text-[10px] text-rose-400/80 mt-1">Liveness failure or risk &gt; 15%</div>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>Average Response Latency</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300">320ms</div>
            <div className="text-[10px] text-indigo-400/80 mt-1">Target sub-800ms speech-to-speech</div>
          </div>
        </div>

        {/* Live Active Sessions & Warm Transfer Escalation Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Headphones className="w-4 h-4 text-cyan-400" />
                Live Customer Voice & Video Streams
              </h2>
              <span className="text-[10px] text-slate-400">Auto-refreshing 5s</span>
            </div>

            <div className="space-y-3">
              {sessions.map((sess) => {
                const isWarmTransfer = sess.session_status === 'WARM_TRANSFER_TRIGGERED';
                return (
                  <div
                    key={sess.id}
                    className={`cyber-card rounded-xl p-4 border transition-all ${
                      isWarmTransfer
                        ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{sess.user_name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sess.user_risk_tier === 1
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : sess.user_risk_tier === 2
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            Tier {sess.user_risk_tier}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {sess.id} • {sess.channel}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          isWarmTransfer
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {isWarmTransfer ? 'WARM TRANSFER QUEUED' : 'AUTONOMOUS ACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="text-slate-400">
                        Sentiment Score: <span className="font-mono text-cyan-300">{(sess.sentiment_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isWarmTransfer ? (
                          <button
                            onClick={() => handleTakeover(sess.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Accept Warm Handoff
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTakeover(sess.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Monitor Audio
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Section: Compliance Audit Logs Table (col-span-6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Compliance Audit Trail (PostgreSQL Schema)
              </h2>

              {/* Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
                {(['ALL', 'PASSED', 'FAILED'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterPassed(mode)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      filterPassed === mode ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="cyber-card rounded-2xl overflow-hidden border border-slate-800 h-[480px] flex flex-col">
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/80">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No compliance audit logs found matching criteria. Traces appear as actions execute.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedAuditLog(log)}
                      className="p-3 hover:bg-slate-900/60 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {log.policy_passed ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className="font-bold text-slate-200 font-mono">{log.tool_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {log.llm_reasoning_trace}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Audit Log JSON Inspector Modal */}
        {selectedAuditLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="cyber-card rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col border border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">
                    Audit Log Trace Inspector: {selectedAuditLog.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px]">TOOL NAME:</span>
                  <div className="text-cyan-300 font-bold">{selectedAuditLog.tool_name}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">POLICY RESULT:</span>
                  <div
                    className={`font-bold ${
                      selectedAuditLog.policy_passed ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedAuditLog.policy_passed ? 'APPROVED BY DETERMINISTIC GUARDRAILS' : 'POLICY VIOLATION'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">REASONING TRACE:</span>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                    {selectedAuditLog.llm_reasoning_trace}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">RAW PAYLOAD (JSONB):</span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 text-[10px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedAuditLog.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-[11px] text-slate-400">
        SentinelVoice Supervisor Operations Center • Real-Time Dynamic Fraud Verification & Deterministic Policy Engine
      </footer>
    </div>
  );
}
