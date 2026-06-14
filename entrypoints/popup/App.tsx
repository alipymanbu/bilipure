import { useEffect, useState } from 'react';
import {
  setEnabled,
  setFilterMode,
  watchSettings,
  resetStats,
  type FilterMode,
  type BiliPureSettings,
} from '@/utils/storage';

const MODES: { value: FilterMode; label: string; icon: string; desc: string }[] = [
  { value: 'warn', label: '警示', icon: '⚠️', desc: '显示醒目横幅提醒，仍可观看' },
  { value: 'block', label: '过滤', icon: '🛡️', desc: '直接屏蔽页面，显示护眼壁纸' },
];

export default function App() {
  const [settings, setSettings] = useState<BiliPureSettings | null>(null);

  useEffect(() => {
    return watchSettings(setSettings);
  }, []);

  if (!settings) {
    return (
      <div className="w-72 p-4 text-center text-gray-400">加载中...</div>
    );
  }

  const handleToggle = () => setEnabled(!settings.enabled);
  const handleMode = (mode: FilterMode) => setFilterMode(mode);

  return (
    <div className="w-72 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">BiliPure</span>
          <span className="text-xs text-gray-400">v0.1.0</span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Mode selector */}
      <div className="px-4 py-3">
        <div className="text-xs text-gray-500 mb-2">过滤模式</div>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => handleMode(m.value)}
              disabled={!settings.enabled}
              className={`w-full py-2.5 px-3 text-left rounded-lg border transition-colors ${
                settings.filterMode === m.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{m.icon}</span>
                <span
                  className={`text-sm font-medium ${
                    settings.filterMode === m.value
                      ? 'text-green-700'
                      : 'text-gray-700'
                  }`}
                >
                  {m.label}模式
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 ml-7">
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">累计过滤 AI 视频</div>
            <div className="text-2xl font-bold text-gray-800">
              {settings.totalFiltered}
            </div>
          </div>
          <button
            onClick={resetStats}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
