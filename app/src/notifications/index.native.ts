// iPhone・Android：端末の中だけで予約するローカル通知（外部のプッシュ配信サービスは使わない）
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Data, newId, nowParts, useStore } from '../data/store';
import { SNOOZE_MINUTES } from '../config/vetValues';
import { notificationText, planNotifications } from './plan';

const CATEGORY = 'care';
const CATEGORY_LAST = 'care-last'; // 「あとで」のあとの1回（再通知は最大1回まで）

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let categoriesReady: Promise<unknown> | undefined;
function ensureCategories() {
  categoriesReady ??= Promise.all([
    Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: 'done', buttonTitle: 'やった', options: { opensAppToForeground: true } },
      { identifier: 'later', buttonTitle: `あとで（${SNOOZE_MINUTES}分後）`, options: { opensAppToForeground: false } },
    ]),
    Notifications.setNotificationCategoryAsync(CATEGORY_LAST, [{ identifier: 'done', buttonTitle: 'やった', options: { opensAppToForeground: true } }]),
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
    await Notifications.scheduleNotificationAsync({ content: { title: p.title, body: p.body || undefined, data: p.data, categoryIdentifier: CATEGORY }, trigger }).catch(() => undefined);
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

/** 通知の「やった」「あとで」を受け取る */
export function useNotificationActions() {
  const { data, update } = useStore();
  const dataRef = useRef(data);
  dataRef.current = data;
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
          update((x) => ({ ...x, fluids: [...x.fluids, { id: newId(), catId: cat.id, date, time, memo: '通知の「やった」から記録' }] }));
        } else {
          const med = cur.meds.find((m) => m.id === d.medId);
          if (!med) return;
          update((x) => ({ ...x, medRecords: [...x.medRecords, { id: newId(), catId: cat.id, medId: med.id, medName: med.name, date, time, kind: 'home', result: 'ok', memo: '通知の「やった」から記録' }] }));
        }
      } else if (res.actionIdentifier === 'later') {
        const med = cur.meds.find((m) => m.id === d.medId);
        const text = notificationText(cur, d.kind, cat.name, med?.name);
        Notifications.scheduleNotificationAsync({
          content: { title: text.title, body: text.body || undefined, data: d, categoryIdentifier: CATEGORY_LAST },
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
