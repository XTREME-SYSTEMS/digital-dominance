import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import { Button } from '@/components/ui/button';
export default function StockPreviewDialog({ template, onClose, onChoose }) {
 return <Dialog open={!!template} onOpenChange={open=>!open&&onClose()}><DialogContent className="flex h-[88dvh] max-w-5xl flex-col overflow-hidden p-4">
  <DialogTitle className="pr-7">{template?.name}</DialogTitle><DialogDescription>Exact stock website, not a promotional mockup. Concept imagery and business claims need launch review.</DialogDescription>
  <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">{template&&<StockTemplatePreview template={template}/>}</div>
  {onChoose&&<Button onClick={()=>{onChoose(template);onClose();}}>Choose this exact template</Button>}
 </DialogContent></Dialog>;
}