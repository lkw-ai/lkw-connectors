# lkw-connectors

Typed clients + resource helpers for ERPs and TMS/WMS systems commonly
used by logistics customers of the LKW low-code workflow platform.

Each package wraps a specific system's API into a small surface that the
LKW workflow editor can leverage via `api_call` nodes or that you can use
directly from your own TypeScript code (workers, scripts, FDE work).

## Packages

| Package | System | Auth | Status |
| --- | --- | --- | --- |
| `@lkw-connectors/core` | shared HTTP client + auth + paginate | — | 0.1.0 |
| `@lkw-connectors/totvs` | TOTVS Protheus REST (pedidos / notas / romaneios / ocorrências) | Basic / LDAP | 0.1.0 — scaffold |
| `@lkw-connectors/sap` | SAP S/4HANA OData v2 (Sales, Outbound Delivery, Shipment) | Basic + CSRF | 0.1.0 — scaffold |
| `@lkw-connectors/bling` | Bling API v3 (pedidos/vendas, NFe, expedições) | OAuth2 Bearer | 0.1.0 — scaffold |
| `@lkw-connectors/tiny` | Tiny ERP v3 public-api | OAuth2 Bearer | 0.1.0 — scaffold |

> **"Scaffold" disclaimer:** the structure, types and endpoints are written
> against publicly documented APIs but have NOT been validated against
> live production instances for every package. When the first customer
> using a given ERP signs up, the FDE on that account should:
> 1. Validate every endpoint shape against the real customer instance,
> 2. Add missing fields to types, and
> 3. Tag the package `1.0.0` once at least one workflow runs end-to-end.

## Install (when published)

```bash
npm install @lkw-connectors/totvs
# or
npm install @lkw-connectors/sap @lkw-connectors/bling
```

## Quick example — TOTVS

```ts
import { TotvsClient } from '@lkw-connectors/totvs';

const totvs = new TotvsClient({
  baseUrl: 'https://protheus.cliente.com.br/rest',
  username: process.env.TOTVS_USER!,
  password: process.env.TOTVS_PASS!,
  tenantId: 'EMPRESA01',
  filial: '0101',
});

// Single
const pedido = await totvs.pedidos.get('PV000123');

// Paginated iterator
for await (const p of totvs.pedidos.iterate({ status: 'LIBERADO' })) {
  console.log(p.numero, p.valor_total);
}

// Create + ação
const novo = await totvs.pedidos.create({ /* ... */ });
await totvs.pedidos.liberar(novo.numero);
```

## Quick example — SAP

```ts
import { SapClient } from '@lkw-connectors/sap';

const sap = new SapClient({
  baseUrl: 'https://s4hana.cliente.com:44300/sap/opu/odata/sap',
  username: process.env.SAP_USER!,
  password: process.env.SAP_PASS!,
  client: '100',
});

const orders = await sap.salesOrders.list({
  $filter: "OverallSDProcessStatus eq 'A'",
  $top: 20,
  $orderby: 'CreationDate desc',
});

// Iterate all matching
for await (const o of sap.salesOrders.iterate({ $filter: "..." })) {
  console.log(o.SalesOrder);
}

// Mutations require CSRF (handled automatically)
await sap.salesOrders.update('1000123', { OverallSDProcessStatus: 'C' });
```

## Quick example — Bling

```ts
import { BlingClient } from '@lkw-connectors/bling';

const bling = new BlingClient({ accessToken: process.env.BLING_TOKEN! });

const pedido = await bling.pedidos.get(12345);
const nota = await bling.notas.emitirAPartirDePedido(12345);
await bling.expedicoes.expedir(12345, { codigoRastreio: 'BR1234567890' });
```

## Architecture

Every package depends on `@lkw-connectors/core`, which provides:

- **`HttpClient`** — `fetch` wrapper with retry + timeout + JSON +
  normalized errors
- **`Auth` strategies** — `BasicAuth`, `BearerAuth`,
  `OAuth2ClientCredentials` (with auto refresh)
- **`paginate()`** — generic async iterator that hides ERP-specific
  pagination conventions (page/size, offset/limit, cursor, `__next`)
- **`ConnectorError`** — normalized error class with `category`
  (`network` / `auth` / `rate_limit` / `server` / `client`) and a
  `retryable` boolean

This lets each connector focus on the ERP-specific quirks (SAP CSRF, TOTVS
tenant header, Bling envelope) without reimplementing the same plumbing.

## Local dev

```bash
npm install           # installs all workspaces + dev deps
npm run build         # tsc -b across all packages (TypeScript Project References)
npm test              # runs vitest in every package that has tests
```

## Roadmap

Next packages, in order of likely demand:

| Package | Trigger |
| --- | --- |
| `@lkw-connectors/ssw` | first SSW customer |
| `@lkw-connectors/datasul` | first Datasul customer (separate from Protheus despite both being TOTVS) |
| `@lkw-connectors/sankhya` | first Sankhya customer |
| `@lkw-connectors/conexos` | first Conexos customer (CRM logístico) |

Repo-level criteria (from
`lkw/.docs/roadmap-bridges-runtimes-mocks.md`): only ship a new package
when there is a real customer using it, OR a clear "first customer
asking" signal. Otherwise it rots.

## License

Apache 2.0.
