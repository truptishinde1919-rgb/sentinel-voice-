'use client';

import React, { useState } from 'react';
import { Terminal, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface AuditLoggerProps {
  traces: any[];
  guardrailResult: any;
  actionExecuted: any;
}

export const AuditLogger: React.FC<AuditLoggerProps> = ({
  traces,
  guardrailResult,
  actionExecuted,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'guardrails' | 'biometrics' | 'raw'>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  const handleCopyJSON = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      traces,
      guardrailResult,
      actionExecuted,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rules = guardrailResult?.rules_evaluated || [];

  return (
    <div className="cyber-card rounded-2xl p-5 flex flex-col h-[580px] space-y-4" id="audit-trace-logger">
      {/* Logger Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              Compliance & Audit Trace Logger
            </h3>
            <p className="text-[10px] text-slate-400">
              Deterministic Guardrails & Multi-Turn Reasoning Stream
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyJSON}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px]">
        {(['all', 'guardrails', 'biometrics', 'raw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 rounded-lg font-medium transition-all uppercase tracking-wider text-[10px] ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
        {/* Guardrail Rules Overview */}
        {(activeTab === 'all' || activeTab === 'guardrails') && rules.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                {guardrailResult?.policy_passed ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
                Deterministic Rules Evaluated ({rules.length})
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  guardrailResult?.policy_passed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {guardrailResult?.decision}
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {rules.map((rule: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    {rule.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-200 font-sans">
                        {rule.rule_id}: {rule.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Target: {rule.expected}
                      </div>
                      <div className="text-[10px] text-cyan-300/80">
                        Evaluated: {rule.actual}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      rule.passed ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                    }`}
                  >
                    {rule.passed ? 'PASSED' : 'VIOLATED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Reason Traces */}
        {(activeTab === 'all' || activeTab === 'biometrics') && (
          <div className="space-y-2">
            {traces.map((trace: any, index: number) => {
              const isExpanded = expandedTraceIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTraceIndex(isExpanded ? null : index)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-900/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="text-[11px] font-bold text-cyan-400">
                        {trace.step}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {trace.timestamp ? new Date(trace.timestamp).toLocaleTimeString() : 'Live'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[11px] text-slate-300">
                      <pre className="overflow-x-auto p-2 bg-slate-950 rounded-lg text-emerald-300 text-[10px] leading-relaxed">
                        {JSON.stringify(trace, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Raw Full Audit Trace JSON */}
        {activeTab === 'raw' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <pre className="text-cyan-300 text-[10px] leading-relaxed overflow-x-auto">
              {JSON.stringify(
                {
                  traces,
                  guardrailResult,
                  actionExecuted,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Trace Status Footer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>PostgreSQL & Qdrant Traces Active</span>
        </div>
        <span>Presidio PII Masking: Enabled</span>
      </div>
    </div>
  );
};
