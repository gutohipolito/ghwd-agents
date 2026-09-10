/**
 * GHWD Agent Discovery SDK — thin typed client for the public read-only API.
 * @example
 * import { GhwdClient } from 'ghwd-sdk';
 * const ghwd = new GhwdClient();
 * console.log(await ghwd.health());
 */
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
}

export default GhwdClient;
