import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { T } from './src/components/ui';
import { useAppFonts } from './src/config/loadFonts';
import { fonts } from './src/config/theme';
import { useColors, useQuiet, useScheme, useSizes } from './src/config/useTheme';
import { StoreProvider, useStore } from './src/data/store';
import { ConditionScreen } from './src/screens/ConditionScreen';
import { FluidScreen } from './src/screens/FluidScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MedSettingsScreen } from './src/screens/MedSettingsScreen';
import { MedsScreen } from './src/screens/MedsScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RecordReaction } from './src/components/RecordReaction';
import { useCurrentCat } from './src/components/ui';
import { useNotificationActions, useReminderSync } from './src/notifications';
import { ArchivedCatsScreen, CatProfileScreen } from './src/screens/CatProfileScreen';
import { ExportScreen } from './src/screens/ExportScreen';
import { NoticesScreen } from './src/screens/NoticesScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';

type Tab = 'home' | 'review' | 'report' | 'settings';
export type Route = {
  name: Tab | 'condition' | 'fluid' | 'meds' | 'medSettings' | 'catProfile' | 'archivedCats' | 'export' | 'catReport' | 'notices';
  /** 猫・記録の id */
  id?: string;
  /** 日付（YYYY-MM-DD） */
  date?: string;
};

const TABS: [Tab, string][] = [
  ['home', 'ホーム'],
  ['review', '振り返り'],
  ['report', 'レポート'],
  ['settings', '設定'],
];

/** Web 版：ページ全体でスクロールし、背景色とキーボード操作の枠を明暗に合わせる */
function useWebSetup() {
  const c = useColors();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let style = document.getElementById('app-theme') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'app-theme';
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body { background: ${c.background}; color: ${c.text}; }
      body { overflow-y: auto !important; }
      #root { min-height: 100%; height: auto !important; }
      :focus-visible { outline: 3px solid ${c.focus} !important; outline-offset: 2px; }`;
  }, [c]);
}

function Main() {
  const { loaded, data, selectCat } = useStore();
  const quiet = useQuiet();
  const currentCat = useCurrentCat();
  useReminderSync(data);
  const c = useColors();
  const sizes = useSizes();
  const scheme = useScheme();
  useWebSetup();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  // 通知から開いたとき：その猫を選んで、記録またはお休みの画面へ
  useNotificationActions((r) => {
    if (r.id) selectCat(r.id);
    setStack([{ name: 'home' }, r.name === 'catProfile' ? { name: 'catProfile', id: r.id } : { name: r.name }]);
  });
  const [toast, setToast] = useState<string>();
  const route = stack[stack.length - 1];
  const tab = stack[0].name as Tab;

  const scrollTop = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.scrollTo(0, 0);
  };
  const go = (r: Route) => {
    setStack((s) => [...s, r]);
    setToast(undefined);
    scrollTop();
  };
  const back = (msg?: string) => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setToast(msg);
    scrollTop();
  };
  const switchTab = (t: Tab) => {
    setStack([{ name: t }]);
    setToast(undefined);
    scrollTop();
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(undefined), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!loaded) return <T>読み込んでいます…</T>;
  if (!data.settings.onboarded) return <OnboardingScreen />;

  let screen: React.ReactNode;
  switch (route.name) {
    case 'condition':
      screen = <ConditionScreen back={back} initialDate={route.date} />;
      break;
    case 'fluid':
      screen = <FluidScreen back={back} editId={route.id} />;
      break;
    case 'meds':
      screen = <MedsScreen back={back} go={go} />;
      break;
    case 'medSettings':
      screen = <MedSettingsScreen back={back} />;
      break;
    case 'report':
      screen = <ReportScreen />;
      break;
    case 'settings':
      screen = <SettingsScreen go={go} />;
      break;
    case 'review':
      screen = <ReviewScreen go={go} />;
      break;
    case 'catProfile':
      screen = <CatProfileScreen catId={route.id} back={back} />;
      break;
    case 'archivedCats':
      screen = <ArchivedCatsScreen back={() => back()} openReport={(id) => go({ name: 'catReport', id })} />;
      break;
    case 'catReport':
      screen = <ReportScreen catId={route.id} onBack={() => back()} />;
      break;
    case 'notices':
      screen = <NoticesScreen back={() => back()} />;
      break;
    case 'export':
      screen = <ExportScreen back={() => back()} />;
      break;
    default:
      screen = <HomeScreen go={go} />;
  }

  const fixed = (extra: object) => (Platform.OS === 'web' ? ({ position: 'fixed', ...extra } as object) : {});

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {screen}
      </KeyboardAvoidingView>
      {toast ? (
        <View
          nativeID="toast"
          accessibilityLiveRegion="polite"
          style={{
            backgroundColor: c.surface,
            borderWidth: 2,
            borderColor: c.text,
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginHorizontal: 20,
            marginBottom: 8,
            ...fixed({ left: 0, right: 0, bottom: 72, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }),
          }}
        >
          {/* 記録したときの小さなしぐさ（F-29）。静かな表示・お休み中の猫では出さず、文字だけ */}
          {toast === '記録しました' && !quiet && !currentCat?.paused ? <RecordReaction fur={data.settings.guideFur} /> : null}
          <Text style={{ fontFamily: fonts.body, color: c.text, fontSize: sizes.body, textAlign: 'center', flexShrink: 1 }}>{toast}</Text>
        </View>
      ) : null}
      <View
        nativeID="tabbar"
        style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: c.border, backgroundColor: c.surface, ...fixed({ left: 0, right: 0, bottom: 0 }) }}
      >
        {TABS.map(([k, label]) => {
          const on = tab === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => switchTab(k)}
              style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderTopWidth: 4, borderTopColor: on ? c.primary : 'transparent' }}
            >
              <Text style={{ fontFamily: on ? fonts.heading : fonts.headingMedium, fontSize: sizes.label, color: c.text }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Root() {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']}>
      <Main />
    </SafeAreaView>
  );
}

export default function App() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return null; // 読み込み中はスプラッシュのまま
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
