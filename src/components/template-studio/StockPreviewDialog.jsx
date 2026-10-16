import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import { Button } from '@/components/ui/button';

export default function StockPreviewDialog({ template, onClose, onChoose }) {
  const number = Number.isInteger(template?.sort_order) ? template.sort_order + 1 : null;
  const label = template?.niche || 'Website';
  return (
    <Dialog open={!!template} onOpenChange={open => !open && onClose()}>
      <DialogContent className="flex h-[90dvh] w-[min(96vw,1100px)] max-w-6xl flex-col overflow-hidden p-3 sm:p-5">
        <DialogTitle className="pr-7 text-lg sm:text-xl">{label}{number ? ` · Design ${number}` : ' · Website preview'}</DialogTitle>
        <DialogDescription>
          This is the actual full-page website design. Scroll inside to explore it.
          Photos and business information are examples until approved for launch.
        </DialogDescription>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
          {template && <StockTemplatePreview template={template} />}
        </div>
        {onChoose && (
          <Button onClick={() => { onChoose(template); onClose(); }}>Choose this design</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
