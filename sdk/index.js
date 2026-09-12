/**
 * GHWD Agent Discovery SDK — thin typed client for the public read-only API,
 * plus a remote agent-readiness auditor for any site.
 * @example
 * import { GhwdClient, auditSite } from 'ghwd-sdk';
 * const ghwd = new GhwdClient();
 * console.log(await ghwd.health());
 * console.log(await auditSite({ url: 'https://example.com' }));
 */
import { auditSite, formatAuditReport, gradeFromScore, normalizeTargetUrl } from "./audit.js";

const DEFAULT_BASE = "https://ghwd.com.br";

export class GhwdClient {
  /**
   * @param {{ baseUrl?: string, fetch?: typeof fetch }} [options]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE).replace(/\/$/, "");
    this.fetch = options.fetch || globalThis.fetch.bind(globalThis);
  }

  /**
   * @param {string} path
   * @param {RequestInit} [init]
   */
  async request(path, init = {}) {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep text
    }
    if (!res.ok) {
      const err = new Error(`GHWD API ${res.status} ${path}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  /** @returns {Promise<{status: string, service: string, version: string}>} */
  health() {
    return this.request("/api/v1/health");
  }

  /** @returns {Promise<object>} */
  site() {
    return this.request("/api/v1/site");
  }

  /** @returns {Promise<object>} */
  catalog() {
    return this.request("/api/v1/catalog");
  }

  /** @returns {Promise<object>} */
  versioning() {
    return this.request("/api/v1/versioning");
  }

  /** @returns {Promise<object>} */
  openapi() {
    return this.request("/openapi.json");
  }

  /** Fetch markdown pricing bands as text. */
  async pricingMarkdown() {
    const res = await this.fetch(`${this.baseUrl}/pricing.md`, {
      headers: { Accept: "text/markdown" },
    });
    if (!res.ok) throw new Error(`GHWD pricing ${res.status}`);
    return res.text();
  }

  /**
   * Audit any public site for agent-readiness signals.
   * @param {string} url
   * @param {{ timeoutMs?: number }} [opts]
   */
  audit(url, opts = {}) {
    return auditSite({ url, fetch: this.fetch, timeoutMs: opts.timeoutMs });
  }

  /**
   * Submit a project brief (public intake — no auth).
   * @param {{
   *   name: string,
   *   email: string,
   *   message: string,
   *   company?: string,
   *   budget_band?: string,
   *   stack?: string,
   *   site_url?: string,
   *   source?: string,
   *   audit_score?: number,
   *   audit_grade?: string
   * }} brief
   */
  submitBrief(brief) {
    return this.request("/api/v1/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brief, source: brief.source || "sdk" }),
    });
  }
}

export { auditSite, formatAuditReport, gradeFromScore, normalizeTargetUrl };
export default GhwdClient;
