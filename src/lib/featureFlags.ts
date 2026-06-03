export const featureFlags = {
  smartMode: true,
  achievements: true,
  statistics: true,
  cloudSync: false,
  mobileCompanion: false,
  smartWatch: false,
  aiSuggestions: false,
  adaptiveHydration: false,
  customThemes: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
