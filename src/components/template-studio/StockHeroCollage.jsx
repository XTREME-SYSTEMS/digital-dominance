import React from 'react';
import { Image } from '@/components/ui/image';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
const positions=['absolute left-0 top-8 w-[55%] -rotate-[8deg]','absolute left-[18%] top-0 z-10 w-[55%] rotate-[3deg]','absolute right-0 top-12 w-[50%] rotate-[6deg]','absolute bottom-0 right-[5%] w-[42%] -rotate-[4deg]'];
export default function StockHeroCollage() {
 const {items}=useStockTemplates({is_default:true,niche:{$in:['Real Estate','Roofing','Legal','Med Spa']}},4);
 return <div className="relative hidden h-[360px] md:block md:h-[440px]">{items.map((t,i)=><div key={t.id} className={`overflow-hidden rounded-xl border border-border bg-card shadow-2xl ${positions[i]}`}><div className="border-b border-border px-3 py-2 text-xs font-bold text-card-foreground">{t.niche} / Stock design</div><Image src={t.preview_image_url} alt={t.name} className="block h-40 w-full"/><div className="p-3 text-sm font-bold text-card-foreground">{t.name.split(' / ')[1]}</div></div>)}</div>;
}