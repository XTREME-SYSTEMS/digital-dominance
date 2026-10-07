import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { completeGateway } from '../../shared/aiGateway.ts';
import { editorTools, editorInstructions, validateEditorPage } from '../../shared/visualEditorTools.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to build a page.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only admins can edit pages.' }, { status: 403 });
    const body = await req.json();
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 12000) return Response.json({ error: 'Enter a page request of up to 12,000 characters.' }, { status: 400 });
    const pageId = typeof body.page_id === 'string' ? body.page_id : null;
    const history = Array.isArray(body.history) ? body.history.slice(-8).filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string').map(item => ({ role: item.role, content: item.content.slice(0, 8000) })) : [];
    const messages = [{ role: 'system', content: `${editorInstructions}\nSelected page id: ${pageId || 'none'}.\nVerified reference for xtremepolishingsystems.com ONLY: Xtreme Polishing Systems supplies epoxy coatings and concrete preparation equipment. Its public representative phone is +18779585264. Do not claim a Denver installation crew, address, tenure or customer reviews. A verified illustrative product/application image is https://xtremepolishingsystems.com/cdn/shop/files/ProductImage_ActionShot_T2000_OLD.png?v=1786130168&width=1280 . This is not verified Denver project photography.` }, ...history, { role: 'user', content: body.message.trim() }];
    let currentPage = null;
    let readCurrent = false;
    for (let step = 0; step < 4; step++) {
      const result = await completeGateway({ model: 'anthropic/claude-opus-4.7', messages, tools: editorTools, tool_choice: step === 0 ? 'required' : 'auto', parallel_tool_calls: false, max_tokens: 7000 });
      const assistant = result.choices?.[0]?.message;
      if (!assistant) throw new Error('The gateway returned no builder response.');
      const calls = assistant.tool_calls || [];
      if (!calls.length) return Response.json({ ok: true, message: assistant.content || 'Describe the page you want me to build.', page: null });
      messages.push(assistant);
      for (const call of calls) {
        try {
          const name = call.function?.name;
          if (name === 'get_current_page') {
            currentPage = pageId ? await base44.entities.DynamicPage.get(pageId) : null;
            readCurrent = true;
            messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(currentPage || { selected_page: null }) });
            continue;
          }
          if (!['create_page', 'update_page'].includes(name)) throw new Error('This tool is not available.');
          const data = validateEditorPage(JSON.parse(call.function.arguments));
          if (name === 'update_page' && (!readCurrent || !currentPage)) throw new Error('Read the selected page before updating it, or create a page if none is selected.');
          const cloningPublished = name === 'update_page' && currentPage.status !== 'draft';
          if (cloningPublished) data.slug = `${data.slug}-draft-${crypto.randomUUID().slice(0, 8)}`;
          const duplicates = await base44.entities.DynamicPage.filter({ slug: data.slug }, { limit: 1, fields: ['title', 'status'] });
          if (duplicates.items.some(page => name === 'create_page' || page.id !== currentPage?.id)) throw new Error('That slug is already in use. Choose another slug; do not overwrite another page.');
          const page = name === 'create_page' || cloningPublished
            ? await base44.entities.DynamicPage.create(data)
            : await base44.entities.DynamicPage.update(currentPage.id, data);
          console.info('[visualEditorBuild] saved', { page_id: page.id, section_count: page.sections.length, action: name });
          return Response.json({ ok: true, page, message: `${name === 'create_page' ? 'Built' : cloningPublished ? 'Created a draft copy of' : 'Updated'} **${page.title}** with ${page.sections.length} sections. It is saved in the editor and shown on the canvas. This is a draft, not published to an external website.` });
        } catch (failure) {
          console.warn('[visualEditorBuild] tool failed:', failure.message);
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: failure.message, saved: false }) });
        }
      }
    }
    return Response.json({ error: 'The builder could not save a valid page. Your existing page has not been changed.' }, { status: 422 });
  } catch (error) {
    console.error('[visualEditorBuild]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}