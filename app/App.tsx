import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { T } from './src/components/ui';
import { colors, fonts, sizes } from './src/config/theme';
import { StoreProvider, useStore } from './src/data/store';
import { ConditionScreen } from './src/screens/ConditionScreen';
import { FluidScreen } from './src/screens/FluidScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MedSettingsScreen } from './src/screens/MedSettingsScreen';
import { MedsScreen } from './src/screens/MedsScreen';
import { ReportScreen } from './src/screens/ReportScreen';

export type Route = { name: 'home' | 'condition' | 'fluid' | 'meds' | 'medSettings' | 'report' };

function useWebSetup() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fonts.googleFontsUrl;
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = `
      html, body { background: ${colors.background}; }
      body { overflow-y: auto !important; }
      #root { min-height: 100%; height: auto !important; }
      @media print {
        #tabbar, #noprint-back, #noprint-controls, #toast { display: none !important; }
        body { background: #fff; }
      }`;
    document.head.appendChild(style);
    document.title = 'Nyan Kidney 試作';
  }, []);
}

function Main() {
  const { loaded } = useStore();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [toast, setToast] = useState<string>();
  const route = stack[stack.length - 1];
  const tab = stack[0].name === 'report' ? 'report' : 'home';

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
  const switchTab = (t: 'home' | 'report') => {
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

  let screen: React.ReactNode;
  switch (route.name) {
    case 'condition':
      screen = <ConditionScreen back={back} />;
      break;
    case 'fluid':
      screen = <FluidScreen back={back} />;
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
    default:
      screen = <HomeScreen go={go} />;
  }

  const tabBar = (
    <View
      nativeID="tabbar"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        ...(Platform.OS === 'web' ? ({ position: 'fixed', left: 0, right: 0, bottom: 0 } as object) : {}),
      }}
    >
      {(
        [
          ['home', 'ホーム'],
          ['report', 'レポート'],
        ] as const
      ).map(([k, label]) => {
        const on = tab === k;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => switchTab(k)}
            style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderTopWidth: 4, borderTopColor: on ? colors.sage : 'transparent' }}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: sizes.label, color: colors.text, fontWeight: on ? '700' : '400' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>{screen}</View>
      {toast ? (
        <View
          nativeID="toast"
          accessibilityLiveRegion="polite"
          style={{
            backgroundColor: colors.text,
            padding: 16,
            borderRadius: 12,
            marginHorizontal: 20,
            marginBottom: 8,
            ...(Platform.OS === 'web' ? ({ position: 'fixed', left: 0, right: 0, bottom: 72, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' } as object) : {}),
          }}
        >
          <Text style={{ fontFamily: fonts.body, color: colors.background, fontSize: sizes.body, textAlign: 'center' }}>{toast}</Text>
        </View>
      ) : null}
      {tabBar}
    </View>
  );
}

export default function App() {
  useWebSetup();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <StoreProvider>
          <Main />
        </StoreProvider>
      </SafeAreaView>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
