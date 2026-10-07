# Publishing fields

## Title

```text
Build a Bilingual Support Workflow with n8n and DEVUP AI: Verified Orders and Human Review
```

## Description

```text
Build Arabic/French support triage with n8n and DEVUP AI: structured JSON, authorized order lookups, evidence-based drafts, and human review.
```

## DEV.to tags

```text
n8n, ai, javascript, tutorial
```

Paste only `devup-n8n-bilingual-support.md` into the article body. Set the title and tags in their dedicated fields. This file is publishing guidance, not article content.

## Image sources already embedded in Markdown

1. Execution inspection: https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/build/.gitbook/assets/open-execution.png
2. Webhook test/production URLs: https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/integrations/.gitbook/assets/webhook-urls.png
3. Workflow history: https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/build/.gitbook/assets/workflow-history.png

These are third-party documentation reference screenshots, not project screenshots or affiliation claims. Attribution and descriptive alt text are already supplied. Source existence was checked in the official repository; remote image rendering was not visually checked in the authoring environment. Confirm all three in Preview before publication. If the editor fails to import a linked image, download the original and upload it through the editor, retaining the source caption and alt text.

## Optional cover

For a later custom cover, use the DEVUP AI brand gradient and n8n identity with a concise caption such as **Bilingual Support, Verified Orders, Human Review**. Avoid performance figures, upstream model-provider logos, and architecture claims. None of the reference screenshots is presented as a custom branded cover.

## Companion files

The Markdown article is self-contained for manual assembly. To provide one-click workflow import to readers, publish the sanitized `support-workflow.json` and tests in an accessible repository, then add that real link near the preparation section. Do not paste the workflow JSON directly into DEV.to: n8n expression delimiters can trigger Liquid errors.

## Before publishing

- Check the title, four tags, all three image previews, and their captions.
- Check code-block formatting in Preview. No literal Liquid delimiters occur in the article body.
- Retain the disclosure that all shop data/policies are fictional and that reported tests are offline.
- Do not describe the import or model as live-tested: no credentials or n8n runtime were available for authoring.
- No upstream provider names, USD prices, or DEVUP AI private infrastructure are included.
