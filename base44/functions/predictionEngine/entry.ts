import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';

// ═══════════════════════════════════════════════════════════════════════════
// predictionEngine — AI-powered prediction system.
// Creates prediction models and runs forecasts using LLM + data analysis.
//
// Actions:
//   create_model   — define a new prediction model
//   run_prediction — execute a prediction and store the result
//   list_models    — get user's prediction models
//   get_results    — get prediction results for a model
//   backtest       — compare past predictions to actual outcomes
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list_models';

    switch (action) {
      case 'create_model': {
        if (!body.name || !body.question)
          return Response.json({ error: 'name and question required' }, { status: 400 });

        const modelId = `PM-${Date.now().toString(36).toUpperCase()}`;
        const model = await svc.entities.PredictionModel.create({
          owner_id: user.id,
          model_id: modelId,
          name: body.name,
          model_type: body.model_type || 'llm_based',
          question: body.question,
          data_sources: body.data_sources || [],
          input_data: body.input_data || '',
          output_schema: body.output_schema || '',
          schedule_cron: body.schedule_cron || '',
          active: true,
          created_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, model });
      }

      case 'run_prediction': {
        if (!body.model_id) return Response.json({ error: 'model_id required' }, { status: 400 });
        const model = await svc.entities.PredictionModel.get(body.model_id);
        if (!model) return Response.json({ error: 'Model not found' }, { status: 404 });

        // Build prediction prompt
        const prompt = `You are a prediction engine. Answer the following prediction question with high confidence analysis.

QUESTION: ${model.question}

DATA SOURCES: ${(model.data_sources || []).join(', ')}

INPUT DATA: ${body.input_data || model.input_data || 'No additional data provided'}

INSTRUCTIONS:
1. Analyze the available information
2. Provide a clear, specific prediction
3. Assign a confidence score (0.0 to 1.0)
4. Explain your reasoning briefly
5. Note key factors that could change the outcome

Respond in this format:
PREDICTION: [your prediction]
CONFIDENCE: [0.0-1.0]
REASONING: [brief explanation]
FACTORS: [key variables]`;

        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              confidence: { type: 'number' },
              reasoning: { type: 'string' },
              factors: { type: 'string' },
            },
          },
        });

        const predictionText = (llmResult as any)?.prediction || (typeof llmResult === 'string' ? llmResult : JSON.stringify(llmResult));
        const confidence = (llmResult as any)?.confidence || 0.5;

        const result = await svc.entities.PredictionResult.create({
          owner_id: user.id,
          model_id: model.id,
          prediction_text: predictionText,
          confidence,
          input_snapshot: body.input_data || model.input_data || '',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        // Update model last run
        await svc.entities.PredictionModel.update(model.id, {
          last_run_at: new Date().toISOString(),
        });

        return Response.json({ ok: true, result, reasoning: (llmResult as any)?.reasoning, factors: (llmResult as any)?.factors });
      }

      case 'list_models': {
        const models = await svc.entities.PredictionModel.filter(
          { owner_id: user.id },
          '-created_date',
          50
        );
        return Response.json({ ok: true, models });
      }

      case 'get_results': {
        if (!body.model_id) return Response.json({ error: 'model_id required' }, { status: 400 });
        const results = await svc.entities.PredictionResult.filter(
          { owner_id: user.id, model_id: body.model_id },
          '-created_date',
          50
        );
        return Response.json({ ok: true, results });
      }

      case 'backtest': {
        if (!body.result_id || !body.actual_outcome)
          return Response.json({ error: 'result_id and actual_outcome required' }, { status: 400 });
        const result = await svc.entities.PredictionResult.get(body.result_id);
        if (!result) return Response.json({ error: 'Result not found' }, { status: 404 });

        // Simple variance calculation
        const predicted = parseFloat(result.prediction_text.replace(/[^0-9.-]/g, '')) || 0;
        const actual = parseFloat(body.actual_outcome.replace(/[^0-9.-]/g, '')) || 0;
        const variance = predicted > 0 ? Math.abs(predicted - actual) / predicted : 0;

        await svc.entities.PredictionResult.update(result.id, {
          actual_outcome: body.actual_outcome,
          variance,
        });

        return Response.json({ ok: true, variance });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[predictionEngine] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}