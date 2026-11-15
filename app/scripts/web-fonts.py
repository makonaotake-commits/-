"""Web 版用：同梱フォント（OFL 1.1）を、アプリで使う文字＋かな＋JIS 第1水準の漢字に絞って woff2 にし、
dist/fonts.css（@font-face を data: URI で埋め込んだもの）を作る。外部からはフォントを読み込まない。

使い方：python3 scripts/web-fonts.py（npm run build:web から呼ばれる）
必要なもの：pip install fonttools brotli
"""
import base64
import io
import pathlib

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
NM = ROOT / 'node_modules' / '@expo-google-fonts'
FACES = [
    ('ZenMaruGothic_500Medium', NM / 'zen-maru-gothic' / '500Medium' / 'ZenMaruGothic_500Medium.ttf'),
    ('ZenMaruGothic_700Bold', NM / 'zen-maru-gothic' / '700Bold' / 'ZenMaruGothic_700Bold.ttf'),
    ('BIZUDPGothic_400Regular', NM / 'biz-udpgothic' / '400Regular' / 'BIZUDPGothic_400Regular.ttf'),
    ('BIZUDPGothic_700Bold', NM / 'biz-udpgothic' / '700Bold' / 'BIZUDPGothic_700Bold.ttf'),
]


def chars(kanji: bool) -> str:
    s = set()
    ranges = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2190, 0x2193), (0x2212, 0x2212),
              (0x25A0, 0x25CF), (0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF), (0xFF01, 0xFF60)]
    for a, b in ranges:
        s.update(chr(c) for c in range(a, b + 1))
    # JIS 第1水準の漢字（Shift_JIS 0x889F〜0x9872）。本文用だけに入れる（飼い主さんが入力する名前・メモ用）
    for hi in (range(0x88, 0x99) if kanji else []):
        for lo in range(0x40, 0xFD):
            try:
                s.add(bytes([hi, lo]).decode('shift_jis'))
            except UnicodeDecodeError:
                pass
    # アプリの画面で使っている文字はすべて入れる
    for p in list((ROOT / 'src').rglob('*.ts*')) + [ROOT / 'App.tsx']:
        s.update(p.read_text(encoding='utf-8'))
    return ''.join(sorted(c for c in s if c.isprintable()))


def main():
    body_text = chars(kanji=True)
    heading_text = chars(kanji=False)  # 見出しは画面の文字＋かな＋英数だけ（ない字は本文のフォントで表示）
    css = []
    total = 0
    for family, path in FACES:
        font = TTFont(str(path))
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']  # 著作権・ライセンスの表記を残す
        sub = subset.Subsetter(opts)
        sub.populate(text=heading_text if family.startswith('ZenMaru') else body_text)
        sub.subset(font)
        buf = io.BytesIO()
        font.flavor = 'woff2'
        font.save(buf)
        data = buf.getvalue()
        total += len(data)
        b64 = base64.b64encode(data).decode('ascii')
        css.append(f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b64}) format('woff2');font-display:swap;}}")
    out = ROOT / 'dist' / 'fonts.css'
    out.write_text('\n'.join(css), encoding='utf-8')
    print(f'dist/fonts.css body {len(body_text)} / heading {len(heading_text)} chars, woff2 total {total // 1024} KB')


if __name__ == '__main__':
    main()
