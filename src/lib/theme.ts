import { useAppStore } from '../store/useAppStore';
import { emit } from '@tauri-apps/api/event';

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = useAppStore.getState().theme;
  return theme === 'system' ? getSystemPreference() : theme;
}

export function applyTheme() {
  const effective = getEffectiveTheme();
  const isDark = effective === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  emit('theme-applied', { dark: isDark }).catch(() => {});
}

export function initThemeListener() {
  applyTheme();

  useAppStore.subscribe((state, prev) => {
    if (state.theme !== prev.theme) applyTheme();
  });

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (useAppStore.getState().theme === 'system') applyTheme();
  });
}
