import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { hasRuntimeBase44AppId } from '@/lib/base44Binding';
import { filterLocalStock, getLocalStockPage } from './localStockData.js';

export const STOCK_VERSION = 'stock-2026-10-v1';
export const STOCK_QUERY = { tags: { $all: [STOCK_VERSION] }, is_active: true, status: 'active' };
const fields = ['name','slug','niche','description','preview_image_url','is_default','tags','sections','sort_order'];

/**
 * Preview works from the verified compiler when no Base44 app was explicitly
 * bound at build time. It does not silently connect to a production tenant.
 * No generated record is represented as a live published website.
 */
export default function useStockTemplates(query = {}, limit = 20) {
 const condition={...STOCK_QUERY,...query};
 const source=hasRuntimeBase44AppId?'base44':'local-compiled';
 const result=useInfiniteQuery({
   queryKey:['stock-templates',source,condition,limit],
   initialPageParam:null,
   queryFn:({pageParam})=>hasRuntimeBase44AppId
     ? base44.entities.TemplateLibrary.filter(condition,{sort:'sort_order',limit,fields,...(pageParam?{cursor:pageParam}:{})})
     : getLocalStockPage(condition,limit,pageParam),
   getNextPageParam:page=>page.has_more?page.next_cursor:undefined,
 });
 const count=useQuery({
   queryKey:['stock-template-count',source,condition],
   queryFn:()=>hasRuntimeBase44AppId
     ? base44.entities.TemplateLibrary.count(condition)
     : filterLocalStock(condition).length,
 });
 return {...result,items:result.data?.pages.flatMap(page=>page.items)||[],total:count.data};
}
