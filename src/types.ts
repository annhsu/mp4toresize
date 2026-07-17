/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PresetType = 'high' | 'balanced' | 'extreme' | 'custom';

export interface CompressionConfig {
  preset: PresetType;
  resolution: 'original' | '1080p' | '720p' | '480p' | '360p';
  bitrate: string; // e.g. "2000k" or empty for auto
  fps: string; // e.g. "30" or empty for original
  outputFormat: 'mp4' | 'webm' | 'gif' | 'mp3';
}

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration?: number; // in seconds
  width?: number;
  height?: number;
}

export interface ProcessedResult {
  name: string;
  blobUrl: string;
  size: number;
  savedPercentage: number;
  format: string;
}

export const PRESET_DETAILS = {
  high: {
    name: '高畫質 (視覺無損)',
    desc: '保留極佳的細節，檔案稍微縮小',
    crf: '22',
    bitrateMultiplier: 0.8,
  },
  balanced: {
    name: '平衡 (推薦)',
    desc: '在畫質與檔案大小之間取得最佳平衡',
    crf: '28',
    bitrateMultiplier: 0.5,
  },
  extreme: {
    name: '極致壓縮',
    desc: '大幅減小檔案大小，適合快速傳輸與分享',
    crf: '34',
    bitrateMultiplier: 0.25,
  },
  custom: {
    name: '進階自訂',
    desc: '手動配置解析度、位元率、影格率等參數',
    crf: '28',
    bitrateMultiplier: 1.0,
  },
};
