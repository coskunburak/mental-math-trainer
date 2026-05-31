export class NeuroPassManifestAssetDataSource {
  async loadManifestJson(): Promise<string | null> {
    try {
      const manifest = require('../../assets/manifest_default.json') as unknown;
      return JSON.stringify(manifest);
    } catch {
      return null;
    }
  }
}
