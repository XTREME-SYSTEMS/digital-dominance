import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export const STOCK_VERSION = 'stock-2026-10-v1';
export const STOCK_QUERY = { tags: { $all: [STOCK_VERSION] }, is_active: true, status: 'active' };
const fields = ['name','slug','niche','description','preview_image_url','is_default','tags','sections','sort_order'];
export default function useStockTemplates(query = {}, limit = 20) {
 const condition={...STOCK_QUERY,...query};
 const result=useInfiniteQuery({queryKey:['stock-templates',condition,limit],initialPageParam:null,queryFn:({pageParam})=>base44.entities.TemplateLibrary.filter(condition,{sort:'sort_order',limit,fields,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const count=useQuery({queryKey:['stock-template-count',condition],queryFn:()=>base44.entities.TemplateLibrary.count(condition)});
 return {...result,items:result.data?.pages.flatMap(page=>page.items)||[],total:count.data};
}