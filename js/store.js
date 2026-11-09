// 端末内（localStorage）へのデータ保存
const KEY = 'ckd-care-v1';

const empty = () => ({
  version: 1,
  profile: { name: '', birthdate: '', sex: '', height: '', dryWeight: '' },
  targets: {},
  labs: [],
  meals: [],
  vitals: [],
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    alert('データを保存できませんでした（ブラウザの保存領域を確認してください）');
  }
  listeners.forEach((fn) => fn(state));
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const store = {
  get: () => state,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  setProfile(profile) {
    state.profile = { ...state.profile, ...profile };
    save();
  },
  setTargets(targets) {
    state.targets = targets;
    save();
  },
  upsert(collection, item) {
    const list = state[collection];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item;
    else list.push({ ...item, id: item.id || uid() });
    list.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    save();
  },
  remove(collection, id) {
    state[collection] = state[collection].filter((x) => x.id !== id);
    save();
  },
  exportJson: () => JSON.stringify(state, null, 2),
  importJson(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.labs) || !Array.isArray(data.meals) || !Array.isArray(data.vitals)) {
      throw new Error('形式が正しくありません');
    }
    state = { ...empty(), ...data };
    save();
  },
  clear() {
    state = empty();
    save();
  },
};
