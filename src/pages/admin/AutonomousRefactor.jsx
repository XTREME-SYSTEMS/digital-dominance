import React from 'react';
import { Wrench, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import RefactorStats from '@/components/autonomous-refactor/RefactorStats';
import RefactorScanner from '@/components/autonomous-refactor/RefactorScanner';
import RefactorQueue from '@/components/autonomous-refactor/RefactorQueue';

export default function AutonomousRefactor() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950 p-6 text-white border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Wrench className="h-7 w-7 text-stone-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Autonomous Refactor Engine</h1>
            <p className="text-stone-400 text-sm">5-phase self-improving cycle: Scan → Plan → Execute → Validate → Converge</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-stone-300">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Read-only checks; unverified functions skipped</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-300">
            <RefreshCw className="h-4 w-4 text-amber-400" />
            <span>AI-generated refactoring plans</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-300">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>AI review only; no code deployed</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <RefactorStats />

      {/* Scanner */}
      <RefactorScanner />

      {/* Queue */}
      <RefactorQueue />
    </div>
  );
}