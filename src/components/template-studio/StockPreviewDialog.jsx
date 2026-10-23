import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TemplateLivePreview from '@/components/launch-engine/TemplateLivePreview';
import { Button } from '@/components/ui/button';
import { galleryBrief, layoutNameForTemplate, useLayoutHtml } from '@/lib/x1Preview';

export default function StockPreviewDialog({ template, onClose, onChoose }) {
  const brief = useMemo(() => galleryBrief(template), [template]);
  const { html, imageSet } = useLayoutHtml(template, brief);

  return (
    <Dialog open={!!template} onOpenChange={open => !open && onClose()}>
      <DialogContent className="flex h-[90dvh] max-w-6xl flex-col overflow-hidden p-4">
        <DialogTitle className="pr-7">{template?.name}</DialogTitle>
        <DialogDescription>
          The {layoutNameForTemplate(template)} layout: desktop from the top with the mobile view beside it. Scroll inside either view
          to walk the whole page. Every image slot shows approved {imageSet.label} photography
          {imageSet.approved ? '' : ' — none approved yet, so the slots are flagged for review'}. Placeholder details need launch review.
        </DialogDescription>
        <TemplateLivePreview html={html} className="min-h-0 flex-1" showFullScreen showHint />
        {onChoose && <Button onClick={() => { onChoose(template); onClose(); }}>Choose this exact layout</Button>}
      </DialogContent>
    </Dialog>
  );
}