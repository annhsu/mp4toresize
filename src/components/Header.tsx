/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Video, RefreshCw } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-slate-100 bg-white py-5 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200">
          <Video className="h-6 w-6" id="logo-icon" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            影片壓縮與轉檔工具
            <span className="hidden sm:inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 border border-indigo-100">
              WebAssembly v2
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-400">
            專業級在線視訊處理工具 · 隱私至上
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-full bg-emerald-50/80 border border-emerald-100 px-4 py-2 text-emerald-700 shadow-2xs">
        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 animate-pulse" id="shield-icon" />
        <span className="text-xs sm:text-sm font-semibold tracking-wide">
          100% 本地處理：檔案完全不會離開您的裝置
        </span>
      </div>
    </header>
  );
}
