'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { supportCore } = require('./support-core.cjs');
const source = supportCore.toString();
const prefix = source.slice(source.indexOf('  const languages'), source.indexOf('  const systemPrompt'));
const preparePart = source.slice(source.indexOf('  const languages'), source.indexOf('  function validate'));
const validatePart = prefix + source.slice(source.indexOf('  function validate'), source.indexOf('  // Fictional data'));
const lookupPart = source.slice(source.indexOf('  // Fictional data'), source.indexOf('  function review'));
const reviewPart = source.slice(source.indexOf('  function review'), source.indexOf('  return { schema, systemPrompt'));
function wrap(part, name, call) {
  return 'function supportCore() {\n' + part + '\n  return { ' + name + ' };\n}\n' + call;
}
const scripts = {
  'Demo Input': `return { json: {
  tenantId: 'demo-shop', customerId: 'customer-001',
  messageId: 'demo-message-001', source: 'manual', replyLocale: 'ar',
  text: 'خلصت الطلب DZ-1042، علاش الدفع مازال معلق؟',
  modelId: '<CHAT_MODEL_ID_WITH_JSON_SCHEMA_SUPPORT>',
} };`,
  'Prepare Request': wrap(preparePart, 'prepare', 'return { json: supportCore().prepare($json) };'),
  'Validate Triage': wrap(validatePart, 'validate', "const prepared = $('Prepare Request').item.json;\nreturn { json: supportCore().validate(prepared, $json) };"),
  'Read Demo Order': wrap(lookupPart, 'lookup', 'return { json: supportCore().lookup($json) };'),
  'Build Review Packet': wrap(reviewPart, 'review', 'return { json: supportCore().review($json) };'),
};
const names = ['Manual Trigger', 'Demo Input', 'Prepare Request', 'DEVUP Triage',
  'Validate Triage', 'Read Demo Order', 'Build Review Packet'];
const nodes = names.map((name, i) => ({
  id: `support-lab-${i + 1}`, name, position: [260 * i, 0],
  type: name === 'Manual Trigger' ? 'n8n-nodes-base.manualTrigger'
    : name === 'DEVUP Triage' ? 'n8n-nodes-base.httpRequest' : 'n8n-nodes-base.code',
  typeVersion: name === 'Manual Trigger' ? 1 : name === 'DEVUP Triage' ? 4.2 : 2,
  parameters: name === 'Manual Trigger' ? {} : name === 'DEVUP Triage' ? {
    method: 'POST', url: 'https://api.devupai.com/v1/chat/completions',
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    sendHeaders: true, headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
    sendBody: true, contentType: 'json', specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.requestBody) }}',
    options: {
      redirect: { redirect: { followRedirects: false } },
      response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } },
      timeout: 30000,
    },
  } : { mode: 'runOnceForEachItem', jsCode: scripts[name] },
  ...(name === 'DEVUP Triage' ? { onError: 'continueRegularOutput', retryOnFail: false } : {}),
}));
const connections = {};
names.slice(0, -1).forEach((name, i) => {
  connections[name] = { main: [[{ node: names[i + 1], type: 'main', index: 0 }]] };
});
const workflow = {
  name: 'DEVUP AI — Bilingual Support Review Lab', nodes, connections,
  active: false, settings: { executionOrder: 'v1' }, pinData: {}, tags: [],
};
fs.writeFileSync(path.join(__dirname, 'support-workflow.json'), JSON.stringify(workflow, null, 2) + '\n');
fs.mkdirSync(path.join(__dirname, 'nodes'), { recursive: true });
for (const [name, code] of Object.entries(scripts)) {
  fs.writeFileSync(path.join(__dirname, 'nodes', name.toLowerCase().replaceAll(' ', '-') + '.js'), code + '\n');
}
module.exports = { workflow, scripts };
