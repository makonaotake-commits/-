// iPhone・Android：アプリに同梱したフォント（OFL 1.1）を読み込む
import { BIZUDPGothic_400Regular, BIZUDPGothic_700Bold } from '@expo-google-fonts/biz-udpgothic';
import { ZenMaruGothic_500Medium, ZenMaruGothic_700Bold } from '@expo-google-fonts/zen-maru-gothic';
import { useFonts } from 'expo-font';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ BIZUDPGothic_400Regular, BIZUDPGothic_700Bold, ZenMaruGothic_500Medium, ZenMaruGothic_700Bold });
  // 読み込めなかったときは、端末の標準フォントで続ける
  return loaded || !!error;
}
