import { createContext, useContext } from "react";
import type { Repository, AppointmentDraft } from "../data/repository";
import type { Preferences, Catalog, Client, Service } from "../domain/models";
import type { Palette } from "../theme/theme";
export type Route = {
  screen:
    | "agenda"
    | "catalog"
    | "form"
    | "wizard"
    | "details"
    | "history"
    | "stats"
    | "settings"
    | "backup"
    | "about"
    | "choice";
  kind?: Catalog;
  id?: string;
  draft?: AppointmentDraft;
  month?: number;
  year?: number;
  choice?: "theme" | "lang" | "currency" | "dateFormat";
  selectClient?: (c: Client) => void;
  selectServices?: (s: Service[]) => void;
  selectedIds?: string[];
  afterSave?: (id: string) => void;
};
export type AppState = {
  repo: Repository;
  revision: number;
  refresh: () => void;
  p: Preferences;
  colors: Palette;
  push: (r: Route) => void;
  pop: () => void;
  go: (r: Route) => void;
  run: (fn: () => void) => boolean;
  notify: (text: string, undo?: () => void) => void;
};
export const Context = createContext<AppState | null>(null);
export function useApp() {
  const x = useContext(Context);
  if (!x) throw new Error("App provider ausente");
  return x;
}
export const zone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
