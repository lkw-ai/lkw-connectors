/**
 * Generic async paginator. Each ERP has its own pagination convention
 * (offset/limit, page/size, cursor, etc) — `paginate` takes a `fetchPage`
 * function and yields items one at a time, hiding all that detail from
 * the caller.
 *
 * Example:
 *   for await (const pedido of paginate({
 *     fetchPage: (cursor) => totvs.get('/pedidos', { query: { page: cursor || 1 } }),
 *     extract: (resp) => resp.data.items,
 *     next: (resp, prev) => resp.data.hasNext ? (Number(prev || 1) + 1) : null,
 *   })) {
 *     console.log(pedido.id);
 *   }
 */

export interface PaginatorOptions<TPage, TItem, TCursor = unknown> {
  fetchPage: (cursor: TCursor | null) => Promise<TPage>;
  extract: (page: TPage) => TItem[];
  /** Returns the next cursor to use, or null to stop. */
  next: (page: TPage, prevCursor: TCursor | null) => TCursor | null;
  /** Hard cap on pages — defensive against runaway loops. Default 1000. */
  maxPages?: number;
  /** Delay between page fetches (ms) — useful for rate-limited APIs. */
  delayMs?: number;
}

export async function* paginate<TPage, TItem, TCursor = unknown>(
  opts: PaginatorOptions<TPage, TItem, TCursor>,
): AsyncIterableIterator<TItem> {
  let cursor: TCursor | null = null;
  let pages = 0;
  const maxPages = opts.maxPages ?? 1000;
  while (pages++ < maxPages) {
    const page = await opts.fetchPage(cursor);
    const items = opts.extract(page);
    for (const it of items) yield it;
    const nextCursor = opts.next(page, cursor);
    if (nextCursor === null || nextCursor === undefined) return;
    cursor = nextCursor;
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
  }
}

/** Convenience: collect all items from a paginator into an array. */
export async function paginateAll<TPage, TItem, TCursor = unknown>(
  opts: PaginatorOptions<TPage, TItem, TCursor>,
): Promise<TItem[]> {
  const out: TItem[] = [];
  for await (const item of paginate(opts)) out.push(item);
  return out;
}
