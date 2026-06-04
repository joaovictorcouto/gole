import { useEffect, useState } from "react";
import { api } from "./api";

// Session-only dev unlock. Stored in module-level memory; cleared when
// the app is closed. Never persisted.
let sessionUnlocked = false;
const listeners = new Set<(v: boolean) => void>();

export function unlockDev(password: string): Promise<boolean> {
  return api.verifyDevPassword(password).then((ok) => {
    if (ok) {
      sessionUnlocked = true;
      listeners.forEach((fn) => fn(true));
    }
    return ok;
  });
}

export function lockDev() {
  sessionUnlocked = false;
  listeners.forEach((fn) => fn(false));
}

export function useIsDev(): boolean {
  const [v, setV] = useState(sessionUnlocked);
  useEffect(() => {
    listeners.add(setV);
    return () => { listeners.delete(setV); };
  }, []);
  return v;
}

export function useDevGateAvailable(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    api.devGateAvailable().then(setV).catch(() => setV(false));
  }, []);
  return v;
}
