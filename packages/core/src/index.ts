/**
 * @lkw-connectors/core — building blocks shared by all ERP connectors.
 *
 * Public API:
 *   - HttpClient:     fetch wrapper with retry, timeout, JSON, error normalization
 *   - paginate:       async iterator over paged endpoints
 *   - Auth helpers:   BasicAuth, BearerAuth, OAuth2ClientCredentials
 *   - ConnectorError: normalized error class
 */
export { HttpClient, type HttpClientOptions, type RequestOptions, type HttpResponse } from './http-client.js';
export { paginate, type PaginatorOptions } from './paginate.js';
export {
  BasicAuth,
  BearerAuth,
  OAuth2ClientCredentials,
  type Auth,
} from './auth.js';
export { ConnectorError } from './errors.js';
