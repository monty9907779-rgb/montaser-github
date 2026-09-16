---
name: humanizer
description: Rewrite AI-generated text (Arabic or English) so it reads like a real person wrote it. Use when the user asks to humanize, "هيومنايز", make text sound natural/human, remove AI tone, or de-robotize an email, post, report, or proposal.
---

# Humanizer

Rewrite the given text so it sounds naturally human while keeping every fact, name, number, and commitment exactly as is.

## Input
- The text the user pasted, or the file they pointed to.
- Optional tone: `natural` (default), `business`, `casual`, `sales`.
- Default register: if the source is Arabic, write clear Modern Standard Arabic with a light business feel; use Egyptian/Gulf phrasing only when the source is already informal.

## Rules (apply all)
1. Delete stock openers and closers: "في الختام", "من الجدير بالذكر أن", "علاوة على ذلك", "في عالم اليوم المتسارع", "مما لا شك فيه", "In conclusion", "It's important to note", "Furthermore", "In today's fast-paced world", "I hope this helps".
2. No em-dashes (—). Use a comma or a new sentence.
3. No Markdown headers, bold, bullet lists, or emojis unless the source had them and the user wants them kept.
4. Vary sentence length. Mix short sentences with longer ones. Never start three sentences in a row the same way.
5. Replace buzzwords: leverage→use, delve→look at, robust→solid, seamless→smooth, pivotal→key, game-changer→big deal, comprehensive→full, "in order to"→to, "due to the fact that"→because. Arabic: "يتوجب علينا"→"لازم/علينا", "من خلال"→"عن طريق", "حيث أن"→"لأن", "بالإمكان"→"ممكن", "في الوقت الراهن"→"حاليًا".
6. English: use contractions (it's, don't, we're).
7. Cut hedging and filler ("very", "really", "essentially", "ultimately", "بشكل ملحوظ", "بكل تأكيد").
8. Keep the user's meaning, tone intent, and length within about ±20%.
9. Do not add new claims, examples, or promises.

## Output
- Return only the rewritten text, then one short line listing what changed (e.g. "حذفت 4 عبارات آلية، قسّمت جملتين، بدّلت 3 كلمات منمّقة").
- If the user asks for multiple variants, give up to 3, labeled.

## Related tool
A single-page browser version with the same rules lives at `08 - أدوات/humanizer/index.html` in this repo. Point the user there for quick offline use.
