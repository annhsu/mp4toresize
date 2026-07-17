/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Info, AlertTriangle, AlertCircle, Cpu } from 'lucide-react';

export default function MemoryTips() {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-xs" id="memory-tips-card">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            瀏覽器本地運算重要提醒
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
            本工具<b>100% 於您的瀏覽器內運作</b>。雖然完全保護了您的隱私，但也受限於 WebAssembly 虛擬機的技術框架：
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-amber-900/80 list-disc list-inside">
            <li>
              <span className="font-semibold text-amber-950">檔案大小建議：</span>
              建議上傳 <span className="font-semibold text-indigo-700">150MB 以下</span> 的影片，以避免瀏覽器記憶體不足（Out of Memory）而崩潰。
            </li>
            <li>
              <span className="font-semibold text-amber-950">效能提示：</span>
              處理影片時會耗費大量 CPU 與記憶體，建議關閉其他無用的分頁或高負載軟體以提升速度。
            </li>
            <li>
              <span className="font-semibold text-amber-950">轉檔時間：</span>
              轉檔與壓縮速度取決於您裝置的處理器（CPU）性能，請耐心等候。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
