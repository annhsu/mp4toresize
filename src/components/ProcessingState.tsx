/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Loader2, RefreshCw, XCircle, AlertCircle, Sparkles, Terminal } from 'lucide-react';

interface ProcessingStateProps {
  progress: number; // 0 to 100
  estimatedTime: string;
  currentStep: string;
  logs: string[];
  onCancel: () => void;
}

export default function ProcessingState({
  progress,
  estimatedTime,
  currentStep,
  logs,
  onCancel,
}: ProcessingStateProps) {
  const [showLogs, setShowLogs] = useState(false);

  // Auto-scroll logic is handled where logs update, but we can display the last few logs beautifully
  const lastLogs = logs.slice(-5);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col items-center justify-center gap-6 animate-fadeIn">
      <div className="relative flex items-center justify-center">
        {/* Dynamic spinner around progress */}
        <div className="relative h-28 w-28 flex items-center justify-center rounded-full bg-slate-50 border border-indigo-100">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin absolute" />
          <span className="text-xl font-black text-indigo-950 font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="text-center max-w-md">
        <h3 className="text-lg font-extrabold text-slate-800">
          {currentStep}
        </h3>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          這通常需要 30 秒到數分鐘，視影片大小與您的裝置效能而定
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xl bg-slate-100 h-3 rounded-full overflow-hidden relative">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-md text-center border-y border-slate-50 py-4">
        <div>
          <span className="block text-xs font-bold text-slate-400">預估剩餘時間</span>
          <span className="mt-1 block text-sm font-extrabold text-indigo-600 font-mono">
            {estimatedTime}
          </span>
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-400">系統狀態</span>
          <span className="mt-1 block text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> 運算中
          </span>
        </div>
      </div>

      {/* Logs and Terminal Toggler */}
      <div className="w-full max-w-xl flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1.5 self-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>{showLogs ? '隱藏進階日誌' : '顯示進階 FFmpeg 日誌'}</span>
        </button>

        {showLogs && (
          <div className="w-full h-32 rounded-xl bg-slate-900 p-3.5 font-mono text-[10px] leading-relaxed text-slate-300 overflow-y-auto border border-slate-800 shadow-inner">
            {logs.length === 0 ? (
              <span className="text-slate-500">等待日誌輸出...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="truncate select-text">
                  <span className="text-indigo-400 font-semibold">[$]</span> {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-100 bg-red-50/50 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
      >
        <XCircle className="h-4 w-4" />
        <span>取消處理</span>
      </button>
    </div>
  );
}
