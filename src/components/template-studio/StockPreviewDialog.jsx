import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TemplateLivePreview from '@/components/launch-engine/TemplateLivePreview';
import { Button } from '@/components/ui/button';

export default function StockPreviewDialog({ template, onClose, onChoose }) {
  return (
    <Dialog open={!!template} onOpenChange={open => !open && onClose()}>
      <DialogContent className="flex h-[90dvh] max-w-6xl flex-col overflow-hidden p-4">
        <DialogTitle className="pr-7">{template?.name}</DialogTitle>
        <DialogDescription>
          This template's exact page: desktop top to bottom with the mobile view beside it. Concept imagery and business claims need launch review.
        </DialogDescription>
        {template && (
          <TemplateLivePreview
            template={template}
            fit="width"
            mobileClassName="w-[30%] min-w-[120px] shrink-0"
            className="min-h-0 flex-1"
          />
        )}
        {onChoose && <Button onClick={() => { onChoose(template); onClose(); }}>Choose this exact template</Button>}
      </DialogContent>
    </Dialog>
  );
}