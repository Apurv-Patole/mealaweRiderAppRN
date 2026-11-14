import { ENDPOINTS, http } from '@/services/http';

export interface AppVersionControlDoc {
  appName?: string;
  appVersion?: string;
}

/** The admin-managed minimum-version document for this app (`AppVersionControl`, keyed by `appName`). */
export const appUpdateApi = {
  getAppVersionByName: (appName: string) =>
    http.get<AppVersionControlDoc>(`${ENDPOINTS.appUpdate.getAppVersionByName}/${appName}`),
};
