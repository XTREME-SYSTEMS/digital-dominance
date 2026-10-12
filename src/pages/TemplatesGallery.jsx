import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StockTemplateLibrary from '@/components/template-studio/StockTemplateLibrary';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';
export default function TemplatesGallery() {
 const [preview,setPreview]=useState(null);const navigate=useNavigate();
 const choose=template=>navigate('/admin/template-studio',{state:{selectedStockTemplateId:template.id}});
 return <main className="min-h-screen bg-background text-foreground"><nav className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5"><Link to="/" className="font-heading font-bold">Website Launch Engine</Link><div className="flex gap-5 text-sm"><Link to="/pricing">Pricing</Link><Link to="/portal">Portal</Link></div></nav><div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-8"><header><h1 className="font-heading text-3xl font-extrabold">Choose Your Real Template</h1><p className="mt-3 text-muted-foreground">20 industries, 10 original layouts each. Open any card to explore the exact stock website used by the studio.</p></header><StockTemplateLibrary onSelect={setPreview}/></div><StockPreviewDialog template={preview} onClose={()=>setPreview(null)} onChoose={choose}/></main>;
}