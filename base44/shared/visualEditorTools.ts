export const sectionTypes = ['hero', 'text', 'gallery', 'cta', 'faq', 'testimonials', 'spacer'];

const pageSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string', description: 'Lowercase URL slug, e.g. epoxy-flooring-denver, without leading slash.' },
    description: { type: 'string', maxLength: 500 },
    seo_title: { type: 'string' },
    seo_description: { type: 'string', maxLength: 300 },
    sections: {
      type: 'array', minItems: 1, maxItems: 30,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: sectionTypes },
          props: {
            type: 'object', additionalProperties: true,
            description: 'hero: title, subtitle, bg_image, cta_text, cta_link. text: heading, body (Markdown), image_url, image_position (left/right/none). gallery: title, images [{url,caption}]. cta: title, subtitle, button_text, button_link. faq: title, items [{question,answer}]. testimonials: title, items [{quote,name,location,rating}] ONLY for verified supplied testimonials. spacer: height.'
          }
        },
        required: ['type', 'props'], additionalProperties: false
      }
    }
  },
  required: ['title', 'slug', 'sections'], additionalProperties: false
};

export const editorTools = [
  { type: 'function', function: { name: 'get_current_page', description: 'Read the selected canvas page before editing it. Returns null if no page is selected.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  ...['create_page', 'update_page'].map(name => ({ type: 'function', function: {
    name,
    description: name === 'create_page' ? 'Create a complete new page draft in the Visual Editor canvas. A successful call saves and selects it immediately.' : 'Save changes to the selected page. Provide all sections, preserving those the user did not ask to change. Always saves as a draft, not to an external website.',
    parameters: pageSchema
  } }))
];

export const editorInstructions = `You are the Visual Editor BUILDER, not an advisor. You have real create_page, get_current_page and update_page tools connected to the canvas. When asked to build, DO IT using create_page, with complete visible copy in every section. For edits, first read get_current_page, then call update_page with the entire updated page. Preserve unrelated content. A new-page request should create a page; changes to this/the current page should update the selected one. If the current page is empty, populate it with update_page. Never tell the user to import JSON, click blocks, paste content, or build it manually. Do not ask for details already present in the conversation; choose sensible defaults for minor omissions. Ask one concise question only if the request is genuinely unintelligible.
Use only the supported native sections with the exact props documented by the tools. Build real hero, benefits, use cases, process, FAQ and CTA sections for a service page. Markdown supports lists and headings in text.body. Never use HTML, JavaScript or forms. Use relative app links or verified https/tel links, not made-up routes or placeholder '#'. Do not fabricate reviews, ratings, prices, years in business, addresses or local projects. Use images only from supplied verified sources or a previously saved page. If no verified image is supplied, build without an image.
Only these editor tools are available. Do not claim to publish, index, deploy to an external domain, or perform actions you cannot execute. Pages are saved as drafts in this app; an intended external domain can be recorded in description. External publication is separate. Stop after a successful save. All model requests for this builder use Vercel AI Gateway.`;

export function validateEditorPage(input) {
  if (!input || typeof input.title !== 'string' || !input.title.trim()) throw new Error('A page title is required.');
  if (typeof input.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Use a lowercase, hyphenated page slug.');
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 30) throw new Error('Provide between 1 and 30 complete sections.');
  if (JSON.stringify(input).length > 60000) throw new Error('The page is too large; use shorter sections.');
  const data = { title: input.title.trim(), slug: input.slug, sections: [], status: 'draft', is_public: false };
  for (const key of ['description', 'seo_title', 'seo_description']) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') throw new Error(`${key} must be text.`);
      data[key] = input[key].slice(0, key === 'description' ? 500 : key === 'seo_description' ? 300 : 200);
    }
  }
  const ids = new Set();
  data.sections = input.sections.map(section => {
    const props = section.props;
    if (!sectionTypes.includes(section.type) || !props || typeof props !== 'object' || Array.isArray(props)) throw new Error('Unsupported section or invalid properties.');
    const textKeys = { hero: ['title', 'subtitle', 'bg_image', 'cta_text', 'cta_link'], text: ['heading', 'body', 'image_url', 'image_position'], gallery: ['title'], cta: ['title', 'subtitle', 'button_text', 'button_link'], faq: ['title'], testimonials: ['title'] };
    for (const key of textKeys[section.type] || []) if (props[key] !== undefined && typeof props[key] !== 'string') throw new Error(`${key} must be text.`);
    if (section.type === 'hero' && !props.title?.trim()) throw new Error('The hero needs a headline.');
    if (section.type === 'text' && !props.body?.trim()) throw new Error('Text sections need visible body copy.');
    if (['faq', 'testimonials'].includes(section.type)) {
      const required = section.type === 'faq' ? ['question', 'answer'] : ['quote', 'name'];
      if (!Array.isArray(props.items) || !props.items.length || props.items.some(item => !item || required.some(key => typeof item[key] !== 'string' || !item[key].trim()))) throw new Error(`Invalid ${section.type} entries.`);
      if (section.type === 'testimonials' && props.items.some(item => item.rating !== undefined && (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5))) throw new Error('Ratings must be whole numbers between 1 and 5.');
    }
    if (section.type === 'gallery' && (!Array.isArray(props.images) || props.images.some(image => !image || typeof image.url !== 'string' || !/^https:\/\//i.test(image.url)))) throw new Error('Gallery images need valid https URLs.');
    for (const key of ['bg_image', 'image_url']) if (props[key] && !/^https:\/\//i.test(props[key])) throw new Error('Image addresses must use https.');
    for (const key of ['cta_link', 'button_link']) if (props[key] && !/^(https:\/\/|tel:\+?[\d ()-]+$|\/(?!\/)|#[a-z0-9-]+)/i.test(props[key])) throw new Error('Unsupported button destination.');
    if (section.type === 'spacer' && (typeof props.height !== 'number' || props.height < 0 || props.height > 300)) throw new Error('Spacer height must be between 0 and 300.');
    let id = typeof section.id === 'string' && section.id ? section.id : crypto.randomUUID();
    if (ids.has(id)) id = crypto.randomUUID();
    ids.add(id);
    return { id, type: section.type, props };
  });
  return data;
}