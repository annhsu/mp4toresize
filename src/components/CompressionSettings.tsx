/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Sparkles, Sliders, Info, Zap, Shield, HelpCircle, AudioLines, Image } from 'lucide-react';
import { CompressionConfig, PresetType, PRESET_DETAILS, VideoMetadata } from '../types';

interface CompressionSettingsProps {
  metadata: VideoMetadata;
  config: CompressionConfig;
  onChange: (config: CompressionConfig) => void;
  isProcessing: boolean;
  onStart: () => void;
}

export default function CompressionSettings({
  metadata,
  config,
  onChange,
  isProcessing,
  onStart,
}: CompressionSettingsProps) {
  
  const handlePresetChange = (preset: PresetType) => {
    let newConfig = { ...config, preset };
    
    if (preset !== 'custom') {
      // Auto-set values based on preset to guide the user visually
      if (preset === 'high') {
        newConfig.resolution = 'original';
        newConfig.bitrate = '';
        newConfig.fps = '';
      } else if (preset === 'balanced') {
        newConfig.resolution = 'original'; // keep scale, CRF does the job
        newConfig.bitrate = '';
        newConfig.fps = '';
      } else if (preset === 'extreme') {
        newConfig.resolution = '720p'; // scale down slightly for extreme
        newConfig.bitrate = '';
        newConfig.fps = '24';
      }
    }
    onChange(newConfig);
  };

  const updateField = (key: keyof CompressionConfig, value: any) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const outputFormats: Array<{ value: CompressionConfig['outputFormat']; label: string; icon: string }> = [
    { value: 'mp4', label: 'MP4 (最相容)', icon: 'video' },
    { value: 'webm', label: 'WebM (網頁友善)', icon: 'chrome' },
    { value: 'gif', label: 'GIF (動態圖檔)', icon: 'image' },
    { value: 'mp3', label: 'MP3 (僅音訊擷取)', icon: 'audio' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">
            壓縮與轉檔配置
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            選擇最合適的壓縮方案或進行自訂微調
          </p>
        </div>
      </div>

      {/* Output format picker */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>1. 選擇輸出格式</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {outputFormats.map((format) => {
            const active = config.outputFormat === format.value;
            return (
              <button
                type="button"
                key={format.value}
                onClick={() => updateField('outputFormat', format.value)}
                disabled={isProcessing}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                  active
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600 shadow-xs shadow-indigo-100'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-700 bg-white'
                }`}
              >
                {format.value === 'mp3' ? (
                  <AudioLines className={`h-5 w-5 mb-1.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                ) : format.value === 'gif' ? (
                  <Image className={`h-5 w-5 mb-1.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                ) : (
                  <div className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md mb-1.5 border uppercase ${
                    active ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-50 border-slate-100'
                  }`}>
                    {format.value}
                  </div>
                )}
                <span className="text-xs font-bold">{format.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {config.outputFormat !== 'mp3' && (
        <>
          {/* Compression Presets */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700">2. 選擇壓縮等級</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {(Object.keys(PRESET_DETAILS) as PresetType[]).map((pKey) => {
                const details = PRESET_DETAILS[pKey];
                const isActive = config.preset === pKey;
                return (
                  <button
                    type="button"
                    key={pKey}
                    onClick={() => handlePresetChange(pKey)}
                    disabled={isProcessing}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs shadow-indigo-100'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-extrabold ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {details.name}
                      </span>
                      {pKey === 'balanced' && (
                        <span className="rounded-full bg-indigo-100/80 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 uppercase">
                          推薦
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-slate-400 leading-snug font-medium">
                      {details.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Custom Settings */}
          {config.preset === 'custom' && (
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  輸出解析度 (Resolution)
                </label>
                <select
                  value={config.resolution}
                  onChange={(e) => updateField('resolution', e.target.value)}
                  disabled={isProcessing}
                  className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="original">保持原始解析度</option>
                  <option value="1080p">1080p (1920 × 1080)</option>
                  <option value="720p">720p (1280 × 720)</option>
                  <option value="480p">480p (854 × 480)</option>
                  <option value="360p">360p (640 × 360)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  自訂位元率 (Bitrate, 如 1000k)
                </label>
                <input
                  type="text"
                  placeholder="例如: 1500k (留空為自動)"
                  value={config.bitrate}
                  onChange={(e) => updateField('bitrate', e.target.value)}
                  disabled={isProcessing}
                  className="w-full text-sm font-mono font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  影格率限制 (FPS, 如 30)
                </label>
                <select
                  value={config.fps}
                  onChange={(e) => updateField('fps', e.target.value)}
                  disabled={isProcessing}
                  className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">保持原始影格率</option>
                  <option value="60">60 fps</option>
                  <option value="30">30 fps</option>
                  <option value="24">24 fps</option>
                  <option value="15">15 fps</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Output MP3 specific description */}
      {config.outputFormat === 'mp3' && (
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-800 leading-relaxed font-semibold">
          <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            您已選擇 <b>MP3 (僅音訊擷取)</b>。這將從您的影片中擷取最高品質的音軌。壓縮與畫質設定會自動套用音訊最大相容性規格，並忽略視訊壓縮參數。
          </span>
        </div>
      )}

      {/* Output GIF specific description */}
      {config.outputFormat === 'gif' && (
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-start gap-2 text-xs text-amber-800 leading-relaxed font-semibold">
          <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            提示：<b>GIF 格式</b> 本身沒有壓縮編碼優勢，過長或高解析度的影片轉成 GIF 會導致檔案異常巨大。建議長度控制在 5-10 秒內，影格率設為 15 fps 以下。
          </span>
        </div>
      )}

      {/* Start Button */}
      <button
        type="button"
        id="start-process-btn"
        disabled={isProcessing}
        onClick={onStart}
        className="w-full mt-2 py-4 px-6 rounded-2xl text-white font-extrabold tracking-wide bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 hover:shadow-lg disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-base"
      >
        {config.outputFormat === 'mp3' ? '開始擷取 MP3 音訊' : '開始壓縮與轉檔處理'}
      </button>
    </div>
  );
}
