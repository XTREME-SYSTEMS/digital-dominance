import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  getBuiltinStockPage, filterBuiltinStockTemplates, isStockBackendUnavailable,
} from '@/lib/stockCatalogFallback';

export const STOCK_VERSION = 'stock-2026-10-v1';
export const STOCK_QUERY = { tags: { $all: [STOCK_VERSION] }, is_active: true, status: 'active' };
const fields = [
  'name','slug','niche','description','content','preview_image_url',
  'is_default','tags','sections','sort_order'
];

/**
 * On deployed frontends a missing/unseeded Base44 TemplateLibrary MUST NOT
 * make the public gallery disappear. Serve the 200 real checked-in stock designs
 * as labelled previews. Never treat them as synced backend records.
 */
export default function useStockTemplates(query = {}, limit = 20) {
  const condition = { ...STOCK_QUERY, ...query };
  const result = useInfiniteQuery({
    queryKey: ['stock-templates', condition, limit],
    initialPageParam: null,
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) => {
      if (typeof pageParam === 'string' && pageParam.startsWith('builtin:')) {
        return getBuiltinStockPage(condition, { limit, cursor: pageParam });
      }
      try {
        const page = await base44.entities.TemplateLibrary.filter(condition, {
          sort: 'sort_order', limit, fields, ...(pageParam ? {cursor: pageParam} : {})
        });
        if (page && Array.isArray(page.items) && page.items.length) return page;
        // Stock source is checked in even when a new environment has no seed data.
        return getBuiltinStockPage(condition, { limit });
      } catch (error) {
        if (!isStockBackendUnavailable(error)) throw error;
        return getBuiltinStockPage(condition, { limit });
      }
    },
    getNextPageParam: page => page?.has_more ? page.next_cursor : undefined
  });

  const count = useQuery({
    queryKey: ['stock-template-count', condition],
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      try {
        const value = await base44.entities.TemplateLibrary.count(condition);
        const number = Number(value);
        return Number.isFinite(number) && number > 0
          ? number : filterBuiltinStockTemplates(condition).length;
      } catch (error) {
        if (!isStockBackendUnavailable(error)) throw error;
        return filterBuiltinStockTemplates(condition).length;
      }
    }
  });

  const pages = result.data?.pages || [];
  const builtIn = pages.some(page => page.source === 'bundled-stock-preview');
  return {
    ...result,
    items: pages.flatMap(page => page.items || []),
    total: count.data ?? pages[0]?.count,
    builtIn,
    countError: count.error,
  };
}
