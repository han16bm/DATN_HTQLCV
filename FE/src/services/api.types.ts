export type RequestOptions = {
  signal?: AbortSignal;
  scenario?: string;
  skipAuthRefresh?: boolean;
};
export type MutationOptions = RequestOptions & {
  key: string;
  version?: number;
};
export type VersionOptions = MutationOptions & { version: number };
export type HttpOptions = RequestOptions & {
  query?: Record<string, string | number | boolean | null | undefined>;
  version?: number;
  key?: string;
};
