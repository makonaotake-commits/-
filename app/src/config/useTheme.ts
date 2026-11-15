import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';
import { useStore } from '../data/store';
import { Colors, darkColors, lightColors } from './theme';

/** Web 版：ページの data-theme（表示側の明暗の選択）を優先し、なければ OS の設定を見る */
function readWebScheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark' || t === 'light') return t;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useSystemScheme(): 'light' | 'dark' {
  const native = useColorScheme();
  const [web, setWeb] = useState(readWebScheme);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const update = () => setWeb(readWebScheme());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
    mq?.addEventListener?.('change', update);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', update);
    };
  }, []);
  if (Platform.OS === 'web') return web;
  return native === 'dark' ? 'dark' : 'light';
}

export function useScheme(): 'light' | 'dark' {
  const { data } = useStore();
  const sys = useSystemScheme();
  const a = data.settings.appearance;
  return a === 'system' ? sys : a;
}

export function useColors(): Colors {
  return useScheme() === 'dark' ? darkColors : lightColors;
}

/** OS の「視差効果を減らす（動きを減らす）」設定 */
function useReduceMotion(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setOn(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return on;
}

/** 静かな表示にするか（F-30）。設定の「演出を控えめにする」がオン、または OS の動きを減らす設定がオンのとき。
 *  このときは F-29 の演出（季節・時間帯の日だまり・しぐさ・記録したときの動き）をすべて止める。
 *  カレンダーの葉っぱは記録の印なので、この値では変えない（ui_style_guide.md §9-4）。 */
export function useQuiet(): boolean {
  const { data } = useStore();
  const reduce = useReduceMotion();
  return data.settings.calmMotion || reduce;
}
