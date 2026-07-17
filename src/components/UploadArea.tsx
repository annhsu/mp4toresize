/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Film, AlertCircle, Trash2, FileVideo } from 'lucide-react';
import { VideoMetadata } from '../types';
import { formatBytes } from '../utils/format';

interface UploadAreaProps {
  onFileSelect: (file: File, metadata: VideoMetadata) => void;
  selectedFile: File | null;
  selectedMetadata: VideoMetadata | null;
  onClear: () => void;
  isProcessing: boolean;
}

export default function UploadArea({
  onFileSelect,
  selectedFile,
  selectedMetadata,
  onClear,
  isProcessing,
}: UploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      setErrorMsg(`不支援的檔案格式：.${extension}。請上傳 MP4、MOV、AVI、WebM 或 MKV 格式。`);
      return;
    }

    // Prepare video metadata
    const metadata: VideoMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Load video element temporarily to get duration and dimensions
    const videoUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = videoUrl;
    
    tempVideo.onloadedmetadata = () => {
      metadata.duration = tempVideo.duration;
      metadata.width = tempVideo.videoWidth;
      metadata.height = tempVideo.videoHeight;
      URL.revokeObjectURL(videoUrl);
      onFileSelect(file, metadata);
    };

    tempVideo.onerror = () => {
      // If metadata loading fails, still allow selection but with partial metadata
      URL.revokeObjectURL(videoUrl);
      onFileSelect(file, metadata);
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isProcessing) return;

    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  // Warning threshold
  const isLargeFile = selectedMetadata && selectedMetadata.size > 150 * 1024 * 1024; // 150MB

  return (
    <div className="w-full flex flex-col gap-4">
      {!selectedFile ? (
        <div
          id="dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-lg shadow-indigo-100'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".mp4,.mov,.avi,.webm,.mkv"
            onChange={handleChange}
            disabled={isProcessing}
          />
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 group-hover:scale-110 transition-transform duration-300 mb-5">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            拖曳影片至此處，或 <span className="text-indigo-600 hover:text-indigo-700 underline underline-offset-4">瀏覽檔案</span>
          </h3>
          <p className="mt-2 text-xs font-medium text-slate-400">
            支援 MP4, MOV, AVI, WebM, MKV 格式
          </p>
          <p className="mt-1 text-xs font-semibold text-purple-600/90 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 inline-block">
            ⚡ 100% 瀏覽器本地沙盒壓縮，無伺服器上傳，極致安全
          </p>

          {errorMsg && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span className="font-medium text-left">{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileVideo className="h-7 w-7" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[280px] sm:max-w-md md:max-w-lg">
                {selectedMetadata?.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  大小: {formatBytes(selectedMetadata?.size || 0)}
                </span>
                {selectedMetadata?.duration && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>長度: {Math.round(selectedMetadata.duration)} 秒</span>
                  </>
                )}
                {selectedMetadata?.width && selectedMetadata?.height && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>解析度: {selectedMetadata.width} × {selectedMetadata.height}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {isLargeFile && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>檔案偏大，處理可能受限</span>
              </div>
            )}
            
            <button
              id="clear-file-btn"
              onClick={onClear}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-3xs"
            >
              <Trash2 className="h-4 w-4" />
              <span>重新選擇</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
