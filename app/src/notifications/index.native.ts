// iPhone・Android：端末の中だけで予約するローカル通知（外部のプッシュ配信サービスは使わない）
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { applyFluidUse, applyMedUse, Data, newId, nowParts, useStore } from '../data/store';
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
const PAUSE = { identifier: 'pause', buttonTitle: 'お知らせをお休みする', options: { opensAppToForeground: true } };
const LATER = { identifier: 'later', buttonTitle: `あとで（${SNOOZE_MINUTES}分後）`, options: { opensAppToForeground: false } };
const MED_DONE = { identifier: 'done', buttonTitle: '飲めた', options: { opensAppToForeground: false } };
const FLUID_DONE = { identifier: 'done', buttonTitle: 'やった', options: { opensAppToForeground: false } };

// 今日の記録のお知らせ（F-31）：「記録する」「今日はお休み」「この子のお知らせをお休みする」
const CAT_DAILY = 'care-daily';
const RECORD = { identifier: 'record', buttonTitle: '記録する', options: { opensAppToForeground: true } };
const SKIP_TODAY = { identifier: 'skip', buttonTitle: '今日はお休み', options: { opensAppToForeground: false } };

const categoryFor = (kind: 'fluid' | 'med' | 'daily' | 'visit', last = false) =>
  kind === 'med' ? (last ? CAT_MED_LAST : CAT_MED) : kind === 'fluid' ? (last ? CAT_FLUID_LAST : CAT_FLUID) : kind === 'daily' ? CAT_DAILY : undefined;

let categoriesReady: Promise<unknown> | undefined;
function ensureCategories() {
  categoriesReady ??= Promise.all([
    Notifications.setNotificationCategoryAsync(CAT_MED, [MED_DONE, LATER, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_FLUID, [FLUID_DONE, LATER, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_MED_LAST, [MED_DONE, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_FLUID_LAST, [FLUID_DONE, PAUSE]),
    Notifications.setNotificationCategoryAsync(CAT_DAILY, [RECORD, SKIP_TODAY, PAUSE]),
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
  // 体調の記録の日付も入れる（今日の記録があれば、その日の F-31 を取り消すため）
  const key = JSON.stringify([data.cats, data.meds, data.fluidReminders, data.settings, data.conditions.map((c) => c.catId + c.date)]);
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
export function useNotificationActions(onNavigate?: (r: { name: 'meds' | 'fluid' | 'catProfile' | 'condition' | 'report'; id?: string }) => void) {
  const { data, update } = useStore();
  const dataRef = useRef(data);
  dataRef.current = data;
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;
  useEffect(() => {
    const handle = (res: Notifications.NotificationResponse) => {
      const d = res.notification.request.content.data as { kind?: 'fluid' | 'med' | 'daily' | 'visit'; catId?: string; medId?: string };
      if (!d?.kind || !d.catId) return;
      const cur = dataRef.current;
      const cat = cur.cats.find((c) => c.id === d.catId);
      if (!cat || cat.archived || cat.paused) return; // お休み中・外した猫には何もしない
      const a = res.actionIdentifier;
      if (a === 'pause') return navRef.current?.({ name: 'catProfile', id: cat.id });
      if (d.kind === 'daily') {
        // 「記録する」・通知を開いたとき → 体調の記録へ。「今日はお休み」→ 何もしない（その日の分はもう鳴らない）
        if (a === 'record' || a === Notifications.DEFAULT_ACTION_IDENTIFIER) navRef.current?.({ name: 'condition', id: cat.id });
        return;
      }
      if (d.kind === 'visit') {
        if (a === Notifications.DEFAULT_ACTION_IDENTIFIER) navRef.current?.({ name: 'report', id: cat.id });
        return;
      }
      const kind = d.kind;
      if (res.actionIdentifier === 'done') {
        const { date, time } = nowParts();
        if (kind === 'fluid') {
          update((x) => applyFluidUse({ ...x, fluids: [...x.fluids, { id: newId(), catId: cat.id, date, time, viaNotification: true }] }, cat.id));
        } else {
          const med = cur.meds.find((m) => m.id === d.medId);
          if (!med) return;
          update((x) => applyMedUse({ ...x, medRecords: [...x.medRecords, { id: newId(), catId: cat.id, medId: med.id, medName: med.name, date, time, kind: 'home', result: 'ok', viaNotification: true }] }, med.id, 'ok'));
        }
      } else if (res.actionIdentifier === 'pause') {
        // F-10 のお休みの画面へ（その場では止めない。飼い主さんが画面で選ぶ）
        navRef.current?.({ name: 'catProfile', id: cat.id });
      } else if (res.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // 通知を開いたとき：その記録の画面へ（お薬は「一部飲めた」「吐き出した」などをここで選ぶ）
        navRef.current?.({ name: d.kind === 'med' ? 'meds' : 'fluid', id: cat.id });
      } else if (res.actionIdentifier === 'later') {
        const med = cur.meds.find((m) => m.id === d.medId);
        const text = notificationText(cur, kind, cat.name, med?.name);
        Notifications.scheduleNotificationAsync({
          content: { title: text.title, body: text.body || undefined, data: d, categoryIdentifier: categoryFor(kind, true) },
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

/** 手元の残り（F-32）が、飼い主さんの決めた数を下回ったら1回だけ知らせる。残りを直して上回ったら、また知らせられるようにする */
export function useStockNotices() {
  const { data, update } = useStore();
  useEffect(() => {
    const cats = new Map(data.cats.map((c) => [c.id, c]));
    const active = (catId: string) => {
      const c = cats.get(catId);
      return !!c && !c.archived && !c.paused;
    };
    const hide = data.settings.hideNotificationContent;
    const toNotify: { title: string }[] = [];
    let changed = false;
    const meds = data.meds.map((m) => {
      if (!m.stock || m.stock.notifyBelow === undefined) return m;
      const low = m.stock.remaining < m.stock.notifyBelow;
      if (low && !m.stock.notified && active(m.catId)) {
        toNotify.push({ title: hide ? '手元の残りのお知らせがあります' : `${m.name}の残りが少なくなっています。次の受診や受け取りのときにどうぞ。` });
        changed = true;
        return { ...m, stock: { ...m.stock, notified: true } };
      }
      if (!low && m.stock.notified) {
        changed = true;
        return { ...m, stock: { ...m.stock, notified: false } };
      }
      return m;
    });
    const fluidStock = { ...(data.fluidStock ?? {}) };
    for (const [catId, s] of Object.entries(fluidStock)) {
      if (s.notifyBelow === undefined) continue;
      const low = s.remaining < s.notifyBelow;
      if (low && !s.notified && active(catId)) {
        toNotify.push({ title: hide ? '手元の残りのお知らせがあります' : '輸液の残りが少なくなっています。次の受診や受け取りのときにどうぞ。' });
        fluidStock[catId] = { ...s, notified: true };
        changed = true;
      } else if (!low && s.notified) {
        fluidStock[catId] = { ...s, notified: false };
        changed = true;
      }
    }
    if (!changed) return;
    update((x) => ({ ...x, meds, fluidStock }));
    for (const n of toNotify) {
      Notifications.scheduleNotificationAsync({ content: { title: n.title }, trigger: null }).catch(() => undefined);
    }
  }, [data.meds, data.fluidStock, data.cats, data.settings.hideNotificationContent, update]);
}
