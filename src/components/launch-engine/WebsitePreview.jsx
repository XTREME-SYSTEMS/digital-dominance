import React from 'react';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
export default function WebsitePreview({industry,template,brand}) {
 return <StockTemplatePreview industry={industry} template={template} brand={brand}/>;
}