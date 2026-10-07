function supportCore() {
  const languages = ['ar', 'fr', 'mixed', 'other'];
  const intents = ['order_status', 'payment_issue', 'refund', 'other'];
  const schema = {
    type: 'object', additionalProperties: false,
    properties: {
      language: { type: 'string', enum: languages },
      intent: { type: 'string', enum: intents },
      order_id: { type: ['string', 'null'] },
      claims_paid: { type: 'boolean' },
      requests_refund: { type: 'boolean' },
    },
    required: ['language', 'intent', 'order_id', 'claims_paid', 'requests_refund'],
  };
  function validate(prepared, http) {
    const headers = http && typeof http.headers === 'object' ? http.headers : {};
    const candidateId = headers['x-request-id'] ?? headers['X-Request-ID'];
    const requestId = typeof candidateId === 'string' && /^[A-Za-z0-9_.:-]{1,100}$/.test(candidateId)
      ? candidateId : null;
    const out = { context: prepared.context, orderIds: prepared.orderIds, requestId,
      triageValid: false, triage: null, validationReason: null };
    function fail(reason) { out.validationReason = reason; return out; }
    if (http?.error) return fail('transport_error');
    if (!Number.isInteger(http?.statusCode)) return fail('missing_http_status');
    if (http.statusCode < 200 || http.statusCode >= 300) return fail('api_http_' + http.statusCode);
    const body = http.body;
    if (!body || typeof body !== 'object' || !Array.isArray(body.choices) || body.choices.length !== 1) {
      return fail('invalid_completion_envelope');
    }
    const choice = body.choices[0];
    if (choice?.finish_reason !== 'stop') return fail('incomplete_or_nonfinal_response');
    if (choice.message?.refusal) return fail('model_refusal');
    const content = choice.message?.content;
    if (typeof content !== 'string' || content.length > 8000) return fail('invalid_content');
    let t;
    try { t = JSON.parse(content); } catch { return fail('invalid_json'); }
    if (!t || typeof t !== 'object' || Array.isArray(t)) return fail('schema_mismatch');
    if (Object.keys(t).length !== schema.required.length || schema.required.some(k => !Object.hasOwn(t, k))) {
      return fail('schema_mismatch');
    }
    if (!languages.includes(t.language) || !intents.includes(t.intent) ||
      typeof t.claims_paid !== 'boolean' || typeof t.requests_refund !== 'boolean' ||
      !(t.order_id === null || (typeof t.order_id === 'string' && /^DZ-\d{4,8}$/.test(t.order_id)))) {
      return fail('schema_mismatch');
    }
    // Consistent extraction is required, even if the JSON shape is valid.
    const ids = prepared.orderIds;
    const expected = ids.length === 1 ? ids[0] : null;
    if (t.order_id !== expected) return fail('order_id_evidence_mismatch');
    return { ...out, triageValid: true, triage: t };
  }


  return { validate };
}
const prepared = $('Prepare Request').item.json;
return { json: supportCore().validate(prepared, $json) };
