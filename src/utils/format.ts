/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a size in bytes to a human-readable string.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats seconds into a MM:SS or HH:MM:SS string.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '未知';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Estimates the remaining processing time based on progress and elapsed time.
 */
export function estimateRemainingTime(
  progressPercentage: number,
  startTime: number
): string {
  if (progressPercentage <= 2 || !startTime) return '計算中...';
  
  const elapsed = (Date.now() - startTime) / 1000; // in seconds
  const totalEstimatedTime = (elapsed / progressPercentage) * 100;
  const remaining = Math.max(0, totalEstimatedTime - elapsed);

  if (remaining < 60) {
    return `約 ${Math.round(remaining)} 秒`;
  }
  const min = Math.floor(remaining / 60);
  const sec = Math.round(remaining % 60);
  return `約 ${min} 分 ${sec} 秒`;
}
