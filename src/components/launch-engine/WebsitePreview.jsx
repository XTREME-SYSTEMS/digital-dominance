import React from 'react';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
export default function WebsitePreview({industry,template,brand,overrideHtml}) {
 return <StockTemplatePreview industry={industry} template={template} brand={brand} overrideHtml={overrideHtml}/>;
}