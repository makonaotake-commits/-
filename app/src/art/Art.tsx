// 線画（ペルシャの清書。brand_guide.md §5-4）を描く。明暗は表示に合わせて light／dark の素材を切りかえる。
// 案内役の毛色は、顔（#head の面）の色だけを差し替える（仮。柄の描き分けは素材側の対応待ち）。
import React from 'react';
import { SvgXml } from 'react-native-svg';
import { darkColors, lightColors } from '../config/theme';
import { useScheme } from '../config/useTheme';
import type { FurColor } from '../data/store';
import { ART, ArtName } from './artData';

export type ArtPart = 'all' | 'noTail' | 'tailOnly';

function furFill(fur: FurColor, dark: boolean) {
  const c = dark ? darkColors : lightColors;
  switch (fur) {
    case 'black':
      // 暗い表示では、地より暗い色で顔を塗る（目・鼻はそのまま）
      return dark ? c.background : c.text;
    case 'brown':
      return c.primaryTint;
    case 'gray':
      return c.border;
    case 'tabby':
      return c.primaryTint;
    case 'calico':
      return c.accentTint;
    default:
      return c.surface;
  }
}

function transform(xml: string, opts: { dark: boolean; fur: FurColor; squint: boolean; part: ArtPart }) {
  const c = opts.dark ? darkColors : lightColors;
  let s = xml;
  if (opts.part === 'noTail') s = s.replace(/<g id="tail">[\s\S]*?<\/g>/, '');
  if (opts.part === 'tailOnly') {
    const tail = /<g id="tail">[\s\S]*?<\/g>/.exec(s)?.[0] ?? '';
    s = s.replace(/(<svg[^>]*>)[\s\S]*(<\/svg>)/, `$1${tail}$2`);
  }
  s = s.replace(/<g id="head">([\s\S]*?)<\/g>/, (_m, inner: string) => {
    let h = inner;
    if (opts.fur !== 'white') {
      // 顔の面の色
      h = h.replace(new RegExp(`fill="${c.surface}"`, 'g'), `fill="${furFill(opts.fur, opts.dark)}"`);
      // くろ：目・鼻を地の色にして見えるようにする
      if (opts.fur === 'black' && !opts.dark) h = h.replace(new RegExp(`(<circle[^>]*?)fill="${c.text}"`, 'g'), `$1fill="${c.surface}"`);
    }
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
  const raw = ART[dark ? 'dark' : 'light'][name];
  const vb = /viewBox="([\d.\s-]+)"/.exec(raw)?.[1].split(/\s+/).map(Number) ?? [0, 0, 1, 1];
  const height = (width * vb[3]) / vb[2];
  const xml = transform(raw, { dark, fur, squint, part });
  return <SvgXml xml={xml} width={width} height={height} />;
}

export function artSize(name: ArtName, width: number) {
  const vb = /viewBox="([\d.\s-]+)"/.exec(ART.light[name])?.[1].split(/\s+/).map(Number) ?? [0, 0, 1, 1];
  return { width, height: (width * vb[3]) / vb[2], viewBox: vb };
}
