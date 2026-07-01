import { useAppStore } from '../store/useAppStore';

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = useAppStore.getState().theme;
  return theme === 'system' ? getSystemPreference() : theme;
}

export function applyTheme() {
  const effective = getEffectiveTheme();
  if (effective === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initThemeListener() {
  // Aplica tema inicial
  applyTheme();

  // Observa mudanças na store
  useAppStore.subscribe((state, prev) => {
    if (state.theme !== prev.theme) applyTheme();
  });

  // Observa mudanças no sistema (para modo 'system')
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (useAppStore.getState().theme === 'system') applyTheme();
  });
}
