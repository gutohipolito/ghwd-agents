export type GhwdClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

export type AuditCheckStatus = "pass" | "fail" | "warn" | "na";
export type AuditCheckTier = "required" | "recommended" | "emerging";

export type AuditCheck = {
  id: string;
  name: string;
  tier: AuditCheckTier;
  status: AuditCheckStatus;
  score: number;
  maxScore: number;
  details: string;
  fix?: string;
};

export type AuditReport = {
  url: string;
  origin: string;
  scannedAt: string;
  score: number;
  maxScore: number;
  grade: string;
  percent: number;
  checks: AuditCheck[];
  nextSteps: string[];
  cta: {
    brief: string;
    contact: string;
    docs: string;
  };
};

export type ProjectBrief = {
  name: string;
  email: string;
  message: string;
  company?: string;
  budget_band?: string;
  stack?: string;
  site_url?: string;
  source?: string;
  audit_score?: number;
  audit_grade?: string;
};

export declare function normalizeTargetUrl(input: string): URL;
export declare function gradeFromScore(score: number, maxScore: number): string;
export declare function auditSite(opts: {
  url: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<AuditReport>;
export declare function formatAuditReport(
  report: AuditReport,
  opts?: { json?: boolean }
): string;

export declare class GhwdClient {
  constructor(options?: GhwdClientOptions);
  baseUrl: string;
  fetch: typeof fetch;
  request(path: string, init?: RequestInit): Promise<unknown>;
  health(): Promise<{ status: string; service: string; version: string; timestamp?: string }>;
  site(): Promise<Record<string, unknown>>;
  catalog(): Promise<Record<string, unknown>>;
  versioning(): Promise<Record<string, unknown>>;
  openapi(): Promise<Record<string, unknown>>;
  pricingMarkdown(): Promise<string>;
  audit(url: string, opts?: { timeoutMs?: number }): Promise<AuditReport>;
  submitBrief(brief: ProjectBrief): Promise<Record<string, unknown>>;
}

export default GhwdClient;
