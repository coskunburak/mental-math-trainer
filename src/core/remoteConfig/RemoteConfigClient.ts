export interface RemoteConfigClient {
  getString(key: string): string | null;
  getNumber(key: string): number | null;
  getBoolean(key: string): boolean | null;
}

export class NoopRemoteConfigClient implements RemoteConfigClient {
  getString(_key: string): string | null {
    return null;
  }

  getNumber(_key: string): number | null {
    return null;
  }

  getBoolean(_key: string): boolean | null {
    return null;
  }
}
