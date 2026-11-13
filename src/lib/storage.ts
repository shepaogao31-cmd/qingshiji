import { scopedStorage, logger } from '@lark-apaas/client-toolkit-lite';

/**
 * 带命名空间的本地存储封装
 * 预留将来接入云端账号系统的扩展性：替换实现即可迁移
 */

const NS = 'health_app';

function k(key: string): string {
  return `${NS}:${key}`;
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = scopedStorage.getItem(k(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error(`storageGet ${key} failed:`, String(err));
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    scopedStorage.setItem(k(key), JSON.stringify(value));
  } catch (err) {
    logger.error(`storageSet ${key} failed:`, String(err));
  }
}

export function storageRemove(key: string): void {
  try {
    scopedStorage.removeItem(k(key));
  } catch (err) {
    logger.error(`storageRemove ${key} failed:`, String(err));
  }
}
