'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Cpu, Activity, ArrowRight, Radio, Lock, Headphones } from 'lucide-react';
import { AccountSummary, UserProfile } from '@/components/AccountSummary';
import { BiometricOverlay } from '@/components/BiometricOverlay';
import { VoiceWidget } from '@/components/VoiceWidget';
import { AuditLogger } from '@/components/AuditLogger';
import { ServicingWebSocketClient, BiometricTelemetry } from '@/lib/websocket';

export default function ServicingPortalPage() {
  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: 'usr_elena_rostova',
      full_name: 'Elena Rostova',
      email: 'elena.rostova@nexusbank.com',
      phone_number: '+1 (555) 382-9011',
      account_balance: 4885.50,
      credit_limit: 12500.00,
      risk_tier: 1,
    },
    {
      id: 'usr_sophia_chen',
      full_name: 'Sophia Chen',
      email: 'sophia.chen@nexusbank.com',
      phone_number: '+1 (555) 612-4489',
      account_balance: 1280.00,
      credit_limit: 3000.00,
      risk_tier: 2,
    },
    {
      id: 'usr_marcus_vance',
      full_name: 'Marcus Vance',
      email: 'm.vance@nexusbank.com',
      phone_number: '+1 (555) 749-3320',
      account_balance: 340.00,
      credit_limit: 1000.00,
      risk_tier: 3,
    },
  ]);

  const [activeUser, setActiveUser] = useState<UserProfile>(users[0]);
  const [lastAction, setLastAction] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpoofActive, setIsSpoofActive] = useState<boolean>(false);
  const [auditTraces, setAuditTraces] = useState<any[]>([]);
  const [guardrailResult, setGuardrailResult] = useState<any>(null);
  const [actionExecuted, setActionExecuted] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<BiometricTelemetry | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [warmHandoffTriggered, setWarmHandoffTriggered] = useState<boolean>(false);

  const wsClientRef = useRef<ServicingWebSocketClient | null>(null);

  // Initialize data from backend API
  useEffect(() => {
    async function loadBackendData() {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
        const res = await fetch(`${apiBase}/api/users`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setUsers(data);
            setActiveUser(data[0]);
          }
        }
      } catch (err) {
        console.warn('Backend not responding yet, using local client seed state.');
      }
    }
    loadBackendData();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    const client = new ServicingWebSocketClient('session_nexus_live');
    wsClientRef.current = client;

    client.onStatus((status) => {
      setWsConnected(status);
    });

    client.onMessage((msg) => {
      if (msg.type === 'BIOMETRIC_UPDATE') {
        setTelemetry(msg.telemetry);
      } else if (msg.type === 'AGENT_RESPONSE') {
        handleTurnResult(msg);
      }
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  // Periodic frame telemetry push
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsClientRef.current) {
        wsClientRef.current.sendFrame({
          user_id: activeUser.id,
          user_risk_tier: activeUser.risk_tier,
          frame_base64: isSpoofActive ? 'simulated_spoof_frame' : 'normal_frame',
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeUser, isSpoofActive]);

  const handleTurnResult = (data: any) => {
    if (data.updated_user) {
      setActiveUser(data.updated_user);
      setUsers((prev) =>
        prev.map((u) => (u.id === data.updated_user.id ? data.updated_user : u))
      );
    } else if (data.action_executed) {
      if (data.action_executed.new_balance !== undefined) {
        setActiveUser((prev) => ({
          ...prev,
          account_balance: data.action_executed.new_balance,
        }));
      }
      if (data.action_executed.new_limit !== undefined) {
        setActiveUser((prev) => ({
          ...prev,
          credit_limit: data.action_executed.new_limit,
        }));
      }
    }

    if (data.action_executed) {
      setLastAction(data.action_executed);
      setActionExecuted(data.action_executed);
    }

    if (data.guardrail_result) {
      setGuardrailResult(data.guardrail_result);
    }

    if (data.audit_trace) {
      setAuditTraces((prev) => [...data.audit_trace, ...prev].slice(0, 30));
    }

    if (data.biometric_telemetry) {
      setTelemetry(data.biometric_telemetry);
    }

    if (data.warm_handoff) {
      setWarmHandoffTriggered(true);
    }
  };

  const handleSelectUser = (selected: UserProfile) => {
    setActiveUser(selected);
    setWarmHandoffTriggered(false);
    setIsSpoofActive(false);
    // Add audit trace note
    setAuditTraces((prev) => [
      {
        step: 'IDENTITY_CONTEXT_SWITCH',
        user_id: selected.id,
        user_name: selected.full_name,
        risk_tier: selected.risk_tier,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Cybernetic Nav Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-widest text-white uppercase">
                  SENTINEL<span className="text-cyan-400">VOICE</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                  NEXUS ENTERPRISE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Multimodal AI Servicing Assistant with Real-Time Fraud Verification & Autonomous Action Execution
              </p>
            </div>
          </div>

          {/* Telemetry Status Badges */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-amber-400'} animate-pulse`} />
                <span>SPEECH LATENCY: 310MS</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRESIDIO PII SCRUB: ACTIVE</span>
              </div>
            </div>

            {/* Admin SOC Dashboard Link */}
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-500/40 text-xs font-semibold text-white shadow-lg shadow-indigo-950/50 transition-all group"
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-300" />
              <span>Supervisor SOC Portal</span>
              {warmHandoffTriggered && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
              <ArrowRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Warm Handoff Alert Banner */}
      {warmHandoffTriggered && (
        <div className="bg-rose-950/80 border-y border-rose-500/40 px-6 py-2.5 text-center text-xs text-rose-200 flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-bold">SECURITY ESCALATION TRIGGERED:</span>
          <span>Dynamic fraud risk threshold exceeded. Servicing transferred to Human Senior Specialist pool in real time.</span>
        </div>
      )}

      {/* Main 3-Column Cockpit Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Account Summary & Card (col-span-4) */}
          <div className="lg:col-span-4">
            <AccountSummary
              user={activeUser}
              allUsers={users}
              onSelectUser={handleSelectUser}
              lastAction={lastAction}
            />
          </div>

          {/* Center Column: Video Biometric HUD & Voice Servicing Portal (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <BiometricOverlay
              telemetry={telemetry}
              onSimulateSpoofToggle={(val) => {
                setIsSpoofActive(val);
                if (val) {
                  setTelemetry((prev: any) => ({
                    ...prev,
                    confidence_score: 41.2,
                    liveness_passed: false,
                    fraud_risk_score: 64.8,
                    decision: 'WARM_HANDOFF_ESCALATED',
                  }));
                }
              }}
              isSpoofActive={isSpoofActive}
            />

            <VoiceWidget
              wsClient={wsClientRef.current}
              userId={activeUser.id}
              userRiskTier={activeUser.risk_tier}
              onTurnComplete={handleTurnResult}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              biometricTelemetry={telemetry}
            />
          </div>

          {/* Right Column: Compliance Audit & Reasoning Traces (col-span-3) */}
          <div className="lg:col-span-3">
            <AuditLogger
              traces={auditTraces}
              guardrailResult={guardrailResult}
              actionExecuted={actionExecuted}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-3 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>SentinelVoice v1.0.0 Enterprise • Team Nexus</span>
          <span>Deterministic Policy Engine: Active • LangGraph Agent Orchestration • Sub-800ms Latency</span>
        </div>
      </footer>
    </div>
  );
}
