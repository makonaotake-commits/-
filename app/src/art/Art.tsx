// 線画（ペルシャの清書。brand_guide.md §5-4）を描く。明暗は表示に合わせて light／dark の素材を切りかえる。
// 案内役の毛色は、素材のファイル（毛色ごと）を読み分ける。
import React from 'react';
import { SvgXml } from 'react-native-svg';
import { useScheme } from '../config/useTheme';
import type { FurColor } from '../data/store';
import { ART, ArtName } from './artData';

export type ArtPart = 'all' | 'noTail' | 'tailOnly';

function transform(xml: string, opts: { squint: boolean; part: ArtPart }) {
  let s = xml;
  if (opts.part === 'noTail') s = s.replace(/<g id="tail">[\s\S]*?<\/g>/, '');
  if (opts.part === 'tailOnly') {
    const tail = /<g id="tail">[\s\S]*?<\/g>/.exec(s)?.[0] ?? '';
    s = s.replace(/(<svg[^>]*>)[\s\S]*(<\/svg>)/, `$1${tail}$2`);
  }
  s = s.replace(/<g id="head">([\s\S]*?)<\/g>/, (_m, inner: string) => {
    let h = inner;
    if (opts.squint) {
      // 目を細める：目の丸（r="2"）を、ゆるい弧にする
      h = h.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="2" fill="(#[0-9A-Fa-f]+)"><\/circle>/g, (_x, cx: string, cy: string, col: string) => {
        const x = Number(cx);
        const y = Number(cy);
        return `<path d="M${x - 2.5} ${y + 0.5} Q${x} ${y - 1.5} ${x + 2.5} ${y + 0.5}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"></path>`;
      });
    }
    return `<g id="head">${h}</g>`;
  });
  return s;
}

export function Art({ name, width, fur = 'white', squint = false, part = 'all' }: { name: ArtName; width: number; fur?: FurColor; squint?: boolean; part?: ArtPart }) {
  const dark = useScheme() === 'dark';
  // 毛色はペルシャの素材で描き分け済み（しろは接尾辞なし、ほかは _tabby など）。案内役としぐさだけにある
  const set = ART[dark ? 'dark' : 'light'] as Record<string, string>;
  const furName = fur !== 'white' && (name.startsWith('guide_') || name.startsWith('pose_')) ? `${name}_${fur}` : name;
  const raw = set[furName] ?? set[name];
  const vb = /viewBox="([\d.\s-]+)"/.exec(raw)?.[1].split(/\s+/).map(Number) ?? [0, 0, 1, 1];
  const height = (width * vb[3]) / vb[2];
  const xml = transform(raw, { squint, part });
  return <SvgXml xml={xml} width={width} height={height} />;
}

export function artSize(name: ArtName, width: number) {
  const vb = /viewBox="([\d.\s-]+)"/.exec(ART.light[name])?.[1].split(/\s+/).map(Number) ?? [0, 0, 1, 1];
  return { width, height: (width * vb[3]) / vb[2], viewBox: vb };
}
