# DEVUP AI + n8n: Bilingual Support Review Lab

A reproducible tutorial implementation for Arabic/French support triage, authorized fictional order lookup, and deterministic unsent review drafts.

## Files

| File | Purpose |
| --- | --- |
| `devup-n8n-bilingual-support.md` | Complete DEV.to-ready article body; three external reference screenshots with source captions |
| `publishing-notes.md` | Title, description, tags, image sources, and publishing checks |
| `support-workflow.json` | Inactive seven-node n8n workflow with no embedded key or credential reference |
| `nodes/*.js` | Individual n8n Code-node snippets, Run Once for Each Item |
| `support-core.cjs` | Dependency-free shared application logic |
| `build-workflow.cjs` | Generate the workflow JSON and Code-node snippets from that logic |
| `support.test.cjs` | 27 offline JavaScript tests, including generated node-script equivalence |
| `sample-cases.json` | Human-labeled messages to seed a live model evaluation |
| `inbox_demo.py` | Separate SQLite intake-idempotency reference, not wired into the workflow |
| `test_inbox.py` | 5 inbox tests, including concurrent duplicate claims |

## Import and configure

1. In n8n, use Import from File and select `support-workflow.json`.
2. Create a Header Auth credential: name `Authorization`; value `Bearer YOUR_DEVUP_AI_KEY`.
3. Select that credential in **DEVUP Triage**.
4. Replace the model placeholder in **Demo Input** with an exact current DEVUP AI catalog ID supporting the request's JSON Schema mode and parameters.
5. Keep the node names, per-item Code mode, and HTTP full-response options unchanged.
6. Execute manually and inspect **Build Review Packet**. For correct triage of the initial message, expect billing review, a payment conflict, a pending-payment draft, and `deliveryStatus: not_sent`.

The export has no public trigger, real order service, approval service, or delivery operation. Fixture identity is trusted only because the lab is manually controlled. A real intake adapter must authenticate events and establish tenant/customer identity before invoking the workflow.

## Offline verification

Node.js 24.19.0 and Python 3.12.14 were available during authoring; these are the authoring environment, not a published n8n version requirement. The JavaScript test harness needs a Node version supporting `node:test`; the Python inbox uses only the standard library.

```bash
node --test support.test.cjs
python -m unittest -v test_inbox.py
```

Authoring results: 27/27 JavaScript tests and 5/5 Python tests pass. Responses used in the JavaScript tests are synthetic. The tests do not call DEVUP AI, launch n8n, or prove live model accuracy, latency, visual image rendering, credential connectivity, or import behavior in a specific installed n8n release.

The node parameters were checked against public n8n documentation and node source. Verify import and HTTP field behavior in your own n8n release before live use.

## Live evaluation

`sample-cases.json` contains message inputs and expected triage labels, not measured model outputs. Run each through the configured model and retain the full validation/review result. Evaluate false negatives on refund/payment flags, order-ID consistency, unauthorized lookup outcomes, and reviewer corrections. Report the exact model and revisions alongside any measured result.

## Inbox reference scope

The SQLite adapter atomically claims `(tenantId, source, messageId)`, detects changed content under an existing identity, and reuses completed packets. It is separate from the n8n lab. A crash after a claim leaves an ambiguous claimed event; there is no lease recovery, production queue, exactly-once delivery, approval service, or message sender. Build these explicitly for deployment.

## Images and publication

The article uses linked UI screenshots from n8n's official documentation repository, clearly labeled as references rather than screenshots of this implementation. The source files were located in the repository. Binary retrieval/visual rendering could not be checked in the authoring environment; inspect the three images in DEV.to Preview before publishing and keep attribution. The links do not guarantee permanent availability.

The article body has no DEV.to metadata comment and contains no literal Liquid expression delimiters. Keep the downloadable JSON separate from the body: its n8n expression is valid in the JSON but can conflict with DEV.to's Liquid processing if pasted directly into an article.

Use `publishing-notes.md` for the fields outside the body. No public companion-download URL is invented: upload the companion files to a public repository if you want to offer readers an actual download link. All Code-node snippets needed to assemble the lab are already in the article.
