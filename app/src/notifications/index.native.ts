// iPhone・Android：端末の中だけで予約するローカル通知（外部のプッシュ配信サービスは使わない）
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Data, newId, nowParts, useStore } from '../data/store';
import { SNOOZE_MINUTES } from '../config/vetValues';
import { notificationText, planNotifications } from './plan';

// 通知のボタン（ユーザー決定 2026-11-15・ロシアン V6-4）
// お薬：「飲めた」「あとで」「この子のお知らせをお休みする」。一部・吐き出したなどは、通知を開いて記録画面で選ぶ。
// 補液：「やった」「あとで」「この子のお知らせをお休みする」。
// 「あとで」のあとの再通知（最大1回）には「あとで」を付けない。
const CAT_MED = 'care-med';
const CAT_FLUID = 'care-fluid';
const CAT_MED_LAST = 'care-med-last';
const CAT_FLUID_LAST = 'care-fluid-last';
const PAUSE = { identifier: 'pause', buttonTitle: 'この子のお知らせをお休みする', options: { opensAppToForeground: true } };
const LATER = { identifier: 'later', buttonTitle: `あとで（${SNOOZE_MINUTES}分後）`, options: { opensAppToForeground: false } };
const MED_DONE = { identifier: 'done', buttonTitle: '飲めた', options: { opensAppToForeground: false } };
const FLUID_DONE = { identifier: 'done', buttonTitle: 'やった', options: { opensAppToForeground: false } };

const categoryFor = (kind: 'fluid' | 'med', last = false) => (kind === 'med' ? (last ? CAT_MED_LAST : CAT_MED) : last ? CAT_FLUID_LAST : CAT_FLUID);

let categoriesReady: Promise<unknown> | undefined;
function ensureCategories() {
  categoriesReady ??= Promise.all([
    Notifications.setNotificationCategoryAsync(CAT_MED, [MED_DONE, LATER, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_FLUID, [FLUID_DONE, LATER, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_MED_LAST, [MED_DONE, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_FLUID_LAST, [FLUID_DONE, PAUSE]),
  ]).catch(() => undefined);
  return categoriesReady;
}

async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function sync(data: Data) {
  const plan = planNotifications(data);
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (plan.length === 0) return;
  if (!(await ensurePermission())) return;
  await ensureCategories();
  for (const p of plan) {
    const t = p.trigger;
    const trigger: Notifications.NotificationTriggerInput =
      t.type === 'daily'
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute }
        : t.type === 'weekly'
          ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t.date) };
    await Notifications.scheduleNotificationAsync({ content: { title: p.title, body: p.body || undefined, data: p.data, categoryIdentifier: categoryFor(p.data.kind) }, trigger }).catch(() => undefined);
  }
}

/** 予約に関わる設定・記録が変わったら、予約を作り直す */
export function useReminderSync(data: Data) {
  const key = JSON.stringify([data.cats, data.meds, data.fluidReminders, data.settings.quietHours, data.settings.hideNotificationContent]);
  const last = useRef('');
  useEffect(() => {
    if (key === last.current) return;
    const id = setTimeout(() => {
      last.current = key;
      sync(data).catch(() => undefined);
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** 通知のボタン・通知を開いたときの動き。画面の移動は onNavigate で App に伝える */
export function useNotificationActions(onNavigate?: (r: { name: 'meds' | 'fluid' | 'catProfile'; id?: string }) => void) {
  const { data, update } = useStore();
  const dataRef = useRef(data);
  dataRef.current = data;
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;
  useEffect(() => {
    const handle = (res: Notifications.NotificationResponse) => {
      const d = res.notification.request.content.data as { kind?: 'fluid' | 'med'; catId?: string; medId?: string };
      if (!d?.kind || !d.catId) return;
      const cur = dataRef.current;
      const cat = cur.cats.find((c) => c.id === d.catId);
      if (!cat || cat.archived || cat.paused) return; // お休み中・外した猫には何もしない
      if (res.actionIdentifier === 'done') {
        const { date, time } = nowParts();
        if (d.kind === 'fluid') {
          update((x) => ({ ...x, fluids: [...x.fluids, { id: newId(), catId: cat.id, date, time, viaNotification: true }] }));
        } else {
          const med = cur.meds.find((m) => m.id === d.medId);
          if (!med) return;
          update((x) => ({ ...x, medRecords: [...x.medRecords, { id: newId(), catId: cat.id, medId: med.id, medName: med.name, date, time, kind: 'home', result: 'ok', viaNotification: true }] }));
        }
      } else if (res.actionIdentifier === 'pause') {
        // F-10 のお休みの画面へ（その場では止めない。飼い主さんが画面で選ぶ）
        navRef.current?.({ name: 'catProfile', id: cat.id });
      } else if (res.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // 通知を開いたとき：その記録の画面へ（お薬は「一部飲めた」「吐き出した」などをここで選ぶ）
        navRef.current?.({ name: d.kind === 'med' ? 'meds' : 'fluid', id: cat.id });
      } else if (res.actionIdentifier === 'later') {
        const med = cur.meds.find((m) => m.id === d.medId);
        const text = notificationText(cur, d.kind, cat.name, med?.name);
        Notifications.scheduleNotificationAsync({
          content: { title: text.title, body: text.body || undefined, data: d, categoryIdentifier: categoryFor(d.kind, true) },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SNOOZE_MINUTES * 60 },
        }).catch(() => undefined);
      }
    };
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) {
          handle(r);
          Notifications.clearLastNotificationResponseAsync?.().catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => sub.remove();
  }, [update]);
}
