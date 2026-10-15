import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { filterLocalStock } from '@/lib/localStockCatalog';
export const STOCK_VERSION = 'stock-2026-10-v1';
export const STOCK_QUERY = { tags: { $all: [STOCK_VERSION] }, is_active: true, status: 'active' };
const fields = ['name','slug','niche','description','preview_image_url','is_default','tags','sections','sort_order'];
const remoteConfigured = Boolean(appParams.appBaseUrl);
// If the Base44 service is unavailable or unseeded, the original compiler is
// still capable of showing actual full-page website designs. Never call these live sites.
export default function useStockTemplates(query = {}, limit = 20) {
  const queryIdentity = JSON.stringify(query);
  const condition = useMemo(() => ({ ...STOCK_QUERY, ...query }), [queryIdentity]);
  const [localPages, setLocalPages] = useState(1);
  useEffect(() => setLocalPages(1), [queryIdentity, limit]);
  const localMatching = useMemo(() => filterLocalStock(condition), [condition]);
  const result = useInfiniteQuery({
    queryKey: ['stock-templates', condition, limit],
    enabled: remoteConfigured,
    retry: 1,
    initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.TemplateLibrary.filter(condition, {
      sort: 'sort_order', limit, fields, ...(pageParam ? { cursor: pageParam } : {})
    }),
    getNextPageParam: page => page?.has_more ? page.next_cursor : undefined,
  });
  const count = useQuery({
    queryKey: ['stock-template-count', condition],
    enabled: remoteConfigured, retry: 1,
    queryFn: () => base44.entities.TemplateLibrary.count(condition),
  });
  const remoteItems = result.data?.pages?.flatMap(page => page.items || []) || [];
  const localMode = !remoteConfigured || result.isError || (!remoteItems.length && !result.isFetching);
  const items = localMode ? localMatching.slice(0, Math.max(1,localPages) * limit) : remoteItems;
  return {
    ...result,
    items,
    total: localMode ? localMatching.length : (count.data ?? remoteItems.length),
    source: localMode ? 'original_compiler_previews' : 'base44_catalog',
    isLoading: localMode ? false : result.isLoading,
    isFetchingNextPage: localMode ? false : result.isFetchingNextPage,
    error: localMode ? null : result.error,
    hasNextPage: localMode ? items.length < localMatching.length : result.hasNextPage,
    fetchNextPage: localMode ? () => { setLocalPages(p => p + 1); return Promise.resolve(); } : result.fetchNextPage,
  };
}