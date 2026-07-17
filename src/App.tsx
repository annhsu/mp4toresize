/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Sparkles, Play, ShieldAlert, Cpu, AlertCircle, HelpCircle, HardDrive, RefreshCw } from 'lucide-react';

import Header from './components/Header';
import UploadArea from './components/UploadArea';
import CompressionSettings from './components/CompressionSettings';
import ProcessingState from './components/ProcessingState';
import PreviewAndDownload from './components/PreviewAndDownload';
import MemoryTips from './components/MemoryTips';

import { CompressionConfig, VideoMetadata, ProcessedResult } from './types';
import { formatBytes } from './utils/format';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<VideoMetadata | null>(null);
  const [config, setConfig] = useState<CompressionConfig>({
    preset: 'balanced',
    resolution: 'original',
    bitrate: '',
    fps: '',
    outputFormat: 'mp4',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('計算中...');
  const [currentStep, setCurrentStep] = useState('等待執行...');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Large file warning modal state
  const [showLargeFileWarning, setShowLargeFileWarning] = useState(false);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const startTimeRef = useRef<number>(0);

  // Auto scroll logs inside console if shown
  useEffect(() => {
    if (logs.length > 0) {
      const logsElement = document.getElementById('ffmpeg-terminal-logs');
      if (logsElement) {
        logsElement.scrollTop = logsElement.scrollHeight;
      }
    }
  }, [logs]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (result?.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
    };
  }, [result]);

  const handleFileSelect = (file: File, metadata: VideoMetadata) => {
    setSelectedFile(file);
    setSelectedMetadata(metadata);
    setErrorMsg(null);
    setResult(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedMetadata(null);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
  };

  const startProcessing = () => {
    if (!selectedFile || !selectedMetadata) return;

    // Check if file is larger than 150MB
    const sizeInMB = selectedMetadata.size / (1024 * 1024);
    if (sizeInMB > 150) {
      setShowLargeFileWarning(true);
    } else {
      executeCompression();
    }
  };

  const executeCompression = async () => {
    if (!selectedFile || !selectedMetadata) return;

    setShowLargeFileWarning(false);
    setIsProcessing(true);
    setProgress(0);
    setEstimatedTime('計算中...');
    setLogs([]);
    setErrorMsg(null);
    setResult(null);
    startTimeRef.current = Date.now();

    const ffmpeg = ffmpegRef.current || new FFmpeg();
    ffmpegRef.current = ffmpeg;

    // Set up events
    ffmpeg.on('progress', ({ progress: p }) => {
      const pct = Math.min(Math.max(p * 100, 0), 99); // max 99 until write finishes
      setProgress(pct);
    });

    ffmpeg.on('log', ({ message }) => {
      setLogs((prev) => [...prev, message]);
    });

    try {
      // Step 1: Load FFmpeg
      setCurrentStep('正在載入編碼核心 (WebAssembly)...');
      
      const isMultiThread = typeof window !== 'undefined' && window.crossOriginIsolated;
      const coreBase = isMultiThread 
        ? 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
        : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      if (!ffmpeg.loaded) {
        setLogs((prev) => [
          ...prev, 
          `正在載入 FFmpeg ${isMultiThread ? '多執行緒核心' : '單執行緒相容核心'}...`
        ]);
        await ffmpeg.load({
          coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, 'application/wasm'),
          ...(isMultiThread ? {
            workerURL: await toBlobURL(`${coreBase}/ffmpeg-core.worker.js`, 'text/javascript'),
          } : {}),
        });
        setLogs((prev) => [...prev, 'FFmpeg 載入成功！']);
      }

      // Step 2: Write input file to Virtual File System
      setCurrentStep('正在讀取您的影片檔案...');
      const inputExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${inputExt}`;
      const outputExt = config.outputFormat;
      const outputName = `output.${outputExt}`;

      setLogs((prev) => [...prev, `正在寫入輸入檔案到虛擬記憶體: ${inputName}...`]);
      await ffmpeg.writeFile(inputName, await fetchFile(selectedFile));

      // Step 3: Formulate FFmpeg command
      setCurrentStep('編碼進行中 (這需要一段時間)...');
      setLogs((prev) => [...prev, '正在初始化壓縮參數...']);

      const args: string[] = ['-i', inputName];

      if (outputExt === 'mp3') {
        // Audio extraction only
        args.push('-vn', '-c:a', 'libmp3lame', '-b:a', '192k');
      } else if (outputExt === 'gif') {
        // High quality GIF scaling
        args.push('-vf', 'fps=10,scale=360:-1:flags=lanczos', '-loop', '0');
      } else {
        // Video MP4 or WebM encoding
        if (outputExt === 'mp4') {
          // Ultrafast preset is crucial for speed in WebAssembly!
          args.push('-vcodec', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k');
        } else {
          // webm
          args.push('-vcodec', 'libvpx', '-cpu-used', '4', '-b:v', '800k', '-c:a', 'libvorbis');
        }

        // Apply compression levels
        if (config.preset === 'high') {
          args.push('-crf', '22');
        } else if (config.preset === 'balanced') {
          args.push('-crf', '28');
        } else if (config.preset === 'extreme') {
          args.push('-crf', '34');
          // Downscale high res to 720p to save massive computation
          if (selectedMetadata.width && selectedMetadata.width > 1280) {
            args.push('-vf', 'scale=1280:-2');
          }
        } else if (config.preset === 'custom') {
          const videoFilters: string[] = [];
          if (config.resolution !== 'original') {
            const targetWidth = 
              config.resolution === '1080p' ? 1920 : 
              config.resolution === '720p' ? 1280 : 
              config.resolution === '480p' ? 854 : 640;
            videoFilters.push(`scale=${targetWidth}:-2`);
          }
          if (config.fps) {
            videoFilters.push(`fps=${config.fps}`);
          }
          if (videoFilters.length > 0) {
            args.push('-vf', videoFilters.join(','));
          }

          if (config.bitrate) {
            args.push('-b:v', config.bitrate);
          } else {
            args.push('-crf', '28'); // default CRF
          }
        }
      }

      args.push(outputName);

      setLogs((prev) => [...prev, `執行命令: ffmpeg ${args.join(' ')}`]);
      
      // Start clock tracking
      startTimeRef.current = Date.now();

      // Run FFmpeg CLI command
      const exitCode = await ffmpeg.exec(args);

      if (exitCode !== 0) {
        throw new Error(`FFmpeg 執行失敗，代碼為 ${exitCode}。`);
      }

      // Step 4: Retrieve and process result
      setCurrentStep('壓縮完成，正在生成預覽與下載連結...');
      setLogs((prev) => [...prev, '讀取輸出檔案...']);
      const outputData = await ffmpeg.readFile(outputName);
      
      // Determine blob type
      let mimeType = 'video/mp4';
      if (outputExt === 'webm') mimeType = 'video/webm';
      else if (outputExt === 'gif') mimeType = 'image/gif';
      else if (outputExt === 'mp3') mimeType = 'audio/mp3';

      const blob = new Blob([outputData as Uint8Array], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Clean up VFS to save RAM memory leaks inside browser
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (cleanupErr) {
        console.warn('VFS cleanup issue:', cleanupErr);
      }

      // Calculate saving percentage
      const originalSize = selectedMetadata.size;
      const compressedSize = blob.size;
      const savedPercentage = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

      setProgress(100);
      setResult({
        name: `compressed_${selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name}.${outputExt}`,
        blobUrl,
        size: compressedSize,
        savedPercentage,
        format: outputExt,
      });
      setIsProcessing(false);

    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(
        (err as Error).message || 
        '視訊解碼或處理期間發生未知錯誤。這可能是由於瀏覽器記憶體限制或不支援的視訊編碼格式。'
      );
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Single-threaded wasm cannot be force aborted halfway elegantly without thread destruction.
    // The safest and most seamless way in browsers is to simply trigger window reload or reset local context.
    if (confirm('確定要取消處理嗎？這將會重置轉檔程序與當前進度。')) {
      window.location.reload();
    }
  };

  // Listen to estimated time based on progress
  useEffect(() => {
    if (isProcessing && progress > 2 && startTimeRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const totalEstimated = (elapsed / progress) * 100;
      const remaining = Math.max(0, totalEstimated - elapsed);
      if (remaining < 60) {
        setEstimatedTime(`約 ${Math.round(remaining)} 秒`);
      } else {
        const min = Math.floor(remaining / 60);
        const sec = Math.round(remaining % 60);
        setEstimatedTime(`約 ${min} 分 ${sec} 秒`);
      }
    }
  }, [progress, isProcessing]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="app-root">
      {/* SaaS Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        
        {/* Banner Section */}
        <div className="flex flex-col items-center text-center gap-2 max-w-3xl mx-auto" id="banner-text">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            <span>本地 WebAssembly 科技 · 資訊絕不外洩</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mt-2 leading-tight">
            隱私極致安全的 <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">瀏覽器端影片壓縮</span>
          </h2>
          <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-semibold">
            影片檔案不離開您的電腦，免下載安裝，一鍵轉換為 MP4, WebM, GIF 或純音訊 MP3
          </p>
        </div>

        {/* Upload Area Component */}
        <UploadArea
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          selectedMetadata={selectedMetadata}
          onClear={handleClear}
          isProcessing={isProcessing}
        />

        {/* Dynamic State Machine Output */}
        {errorMsg && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex flex-col sm:flex-row sm:items-center gap-3.5 animate-fadeIn" id="error-banner">
            <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-950">轉檔處理失敗</h4>
              <p className="mt-1 text-xs text-red-700 font-semibold leading-relaxed">
                {errorMsg}
              </p>
              <p className="mt-2 text-[11px] text-red-600/90 font-medium">
                排除建議：如果您的影片大小超過 100MB，建議改用其他本機專業剪輯工具，或重試並在進階選項中調低輸出參數。
              </p>
            </div>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white rounded-xl border border-red-200 hover:bg-red-50 text-xs font-bold text-red-600 shrink-0 self-end sm:self-auto transition-all shadow-3xs"
            >
              重新上傳
            </button>
          </div>
        )}

        {/* Step Flow Panels */}
        {!isProcessing && !result && selectedFile && selectedMetadata && (
          <CompressionSettings
            metadata={selectedMetadata}
            config={config}
            onChange={setConfig}
            isProcessing={isProcessing}
            onStart={startProcessing}
          />
        )}

        {isProcessing && (
          <ProcessingState
            progress={progress}
            estimatedTime={estimatedTime}
            currentStep={currentStep}
            logs={logs}
            onCancel={handleCancel}
          />
        )}

        {result && selectedMetadata && (
          <PreviewAndDownload
            originalMetadata={selectedMetadata}
            result={result}
            onReset={handleClear}
          />
        )}

        {/* Static Memory Warnings Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <MemoryTips />
          
          {/* Why use this card */}
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-5 shadow-xs flex flex-col justify-between" id="intro-card">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  為什麼選擇此工具？
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-semibold">
                  傳統的線上影片壓縮工具，需要您將大容量的影片「上傳至雲端伺服器」進行轉換。這不僅耗費巨量網路流量，更隱藏著個人、企業機密影片外洩的風險。
                </p>
                <p className="mt-2 text-xs leading-relaxed text-indigo-600/90 font-bold">
                  我們的工具採用尖端 WebAssembly 封裝技術，直接在您電腦本地的核心運算沙盒內操作，100% 捍衛您的數據隱私。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive FAQ Section */}
        <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs flex flex-col gap-6" id="faq-section">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-extrabold text-slate-800">常見問題與疑難排除</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <h4 className="font-bold text-slate-800">Q1: 為什麼影片壓縮時進度條不動或崩潰？</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed font-semibold">
                這通常是因為瀏覽器記憶體（RAM）不足以負載大型影片。由於 WebAssembly 有記憶體定址空間限制，建議上傳 150MB 以下的影片，或關閉其他耗記憶體的分頁再重試。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Q2: 這個工具真的不會上傳我的影片嗎？</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed font-semibold">
                是的！我們採用 WebAssembly 技術，將整個視訊編碼器（FFmpeg）載入至您的瀏覽器內部。所有壓縮與轉檔程序均在您的本機硬體中執行，絕不會將任何檔案傳送至外部伺服器。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Q3: 壓縮後的影片會存在哪裡？</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed font-semibold">
                完成後，壓縮後的影片會暫存在瀏覽器的記憶體中（Blob URL）。您必須點擊「立即下載檔案」將其儲存至您的裝置，關閉分頁後該暫存檔案會自動釋放。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Q4: 支援哪些裝置與系統？</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed font-semibold">
                支援大多數現代桌上型電腦與筆電（Chrome、Edge、Safari、Firefox）以及現代智慧型手機。部分舊款手機可能因系統記憶體限制而無法順利執行大型轉檔。
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Large File Warning Modal (Custom dialog) */}
      {showLargeFileWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="warning-modal">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                大檔案本地處理警告
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-semibold">
                您上傳的影片檔案大小為 <span className="font-bold text-indigo-600">{formatBytes(selectedMetadata?.size || 0)}</span>，已超出瀏覽器本地 150MB 的推薦上限。
              </p>
              <p className="mt-2 text-xs leading-relaxed text-amber-700 bg-amber-50 border border-amber-100/60 p-3 rounded-xl font-bold">
                這有可能導致您的網頁分頁因為記憶體超載（Out of Memory）而自動崩潰或重設。是否仍要嘗試在本地進行壓縮與格式轉換？
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowLargeFileWarning(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消並重新選擇
              </button>
              <button
                type="button"
                onClick={executeCompression}
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-colors shadow-xs shadow-amber-100"
              >
                繼續嘗試本地壓縮
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant minimalist footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-6 text-center text-xs font-medium text-slate-400">
        <p>© 2026 影片壓縮與轉檔工具 · 完全本地安全沙盒處理 · 無任何流量外洩</p>
      </footer>
    </div>
  );
}
