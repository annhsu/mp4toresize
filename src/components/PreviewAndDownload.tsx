/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Play, RefreshCw, Sparkles, FileVideo, CheckCircle2, ChevronRight, FileAudio, ExternalLink } from 'lucide-react';
import { ProcessedResult, VideoMetadata } from '../types';
import { formatBytes } from '../utils/format';

interface PreviewAndDownloadProps {
  originalMetadata: VideoMetadata;
  result: ProcessedResult;
  onReset: () => void;
}

export default function PreviewAndDownload({
  originalMetadata,
  result,
  onReset,
}: PreviewAndDownloadProps) {
  
  const isVideo = ['mp4', 'webm'].includes(result.format);
  const isGif = result.format === 'gif';
  const isAudio = result.format === 'mp3';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6 animate-bounce" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              處理完成！您的檔案已準備就緒
            </h2>
            <p className="text-xs font-semibold text-emerald-600">
              檔案已完全在本地壓縮與轉檔，極致保密安全
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-3xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>處理其他影片</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Preview player */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
            本地即時預覽
          </span>
          
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 aspect-video flex items-center justify-center shadow-md">
            {isVideo && (
              <video
                src={result.blobUrl}
                controls
                playsInline
                className="w-full h-full object-contain max-h-[380px]"
              />
            )}
            
            {isGif && (
              <img
                src={result.blobUrl}
                alt="Compressed GIF preview"
                className="w-full h-full object-contain max-h-[380px]"
              />
            )}
            
            {isAudio && (
              <div className="flex flex-col items-center justify-center p-8 w-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 animate-pulse">
                  <FileAudio className="h-8 w-8" />
                </div>
                <h4 className="text-slate-200 text-sm font-bold mb-3">{result.name}</h4>
                <audio src={result.blobUrl} controls className="w-full max-w-md" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Compression details & Download */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              壓縮數據對比
            </span>

            {/* Side-by-side metric tiles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <span className="block text-xs font-semibold text-slate-400">原始大小</span>
                <span className="mt-1 block text-base font-black text-slate-700 font-mono">
                  {formatBytes(originalMetadata.size)}
                </span>
              </div>
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                <span className="block text-xs font-semibold text-emerald-600">處理後大小</span>
                <span className="mt-1 block text-base font-black text-emerald-700 font-mono">
                  {formatBytes(result.size)}
                </span>
              </div>
            </div>

            {/* Saved indicator card */}
            {result.savedPercentage > 0 ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-100/80 uppercase">
                      總計節省空間
                    </span>
                    <span className="mt-1.5 block text-3xl font-black font-mono tracking-tight">
                      {result.savedPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                
                {/* Visual bar graph comparing original and new */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-100">
                    <span>新檔案僅為原大之 {(100 - result.savedPercentage).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-black/15 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${100 - result.savedPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold leading-relaxed">
                提示：由於編碼器機制，或者您的影片本身已經被高度壓縮，處理後的檔案可能與原檔案大小相近，這是正常現象。
              </div>
            )}
            
            {/* Meta specification */}
            <div className="rounded-xl border border-slate-100 p-3 text-xs font-medium text-slate-400 bg-slate-50/20">
              <span className="block font-bold text-slate-600 mb-1">輸出配置：</span>
              輸出格式: <span className="font-mono text-slate-700 uppercase font-bold">{result.format}</span>
            </div>
          </div>

          {/* Large download button */}
          <a
            href={result.blobUrl}
            download={result.name}
            id="download-result-btn"
            className="w-full py-4 px-6 rounded-2xl text-white font-extrabold tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2 text-base"
          >
            <Download className="h-5 w-5" />
            <span>立即下載檔案</span>
          </a>
        </div>
      </div>
    </div>
  );
}
