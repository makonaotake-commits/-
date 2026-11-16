// リマインダー（F-06）の通知の予定を作る。端末の中だけで計算し、外部には送らない。
// 守ること：お休み中・一覧から外した猫には出さない（F-10）／夜間の時間帯には鳴らさない（F-11）／
// 内容を隠す設定ではロック画面に猫の名前・内容を出さない（F-24）／せかす言葉は使わない。
import type { Data, Reminder } from '../data/store';

const p2 = (n: number) => (n < 10 ? '0' + n : String(n));
const toDateStr = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export type PlannedTrigger =
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; weekday: number /* 1=日曜 */; hour: number; minute: number }
  | { type: 'date'; date: string /* ISO */ };

export type PlannedNotification = {
  title: string;
  body: string;
  trigger: PlannedTrigger;
  data: { kind: 'fluid' | 'med' | 'daily' | 'visit'; catId: string; medId?: string };
};

/** iOS は予約できる通知が 64 件までなので、余裕を見て抑える */
export const MAX_SCHEDULED = 60;
/** 「◯日おき」は日付ごとに予約するので、先の日数を区切る */
const EVERY_N_DAYS_AHEAD = 28;

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 夜間に鳴らさない時間帯に入るか（日をまたぐ時間帯にも対応） */
export function inQuietHours(time: string, q: Data['settings']['quietHours']) {
  if (!q.enabled) return false;
  const t = toMin(time);
  const s = toMin(q.start);
  const e = toMin(q.end);
  if (s === e) return false;
  return s < e ? t >= s && t < e : t >= s || t < e;
}

export function notificationText(data: Data, kind: 'fluid' | 'med', catName: string, medName?: string) {
  if (data.settings.hideNotificationContent) return { title: 'ケアの時間です', body: '' };
  return kind === 'fluid'
    ? { title: `${catName}ちゃんの補液の時間です`, body: '' }
    : { title: `${catName}ちゃんのお薬の時間です`, body: medName ?? '' };
}

function triggersFor(r: Reminder, time: string, now: Date): PlannedTrigger[] {
  const [hour, minute] = time.split(':').map(Number);
  if (r.freq.kind === 'daily') return [{ type: 'daily', hour, minute }];
  if (r.freq.kind === 'weekdays') return r.freq.days.map((d) => ({ type: 'weekly' as const, weekday: d + 1, hour, minute }));
  // ◯日おき：開始日から n 日ごとの日付を、先の数週間ぶんだけ予約する
  const out: PlannedTrigger[] = [];
  const start = new Date(r.freq.start + 'T00:00:00');
  const n = Math.max(1, r.freq.n);
  for (let i = 0; i <= EVERY_N_DAYS_AHEAD; i++) {
    const d = new Date(now);
    d.setHours(hour, minute, 0, 0);
    d.setDate(d.getDate() + i);
    const diff = Math.round((new Date(toDateStr(d) + 'T00:00:00').getTime() - start.getTime()) / 86400000);
    if (diff < 0 || diff % n !== 0 || d <= now) continue;
    out.push({ type: 'date', date: d.toISOString() });
  }
  return out;
}

/** 今日の記録のお知らせ（F-31）を止めるまでの日数：この日数続けて記録がなければ、記録されるまで送らない */
export const DAILY_NOTICE_STOP_DAYS = 3;
/** 今日の記録のお知らせを、先に何日分まで予約するか（アプリを開いたとき・記録したときに作り直す） */
const DAILY_NOTICE_DAYS_AHEAD = 3;

const dayDiff = (a: string, b: string) => Math.round((new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000);

/** F-31 が「記録されるまでお休み」になっているか（設定画面で状態を見せるだけ。通知はしない：V6-2） */
export function dailyNoticeStopped(data: Data, catId: string, today: string) {
  const last = data.conditions.filter((c) => c.catId === catId).map((c) => c.date).sort().pop();
  if (!last) return false;
  return dayDiff(today, last) > DAILY_NOTICE_STOP_DAYS;
}

function dailyNotices(data: Data, now: Date): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const dn = data.settings.dailyNotice;
  if (!dn?.enabled || inQuietHours(dn.time, data.settings.quietHours)) return out;
  const [hour, minute] = dn.time.split(':').map(Number);
  for (const cat of data.cats) {
    if (cat.archived || cat.paused) continue;
    const dates = new Set(data.conditions.filter((c) => c.catId === cat.id).map((c) => c.date));
    const last = Array.from(dates).sort().pop();
    if (!last) continue; // 記録が一度もない猫には送らない
    for (let i = 0; i < DAILY_NOTICE_DAYS_AHEAD; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(hour, minute, 0, 0);
      if (d <= now) continue;
      const ds = toDateStr(d);
      if (dates.has(ds)) continue; // その日の記録があれば送らない
      // 直前に3日続けて記録がなければ、それ以降は記録されるまで送らない
      if (dayDiff(ds, last) - 1 >= DAILY_NOTICE_STOP_DAYS) continue;
      const title = data.settings.hideNotificationContent ? '今日の記録は、手が空いたときにどうぞ。' : `${cat.name}ちゃんの今日の記録は、手が空いたときにどうぞ。`;
      out.push({ title, body: '', trigger: { type: 'date', date: d.toISOString() }, data: { kind: 'daily', catId: cat.id } });
    }
  }
  return out;
}

function visitNotices(data: Data, now: Date): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const vn = data.settings.visitNotice;
  if (!vn?.enabled || inQuietHours(vn.time, data.settings.quietHours)) return out;
  const [hour, minute] = vn.time.split(':').map(Number);
  for (const cat of data.cats) {
    if (cat.archived || cat.paused || !cat.nextVisit) continue;
    const d = new Date(cat.nextVisit + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    d.setHours(hour, minute, 0, 0);
    if (d <= now) continue;
    const title = data.settings.hideNotificationContent ? '明日は通院日です' : `明日は${cat.name}ちゃんの通院日です`;
    out.push({ title, body: '獣医師に見せるレポートを作れます。', trigger: { type: 'date', date: d.toISOString() }, data: { kind: 'visit', catId: cat.id } });
  }
  return out;
}

export function planNotifications(data: Data, now = new Date()): PlannedNotification[] {
  const out: PlannedNotification[] = [...visitNotices(data, now), ...dailyNotices(data, now)];
  for (const cat of data.cats) {
    if (cat.archived || cat.paused) continue; // お休み中・一覧から外した猫には出さない
    const fr = data.fluidReminders[cat.id];
    if (fr?.enabled) {
      for (const t of fr.times) {
        if (inQuietHours(t, data.settings.quietHours)) continue;
        const text = notificationText(data, 'fluid', cat.name);
        for (const trigger of triggersFor(fr, t, now)) out.push({ ...text, trigger, data: { kind: 'fluid', catId: cat.id } });
      }
    }
    for (const m of data.meds) {
      if (m.catId !== cat.id || m.kind === 'hospital' || !m.reminder.enabled) continue;
      for (const t of m.reminder.times) {
        if (inQuietHours(t, data.settings.quietHours)) continue;
        const text = notificationText(data, 'med', cat.name, m.name);
        for (const trigger of triggersFor(m.reminder, t, now)) out.push({ ...text, trigger, data: { kind: 'med', catId: cat.id, medId: m.id } });
      }
    }
  }
  // くり返しの予約を先に、日付ごとの予約は近い順に並べて、上限で切る
  const rank = (p: PlannedNotification) => (p.trigger.type === 'date' ? 1 : 0);
  out.sort((a, b) => rank(a) - rank(b) || (a.trigger.type === 'date' && b.trigger.type === 'date' ? a.trigger.date.localeCompare(b.trigger.date) : 0));
  return out.slice(0, MAX_SCHEDULED);
}
