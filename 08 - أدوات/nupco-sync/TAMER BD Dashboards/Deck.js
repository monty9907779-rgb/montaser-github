// ============================================================================
// TAMER Assistant — presentation builder
//  makeDeck(request, pageDiv): asks Gemini for a slide spec (strict JSON)
//  grounded in the dashboard data, then builds a Google Slides deck in the
//  owner's Tamer Drive (shared domain-view) and returns its URL.
// ============================================================================

function makeDeck(request, pageDiv) {
  try {
    request = String(request || '').trim().slice(0, 600);
    if (!request) return { ok: false, code: 'EMPTY' };
    var props = PropertiesService.getScriptProperties();
    var key = props.getProperty('GEMINI_API_KEY');
    if (!key && !claudeKey_() && !mstyKey_()) return { ok: false, code: 'NO_KEY' };
    var model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';

    var ctx = aiContext_();
    if (!ctx) return { ok: false, code: 'NO_DATA' };

    var prompt = [
      'You design a business presentation for the TAMER HC / BD sales team (Saudi Arabia), in English.',
      'Using ONLY the dashboard data below, produce a slide deck answering this request:',
      '"' + request + '"',
      (pageDiv && pageDiv !== 'ALL') ? ('The requester is on the ' + pageDiv + ' division page.') : '',
      '',
      'Return ONLY valid JSON (no markdown fences, no prose) with this exact shape:',
      '{"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"table":{"headers":["..."],"rows":[["..."]]}}]}',
      'Rules:',
      '- 4 to 8 slides. Each slide: a short title, 2-6 concise bullets; add "table" only when a comparison genuinely needs one (max 5 columns x 8 rows).',
      '- All numbers must come from the data below, SAR with thousand separators. Never invent a number.',
      '- The current month is partial (up to today) — say so where relevant.',
      '- "Tamer year" = Jan to today; "BD year" = Oct to today; values are GROSS billing, not recognized.',
      '- End with a short "Key takeaways" slide.',
      '',
      'DATA (JSON):',
      ctx
    ].join('\n');

    var text = deckGemini_(key, model, prompt);
    if (text && text.code) return text; // error object passthrough

    var spec = deckParse_(text);
    if (!spec) {
      // one retry, more forceful
      text = deckGemini_(key, model, prompt + '\n\nIMPORTANT: your previous answer was not parseable. Return ONLY the raw JSON object, starting with { and ending with }.');
      if (text && text.code) return text;
      spec = deckParse_(text);
      if (!spec) return { ok: false, code: 'PARSE' };
    }

    var url = deckBuild_(spec);
    return { ok: true, url: url, title: spec.title, slides: (spec.slides || []).length };
  } catch (e) {
    console.error('makeDeck failed: ' + (e && e.message));
    return { ok: false, code: 'ERR' };
  }
}

// Gemini call for the JSON-spec builders. Delegates to the shared robust caller
// (tcGenerate_ in Chat.js): Gemini-3 thinking control, transient-error retry and
// model fallback. Returns the JSON string, or an {ok:false,code,...} error object
// (callers detect the error via `text.code`).
function deckGemini_(key, model, promptText) {
  var mk = mstyKey_();
  if (mk) {
    var mr = mstyGenerate_(mk, 'You return ONLY valid JSON. No prose, no markdown fences.',
      promptText, { temperature: 0.15, maxTokens: 3600 });
    return mr.ok ? mr.text : mr;
  }
  var ck = claudeKey_();
  if (ck) {
    // Claude has no responseMimeType switch — the JSON contract is stated in
    // the prompt itself, and every caller already runs a tolerant parser plus
    // one forceful retry, so the shape is enforced the same way either way.
    var r = claudeGenerate_(ck, 'You return ONLY valid JSON. No prose, no markdown fences.',
      promptText, { effort: 'high' });
    return r.ok ? r.text : r;
  }
  var res = tcGenerate_(key, model,
    { temperature: 0.25, maxOutputTokens: 8000, responseMimeType: 'application/json' }, promptText);
  if (!res.ok) return res;
  return res.text;
}

function deckParse_(text) {
  try {
    var t = String(text).replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    var i = t.indexOf('{'), j = t.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    var spec = JSON.parse(t.slice(i, j + 1));
    if (!spec || !spec.title || !spec.slides || !spec.slides.length) return null;
    spec.slides = spec.slides.slice(0, 10);
    return spec;
  } catch (e) { return null; }
}

function deckBuild_(spec) {
  var NAVY = '#0B2E59', BLUE = '#1D4ED8';
  var pres = SlidesApp.create(String(spec.title).slice(0, 90));

  // title slide
  var first = pres.getSlides()[0];
  var titleSlide = pres.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  try {
    var tp = titleSlide.getPlaceholder(SlidesApp.PlaceholderType.CENTERED_TITLE);
    if (tp) { var tt = tp.asShape().getText(); tt.setText(spec.title); tt.getTextStyle().setForegroundColor(NAVY).setBold(true); }
    var sp = titleSlide.getPlaceholder(SlidesApp.PlaceholderType.SUBTITLE);
    if (sp) sp.asShape().getText().setText((spec.subtitle || 'TAMER HC — BD Sales') + '\nGenerated by TAMER Assistant · ' + new Date().toISOString().slice(0, 10));
  } catch (e) {}
  try { first.remove(); } catch (e) {}

  (spec.slides || []).forEach(function (sl) {
    var s = pres.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    try {
      var tph = s.getPlaceholder(SlidesApp.PlaceholderType.TITLE);
      if (tph) { var ts = tph.asShape().getText(); ts.setText(String(sl.title || '').slice(0, 100)); ts.getTextStyle().setForegroundColor(NAVY).setBold(true); }
    } catch (e) {}
    var bullets = (sl.bullets || []).slice(0, 8).map(function (b) { return String(b).slice(0, 220); });
    try {
      var bph = s.getPlaceholder(SlidesApp.PlaceholderType.BODY);
      if (bph && bullets.length) {
        var bt = bph.asShape().getText();
        bt.setText(bullets.join('\n'));
        try { bt.getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE); } catch (e2) {}
      }
    } catch (e) {}
    // optional table on its own area below/instead of bullets
    var tb = sl.table;
    if (tb && tb.headers && tb.headers.length && tb.rows && tb.rows.length) {
      try {
        var cols = Math.min(tb.headers.length, 5);
        var rows = Math.min(tb.rows.length, 8) + 1;
        var table = s.insertTable(rows, cols);
        for (var c = 0; c < cols; c++) {
          var hc = table.getCell(0, c);
          hc.getText().setText(String(tb.headers[c]).slice(0, 40));
          try { hc.getFill().setSolidFill(NAVY); hc.getText().getTextStyle().setForegroundColor('#FFFFFF').setBold(true); } catch (e3) {}
        }
        for (var r = 1; r < rows; r++) {
          var row = tb.rows[r - 1] || [];
          for (var c2 = 0; c2 < cols; c2++) table.getCell(r, c2).getText().setText(String(row[c2] == null ? '' : row[c2]).slice(0, 60));
        }
      } catch (e) {}
    }
  });

  pres.saveAndClose();
  try { DriveApp.getFileById(pres.getId()).setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return pres.getUrl();
}

// ---------------------------------------------------------------------------
// Excel / Google Sheet builder — same flow: Gemini spec -> Google Sheet.
// ---------------------------------------------------------------------------
function makeSheet(request, pageDiv) {
  try {
    request = String(request || '').trim().slice(0, 600);
    if (!request) return { ok: false, code: 'EMPTY' };
    var props = PropertiesService.getScriptProperties();
    var key = props.getProperty('GEMINI_API_KEY');
    if (!key && !claudeKey_() && !mstyKey_()) return { ok: false, code: 'NO_KEY' };
    var model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';

    var ctx = aiContext_();
    if (!ctx) return { ok: false, code: 'NO_DATA' };

    var prompt = [
      'You build an Excel workbook (as a Google Sheet) for the TAMER HC / BD sales team, in English.',
      'Using ONLY the dashboard data below, produce the workbook this request asks for:',
      '"' + request + '"',
      (pageDiv && pageDiv !== 'ALL') ? ('The requester is on the ' + pageDiv + ' division page.') : '',
      '',
      'Return ONLY valid JSON (no markdown, no prose) shaped exactly:',
      '{"title":"...","sheets":[{"name":"Tab name","headers":["Col1","Col2"],"rows":[["a","b"],["c","d"]]}]}',
      'Rules:',
      '- 1 to 5 sheets/tabs. Each tab: a short name, a header row, and data rows (max 15 columns x 200 rows).',
      '- Numbers must come from the data below (raw numbers, no SAR text inside numeric cells; a currency note in the tab name or a header is fine). Never invent a number.',
      '- Current month is partial. "Tamer year" = Jan to today; values are GROSS billing.',
      '',
      'DATA (JSON):',
      ctx
    ].join('\n');

    var text = deckGemini_(key, model, prompt);
    if (text && text.code) return text;
    var spec = sheetParse_(text);
    if (!spec) {
      text = deckGemini_(key, model, prompt + '\n\nIMPORTANT: previous answer was not parseable. Return ONLY the raw JSON object.');
      if (text && text.code) return text;
      spec = sheetParse_(text);
      if (!spec) return { ok: false, code: 'PARSE' };
    }

    var ss = SpreadsheetApp.create(String(spec.title || 'TAMER Export').slice(0, 90));
    var made = 0;
    (spec.sheets || []).slice(0, 5).forEach(function (sh, idx) {
      var name = String(sh.name || ('Sheet' + (idx + 1))).slice(0, 90);
      var sheet = idx === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
      var headers = (sh.headers || []).slice(0, 15).map(function (h) { return String(h).slice(0, 120); });
      var rows = (sh.rows || []).slice(0, 200).map(function (r) {
        return (r || []).slice(0, headers.length || 15).map(function (c) {
          if (c === null || c === undefined) return '';
          if (typeof c === 'number') return c;
          var n = Number(String(c).replace(/,/g, ''));
          return (String(c).trim() !== '' && !isNaN(n) && /^[\d,.\-]+$/.test(String(c).trim())) ? n : String(c).slice(0, 300);
        });
      });
      var out = [];
      if (headers.length) out.push(headers);
      rows.forEach(function (r) { while (r.length < (headers.length || 1)) r.push(''); out.push(r); });
      if (out.length) {
        var rng = sheet.getRange(1, 1, out.length, out[0].length);
        rng.setValues(out);
        if (headers.length) {
          var hr = sheet.getRange(1, 1, 1, headers.length);
          hr.setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#0B2E59');
          sheet.setFrozenRows(1);
        }
        try { sheet.autoResizeColumns(1, out[0].length); } catch (e) {}
      }
      made++;
    });
    SpreadsheetApp.flush();
    var id = ss.getId();
    try { DriveApp.getFileById(id).setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    // direct .xlsx download link (opens the browser's Download)
    var dl = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';
    return { ok: true, url: ss.getUrl(), download: dl, title: spec.title, sheets: made };
  } catch (e) {
    console.error('makeSheet failed: ' + (e && e.message));
    return { ok: false, code: 'ERR' };
  }
}

// ---------------------------------------------------------------------------
// Email drafter — writes a Gmail DRAFT (never sends) in the owner's mailbox.
// ---------------------------------------------------------------------------
function makeEmail(request, pageDiv) {
  try {
    request = String(request || '').trim().slice(0, 600);
    if (!request) return { ok: false, code: 'EMPTY' };
    var props = PropertiesService.getScriptProperties();
    var key = props.getProperty('GEMINI_API_KEY');
    if (!key && !claudeKey_() && !mstyKey_()) return { ok: false, code: 'NO_KEY' };
    var model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';

    var ctx = aiContext_();
    if (!ctx) return { ok: false, code: 'NO_DATA' };

    var prompt = [
      'You draft a professional business email in English for the TAMER HC / BD sales team, using ONLY the dashboard data below.',
      'Request: "' + request + '"',
      (pageDiv && pageDiv !== 'ALL') ? ('The requester is on the ' + pageDiv + ' division page.') : '',
      '',
      'Return ONLY valid JSON (no markdown, no prose): {"to":"","subject":"...","body":"..."}',
      'Rules:',
      '- "to" = recipient email ONLY if the request clearly names one, else "".',
      '- subject: concise. body: plain text with line breaks (\\n), professional, signed "TAMER HC — BD Sales".',
      '- Every number must come from the data below, SAR with thousand separators. Never invent a number.',
      '- Current month is partial; values are GROSS billing (Tamer year = Jan to today).',
      '',
      'DATA (JSON):',
      ctx
    ].join('\n');

    var text = deckGemini_(key, model, prompt);
    if (text && text.code) return text;
    var spec = emailParse_(text);
    if (!spec) {
      text = deckGemini_(key, model, prompt + '\n\nIMPORTANT: previous answer was not parseable. Return ONLY the raw JSON object.');
      if (text && text.code) return text;
      spec = emailParse_(text);
      if (!spec) return { ok: false, code: 'PARSE' };
    }

    var to = String(spec.to || '').trim();
    var subject = String(spec.subject || 'TAMER BD update').slice(0, 200);
    var body = String(spec.body || '').slice(0, 12000);
    // create a DRAFT only — never send.
    var draft = GmailApp.createDraft(to, subject, body);
    return { ok: true, to: to, subject: subject, body: body, draftUrl: 'https://mail.google.com/mail/u/0/#drafts' + (draft ? '' : '') };
  } catch (e) {
    console.error('makeEmail failed: ' + (e && e.message));
    return { ok: false, code: 'ERR' };
  }
}

function emailParse_(text) {
  try {
    var t = String(text).replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    var i = t.indexOf('{'), j = t.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    var spec = JSON.parse(t.slice(i, j + 1));
    if (!spec || !spec.subject || !spec.body) return null;
    return spec;
  } catch (e) { return null; }
}

function sheetParse_(text) {
  try {
    var t = String(text).replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    var i = t.indexOf('{'), j = t.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    var spec = JSON.parse(t.slice(i, j + 1));
    if (!spec || !spec.sheets || !spec.sheets.length) return null;
    return spec;
  } catch (e) { return null; }
}

// One-shot authorization trigger: run this ONCE in the editor after adding the
// Slides/Sheets scopes so the OAuth consent covers deck + excel generation.
function authorizeExports() {
  var p = SlidesApp.create('__auth_probe'); DriveApp.getFileById(p.getId()).setTrashed(true);
  var s = SpreadsheetApp.create('__auth_probe'); DriveApp.getFileById(s.getId()).setTrashed(true);
  var d = GmailApp.createDraft('', '__auth_probe', 'probe'); d.deleteDraft();
  return 'authorized';
}


