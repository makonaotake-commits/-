// Web 版：通知は鳴らさない（ブラウザの試作）。iPhone・Android は index.native.ts。
import type { Data } from '../data/store';

export function useReminderSync(_data: Data) {}
export function useNotificationActions(_onNavigate?: (r: { name: 'meds' | 'fluid' | 'catProfile'; id?: string }) => void) {}
