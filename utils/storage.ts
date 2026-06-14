import { storage } from 'wxt/utils/storage';

export type FilterMode = 'warn' | 'block';

export interface BiliPureSettings {
  enabled: boolean;
  filterMode: FilterMode;
  totalFiltered: number;
}

const DEFAULTS: BiliPureSettings = {
  enabled: true,
  filterMode: 'warn',
  totalFiltered: 0,
};

const enabledItem = storage.defineItem<boolean>('sync:enabled', { fallback: DEFAULTS.enabled });
const filterModeItem = storage.defineItem<FilterMode>('sync:filterMode', { fallback: DEFAULTS.filterMode });
const totalFilteredItem = storage.defineItem<number>('local:totalFiltered', { fallback: DEFAULTS.totalFiltered });

export async function getSettings(): Promise<BiliPureSettings> {
  const [enabled, filterMode, totalFiltered] = await Promise.all([
    enabledItem.getValue(),
    filterModeItem.getValue(),
    totalFilteredItem.getValue(),
  ]);
  return { enabled, filterMode, totalFiltered };
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await enabledItem.setValue(enabled);
}

export async function setFilterMode(mode: FilterMode): Promise<void> {
  await filterModeItem.setValue(mode);
}

export async function incrementFiltered(count: number): Promise<number> {
  const current = await totalFilteredItem.getValue();
  const next = current + count;
  await totalFilteredItem.setValue(next);
  return next;
}

export async function resetStats(): Promise<void> {
  await totalFilteredItem.setValue(0);
}

export function watchSettings(callback: (settings: BiliPureSettings) => void): () => void {
  let current: BiliPureSettings = { ...DEFAULTS };

  const unwatchers = [
    enabledItem.watch((val) => {
      current = { ...current, enabled: val };
      callback(current);
    }),
    filterModeItem.watch((val) => {
      current = { ...current, filterMode: val };
      callback(current);
    }),
    totalFilteredItem.watch((val) => {
      current = { ...current, totalFiltered: val };
      callback(current);
    }),
  ];

  getSettings().then((s) => {
    current = s;
    callback(current);
  });

  return () => unwatchers.forEach((unwatch) => unwatch());
}
