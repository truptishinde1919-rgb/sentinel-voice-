'use client';

import React from 'react';
import { CreditCard, ShieldCheck, AlertTriangle, Sparkles, User, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  account_balance: number;
  credit_limit: number;
  risk_tier: number;
  facial_embedding_hash?: string;
  voice_print_id?: string;
}

interface AccountSummaryProps {
  user: UserProfile | null;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  lastAction: any;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({
  user,
  allUsers,
  onSelectUser,
  lastAction,
}) => {
  if (!user) {
    return (
      <div className="cyber-card rounded-2xl p-6 text-center text-slate-400 animate-pulse">
        Loading customer profile...
      </div>
    );
  }

  const creditUsed = 420.50;
  const availableCredit = Math.max(0, user.credit_limit - creditUsed);
  const utilizationPct = Math.min(100, Math.round((creditUsed / user.credit_limit) * 100));

  return (
    <div className="space-y-6" id="account-summary-panel">
      {/* Customer Selector Ribbon */}
      <div className="cyber-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Demo Account Switcher
          </span>
          <span className="text-[11px] text-slate-400">Select identity to test policies</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {allUsers.map((u) => {
            const isSelected = u.id === user.id;
            return (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`text-left p-2.5 rounded-xl transition-all border text-xs ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="font-semibold truncate">{u.full_name}</div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      u.risk_tier === 1 ? 'bg-emerald-400' : u.risk_tier === 2 ? 'bg-cyan-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-slate-400">Tier {u.risk_tier}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cybernetic Obsidian Metal Card */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-cyan-500/30 shadow-2xl">
        {/* Holographic accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-48">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="text-xs tracking-widest uppercase font-bold text-slate-200">NEXUS BANK</div>
                <div className="text-[10px] text-cyan-400/80 tracking-wider">SENTINEL OBSIDIAN ELITE</div>
              </div>
            </div>
            {/* NFC Contactless wave */}
            <div className="text-cyan-400/80 text-xs font-mono tracking-widest">)))</div>
          </div>

          {/* Chip & Number */}
          <div className="my-auto">
            <div className="w-10 h-7 rounded bg-amber-400/30 border border-amber-300/40 grid grid-cols-2 gap-0.5 p-1 mb-3">
              <div className="border-r border-b border-amber-300/40" />
              <div className="border-b border-amber-300/40" />
              <div className="border-r border-amber-300/40" />
              <div />
            </div>
            <div className="font-mono text-base tracking-widest text-slate-200">
              •••• •••• •••• {user.id === 'usr_marcus_vance' ? '9912' : user.id === 'usr_sophia_chen' ? '4410' : '7824'}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cardholder</div>
              <div className="font-semibold text-slate-200">{user.full_name}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Expires</div>
              <div className="font-mono text-slate-200">09/29</div>
            </div>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
              VISA PLATINUM
            </div>
          </div>
        </div>
      </div>

      {/* Account Balances & Status */}
      <div className="cyber-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-slate-400">Total Checking Balance</div>
            <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-1 mt-0.5">
              <span>${user.account_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs font-normal text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Live
              </span>
            </div>
          </div>

          {/* Risk Tier Badge */}
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">Customer Profile</div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                user.risk_tier === 1
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : user.risk_tier === 2
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
              }`}
            >
              {user.risk_tier === 1 ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              Tier {user.risk_tier}: {user.risk_tier === 1 ? 'Low Risk' : user.risk_tier === 2 ? 'Standard' : 'Elevated Risk'}
            </span>
          </div>
        </div>

        {/* Credit Limit Meter */}
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span className="text-slate-400">Credit Line Utilization</span>
            <span className="font-mono">${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })} Available</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                utilizationPct > 60 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>Used: ${creditUsed.toFixed(2)} ({utilizationPct}%)</span>
            <span>Total Limit: ${user.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Last Action Notification Badge */}
        {lastAction && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              lastAction.status === 'SUCCESS' || lastAction.status === 'EXECUTED'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {lastAction.status === 'SUCCESS' || lastAction.status === 'EXECUTED' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold uppercase tracking-wider text-[11px]">
                {lastAction.action_type || 'Action Processed'}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {lastAction.amount_credited
                  ? `Credited $${lastAction.amount_credited.toFixed(2)} to balance`
                  : lastAction.new_limit
                  ? `Limit increased to $${lastAction.new_limit.toFixed(2)}`
                  : lastAction.new_card_last4
                  ? `Replacement card ending in ${lastAction.new_card_last4} dispatched`
                  : 'Action executed successfully'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="cyber-card rounded-2xl p-4">
        <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>Recent Activity & Fees</span>
          <span className="text-[10px] text-slate-400">Statement 2026-10</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">Overdraft Protection Fee</div>
                <div className="text-[10px] text-slate-400">Oct 14 • Courtesy eligible</div>
              </div>
            </div>
            <div className="text-rose-400 font-mono font-medium">-$35.00</div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">Grocery Store POS</div>
                <div className="text-[10px] text-slate-400">Oct 15 • Contactless</div>
              </div>
            </div>
            <div className="text-slate-300 font-mono font-medium">-$64.80</div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">Direct Deposit Payroll</div>
                <div className="text-[10px] text-slate-400">Oct 16 • Automated ACH</div>
              </div>
            </div>
            <div className="text-emerald-400 font-mono font-medium">+$2,150.00</div>
          </div>
        </div>
      </div>
    </div>
  );
};
