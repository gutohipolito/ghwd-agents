export type GhwdClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

export declare class GhwdClient {
  constructor(options?: GhwdClientOptions);
  baseUrl: string;
  request(path: string, init?: RequestInit): Promise<unknown>;
  health(): Promise<{ status: string; service: string; version: string; timestamp?: string }>;
  site(): Promise<Record<string, unknown>>;
  catalog(): Promise<Record<string, unknown>>;
  versioning(): Promise<Record<string, unknown>>;
  openapi(): Promise<Record<string, unknown>>;
  pricingMarkdown(): Promise<string>;
}

export default GhwdClient;
