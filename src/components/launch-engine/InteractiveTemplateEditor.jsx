import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Phone, Mail, Type, Image as ImageIcon, Loader2, Sparkles, Globe, RefreshCw, Save, Layout } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Script injected into the iframe to make elements clickable + hover-highlightable
function injectEditorScript(html) {
  const script = `
<script>
(function(){
  let lastEl=null;
  function clear(){ if(lastEl){ lastEl.style.outline=''; lastEl.style.outlineOffset=''; lastEl=null; } }
  var SEL='a[href^="tel:"], a[href^="mailto:"], h1, h2, h3, h4, img, section, [class*="section"], [class*="hero"], [class*="service"], [class*="gallery"], [class*="contact"], [class*="about"], [class*="faq"], [class*="testimonial"], [class*="cta"], [class*="process"], [class*="feature"]';
  document.addEventListener('mouseover',function(e){
    var t=e.target.closest(SEL);
    if(!t) return;
    clear();
    lastEl=t;
    t.style.outline='2px solid #00a2ff';
    t.style.outlineOffset='2px';
    t.style.cursor='pointer';
  });
  document.addEventListener('mouseout',clear);
  document.addEventListener('click',function(e){
    var t=e.target.closest(SEL);
    if(!t) return;
    e.preventDefault(); e.stopPropagation();
    var type='section';
    if(t.tagName==='A'&&t.href&&t.href.startsWith('tel:')) type='phone';
    else if(t.tagName==='A'&&t.href&&t.href.startsWith('mailto:')) type='email';
    else if(['H1','H2','H3','H4'].includes(t.tagName)) type='heading';
    else if(t.tagName==='IMG') type='image';
    parent.postMessage({source:'tpl-editor',type:type,text:(t.textContent||'').trim().slice(0,500),href:t.href||'',src:t.src||'',alt:t.alt||'',className:t.className||'',tagName:t.tagName,outerHTML:t.outerHTML.slice(0,3000)},'*');
  });
})();
<\/script>`;
  if (html.includes('</body>')) return html.replace('</body>', script + '</body>');
  return html + script;
}

export default function InteractiveTemplateEditor({ template, brand, industry, onClose, onSave }) {
  const [content, setContent] = useState(template?.content || '');
  const [editTarget, setEditTarget] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [businessUrl, setBusinessUrl] = useState('');
  const [businessData, setBusinessData] = useState(null);
  const [ingestError, setIngestError] = useState(null);

  // Apply brand to content on mount
  useEffect(() => {
    let html = template?.content || '';
    if (brand?.colorScheme?.accent && /^#[0-9a-f]{3,6}$/i.test(brand.colorScheme.accent)) {
      html = html.replace(/--accent:#[0-9a-f]{3,6};/gi, `--accent:${brand.colorScheme.accent};`);
      html = html.replace(/--accent-light:#[0-9a-f]{3,6};/gi, `--accent-light:${brand.colorScheme.accentLight};`);
    }
    if (brand?.businessName) {
      const safe = brand.businessName.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      html = html.replace(/Your Business Name/g, safe);
      html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${safe}</h1>`);
    }
    if (brand?.phone) {
      const safe = brand.phone.replace(/\s/g, '');
      html = html.replace(/href="tel:[^"]*"/gi, `href="tel:${safe}"`);
      html = html.replace(/\(555\)\s*\d{3}-\d{4}/g, brand.phone);
    }
    if (brand?.logo?.url) {
      html = html.replace(/<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i, `<img src="${brand.logo.url}" alt="logo" style="max-height:48px;object-fit:contain;" />`);
    }
    setContent(html);
  }, [template, brand]);

  // Listen for clicks from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.source !== 'tpl-editor') return;
      setEditTarget(e.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const srcDoc = useMemo(() => injectEditorScript(content), [content]);

  // Patch content by finding and replacing outerHTML (first occurrence)
  const patchContent = (oldOuter, newOuter) => {
    setContent(prev => {
      const idx = prev.indexOf(oldOuter);
      if (idx === -1) return prev;
      return prev.slice(0, idx) + newOuter + prev.slice(idx + oldOuter.length);
    });
  };

  const applyTextEdit = (newValue) => {
    if (!editTarget) return;
    const { type, outerHTML } = editTarget;
    let newOuter = outerHTML;
    if (type === 'phone') {
      const safe = newValue.replace(/\s/g, '');
      newOuter = outerHTML.replace(/href="tel:[^"]*"/i, `href="tel:${safe}"`);
      newOuter = newOuter.replace(/>([^<]*)<\/a>/, `>${newValue}</a>`);
    } else if (type === 'email') {
      newOuter = outerHTML.replace(/href="mailto:[^"]*"/i, `href="mailto:${newValue}"`);
      newOuter = newOuter.replace(/>([^<]*)<\/a>/, `>${newValue}</a>`);
    } else if (type === 'heading') {
      newOuter = outerHTML.replace(/>([^<]*)</, `>${newValue}<`);
    }
    patchContent(outerHTML, newOuter);
    setEditTarget({ ...editTarget, text: newValue, outerHTML: newOuter });
  };

  const regenerateImage = async (promptOverride) => {
    if (!editTarget) return;
    setRegenerating(true);
    try {
      const res = await base44.functions.invoke('industryTemplateEnhancer', {
        action: 'regenerate_image',
        industry,
        businessName: brand?.businessName || '',
        imageContext: promptOverride || editTarget.alt || 'professional website image',
      });
      const newUrl = res.data?.url;
      if (newUrl) {
        const newOuter = editTarget.outerHTML.replace(/src="[^"]*"/i, `src="${newUrl}"`);
        patchContent(editTarget.outerHTML, newOuter);
        setEditTarget({ ...editTarget, src: newUrl, outerHTML: newOuter });
      }
    } catch (err) {
      console.error('Image regeneration failed:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const regenerateSection = async () => {
    if (!editTarget) return;
    setRegenerating(true);
    try {
      const res = await base44.functions.invoke('industryTemplateEnhancer', {
        action: 'regenerate_section',
        industry,
        businessName: brand?.businessName || 'Your Business Name',
        phone: brand?.phone || '',
        sectionType: editTarget.className || editTarget.tagName,
        currentContent: editTarget.text || '',
      });
      const newHtml = res.data?.html;
      if (newHtml) {
        patchContent(editTarget.outerHTML, newHtml);
        setEditTarget(null);
      }
    } catch (err) {
      console.error('Section regeneration failed:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const ingestBusinessUrl = async () => {
    if (!businessUrl.trim()) return;
    setIngesting(true);
    setIngestError(null);
    try {
      const res = await base44.functions.invoke('businessUrlIngestor', {
        action: 'ingest',
        url: businessUrl.trim(),
      });
      const data = res.data;
      if (data?.error) {
        setIngestError(data.error);
      } else if (data) {
        setBusinessData(data);
        // Auto-apply scraped business data to template
        let html = content;
        if (data.businessName) {
          const safe = data.businessName.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
          html = html.replace(/Your Business Name/g, safe);
        }
        if (data.phone) {
          const safe = data.phone.replace(/\s/g, '');
          html = html.replace(/href="tel:[^"]*"/gi, `href="tel:${safe}"`);
          html = html.replace(/\(555\)\s*\d{3}-\d{4}/g, data.phone);
        }
        if (data.email) {
          html = html.replace(/href="mailto:[^"]*"/gi, `href="mailto:${data.email}"`);
        }
        if (data.address) {
          html = html.replace(/yourbusiness\.com/g, data.address.slice(0, 60));
        }
        setContent(html);
      }
    } catch (err) {
      console.error('Business ingestion failed:', err);
      setIngestError(err.message || 'Failed to scrape URL');
    } finally {
      setIngesting(false);
    }
  };

  const handleSave = () => {
    onSave?.(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex bg-white">
      {/* Template preview — left */}
      <div className="flex-1 relative min-w-0">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00a2ff]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Click-to-Edit Template</h3>
              <p className="text-[10px] text-gray-500">Click any element to edit • {industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-[#00a2ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0090e0]">
              <Save className="h-3.5 w-3.5" /> Save & Continue
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-full pt-14">
          <iframe
            title="Interactive template editor"
            className="h-full w-full border-0"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Edit panel — right */}
      <div className="w-[340px] flex-shrink-0 border-l border-gray-200 overflow-y-auto bg-gray-50">
        {/* Business URL Ingestion */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Sync Your Business URL
          </h4>
          <p className="text-[10px] text-gray-400 mb-2">Enter your existing website — we'll scrape your business info, services & images and auto-fill the template.</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={businessUrl}
              onChange={(e) => setBusinessUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#00a2ff]"
            />
            <button
              onClick={ingestBusinessUrl}
              disabled={!businessUrl.trim() || ingesting}
              className="flex items-center gap-1 rounded-lg bg-[#0a1220] px-3 py-2 text-xs font-bold text-white hover:bg-[#1a2230] disabled:opacity-40"
            >
              {ingesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Scrape
            </button>
          </div>
          {ingestError && <p className="mt-2 text-[10px] text-red-500">{ingestError}</p>}
          {businessData && (
            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-2 text-[10px] text-green-700">
              ✓ Found: {businessData.businessName || 'N/A'} • {businessData.phone || 'No phone'} • {businessData.services?.length || 0} services
            </div>
          )}
        </div>

        {/* Edit target panel */}
        {editTarget ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {editTarget.type === 'phone' && <Phone className="h-4 w-4 text-[#00a2ff]" />}
              {editTarget.type === 'email' && <Mail className="h-4 w-4 text-[#00a2ff]" />}
              {editTarget.type === 'heading' && <Type className="h-4 w-4 text-[#00a2ff]" />}
              {editTarget.type === 'image' && <ImageIcon className="h-4 w-4 text-[#00a2ff]" />}
              {editTarget.type === 'section' && <Layout className="h-4 w-4 text-[#00a2ff]" />}
              <h4 className="text-sm font-bold text-gray-900 capitalize">{editTarget.type} Editor</h4>
            </div>

            {(editTarget.type === 'phone' || editTarget.type === 'email' || editTarget.type === 'heading') && (
              <TextEditPanel editTarget={editTarget} onApply={applyTextEdit} />
            )}
            {editTarget.type === 'image' && (
              <ImageEditPanel editTarget={editTarget} onRegenerate={regenerateImage} regenerating={regenerating} industry={industry} />
            )}
            {editTarget.type === 'section' && (
              <SectionEditPanel editTarget={editTarget} onRegenerate={regenerateSection} regenerating={regenerating} industry={industry} />
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
              <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Click any element in the template</p>
              <p className="text-[10px] text-gray-400 mt-1">Phone, email, headings, images, and sections are all editable</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TextEditPanel({ editTarget, onApply }) {
  const [value, setValue] = useState(editTarget.text || '');
  useEffect(() => setValue(editTarget.text || ''), [editTarget.text]);
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Current value</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#00a2ff]"
        />
      </div>
      <button
        onClick={() => onApply(value)}
        disabled={value === editTarget.text}
        className="w-full rounded-lg bg-[#00a2ff] py-2 text-xs font-bold text-white hover:bg-[#0090e0] disabled:opacity-40"
      >
        Apply Change
      </button>
    </div>
  );
}

function ImageEditPanel({ editTarget, onRegenerate, regenerating, industry }) {
  const [prompt, setPrompt] = useState('');
  return (
    <div className="space-y-3">
      {editTarget.src && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img src={editTarget.src} alt={editTarget.alt} className="w-full h-32 object-cover" />
        </div>
      )}
      {editTarget.alt && <p className="text-[10px] text-gray-400">Alt: {editTarget.alt}</p>}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Image description (optional)</label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`e.g. ${industry} team working on a project`}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#00a2ff]"
        />
      </div>
      <button
        onClick={() => onRegenerate(prompt)}
        disabled={regenerating}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00a2ff] to-[#0066cc] py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
      >
        {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {regenerating ? 'Generating...' : `Regenerate ${industry} Image`}
      </button>
      <p className="text-[10px] text-gray-400 text-center">Uses industry-specific AI image generation optimized for {industry}</p>
    </div>
  );
}

function SectionEditPanel({ editTarget, onRegenerate, regenerating, industry }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
        <p className="text-[10px] text-blue-700">
          This section will be regenerated using {industry}-specific content generation. The AI creates new industry-focused text, headings, and layout.
        </p>
      </div>
      <div className="text-[10px] text-gray-500">
        <strong>Element:</strong> {editTarget.tagName}
        {editTarget.className && <span> • <strong>Class:</strong> {editTarget.className.slice(0, 40)}</span>}
      </div>
      <button
        onClick={onRegenerate}
        disabled={regenerating}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00a2ff] to-[#0066cc] py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
      >
        {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {regenerating ? 'Generating...' : 'Regenerate Section'}
      </button>
    </div>
  );
}