import React from 'react';
import { Link } from 'react-router-dom';
import StockStudio from '@/components/template-studio/StockStudio';

export default function TemplateStudio() {
  return <div>
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
      <Link to="/admin/xps-studio" className="inline-flex items-center rounded-md border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-foreground hover:bg-amber-500/20">
        Open XPS Approved Mockup Studio · 10 designs →
      </Link>
    </div>
    <StockStudio />
  </div>;
}
