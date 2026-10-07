// ============================================================================
// TAMER Dashboard Assistant
//  - chatWidget_()  : returns the chat UI (HTML+CSS+JS) appended to every page.
//                     The 7 ready questions are computed CLIENT-SIDE from the
//                     page's own embedded data (D / STK / COV) — no server call.
//  - askAI(q, div)  : server-side free-question answering via Google Gemini,
//                     key + model read from Script Properties (GEMINI_API_KEY /
//                     GEMINI_MODEL). Data context is built from the same Drive
//                     store the dashboard renders from. Data never leaves
//                     Google services under the Tamer account.
// ============================================================================

// ---------------------------- server: free question -------------------------
function askAI(question, pageDiv) {
  try {
    question = String(question || '').trim().slice(0, 500);
    if (!question) return { ok: false, code: 'EMPTY' };
    var props = PropertiesService.getScriptProperties();
    var mstyKey = props.getProperty('MSTY_API_KEY');
    var key = props.getProperty('GEMINI_API_KEY');
    if (!mstyKey && !key && !claudeKey_()) return { ok: false, code: 'NO_KEY' };
    var model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';

    var ctx = aiContext_();
    if (!ctx) return { ok: false, code: 'NO_DATA' };

    var sys = [
      'You are the "TAMER Dashboard Assistant" for the TAMER HC / BD sales dashboard (Saudi Arabia).',
      'Answer in English, concise and professional. Amounts are SAR — format with thousands separators.',
      'If the user writes in Arabic, answer in Arabic instead.',
      '',
      'OUTPUT FORMAT — match the dashboard look. Return a compact HTML fragment using ONLY these exact tags (bare, double quotes, no other tags/attributes, NO markdown like ** or ###):',
      '<b>bold</b> · <table><tr><th>Header</th></tr><tr><td>cell</td></tr></table> · <span class="pos">positive/green values</span> · <span class="neg">negative/red values</span> · <br> for line breaks.',
      'Whenever you present numbers for more than one item, use a <table>. Wrap growth/positives in class "pos" and declines/negatives/returns in class "neg" (the class may be on the <td> itself, e.g. <td class="neg">, or on a <span> inside it). Always close every <td> and <tr>. Never put a class on any other tag.',
      'End with one short footnote line: <div class="tcsrc">source/period note</div>',
      '',
      'Strict rules:',
      '- Answer ONLY from the data below. Never invent a number or fact that is not in it.',
      '- If the question cannot be answered from this data, say clearly that the dashboard does not have that information.',
      '- The current month is PARTIAL (up to today) — mention this when answering about the current month.',
      '- "Tamer year" = 1 Jan to today. "BD year" = 1 Oct (last year) to today.',
      '- LY comparisons are same-period (up to the same day of month last year).',
      '- All values are GROSS billing from the official sales reports, not recognized revenue.',
      '- STOCK questions are answerable at EVERY level: stockOnHandWithAging.everyItemByCatalog holds ONE ENTRY PER BD CATALOG NUMBER with [qty, value, fresh_0_90, d91_180, d181_360, over360, division, subCategory, description] — so per-item stock and aging (e.g. "stock for 2420-0007") IS available; read it before saying anything is missing. The same buckets exist per division, warehouse and sub-category, plus a ready-made "over180" (= d181_360 + over360). internationalStockWithAging, gpprrConsignmentStockMG and consignmentDetail carry the same buckets. Aging is NOT available by sales line — answer by division / sub-category / item and say that stock is not held by line.',
      '- openTendersNUPCO is the OPEN (undelivered) NUPCO tender commitment, BD only — separate from billed sales. Do not add it to sales figures.',
      (pageDiv && pageDiv !== 'ALL')
        ? ('- The user is on the ' + pageDiv + ' division page — focus on that division unless asked otherwise.')
        : '- The user is on the main page (all BD divisions).',
      '',
      'DATA (JSON):',
      ctx
    ].join('\n');

    var ck = claudeKey_();
    var res = mstyKey
      ? mstyGenerate_(mstyKey, sys, 'User question: ' + question, { temperature: 0.2, maxTokens: 1200 })
      : ck
        ? claudeGenerate_(ck, sys, 'User question: ' + question, { effort: 'high' })
        : tcGenerate_(key, model, { temperature: 0.2, maxOutputTokens: 8000 },
            sys + '\n\nUser question: ' + question);
    if (!res.ok) return res; // {ok:false, code, msg} passthrough
    var text = tcSanitize_(res.text);
    if (res.finishReason === 'MAX_TOKENS') text += '\n…(answer truncated)';
    return { ok: true, answer: text };
  } catch (e) {
    // Never echo raw exception text to the client — UrlFetchApp transport
    // errors embed the full fetched URL in e.message.
    console.error('askAI failed: ' + (e && e.message));
    return { ok: false, code: 'ERR' };
  }
}


// ---------------------------------------------------------------------------
// MSTY / OpenAI-compatible backend. Preferred low-latency path for TAMER.
// ---------------------------------------------------------------------------
function mstyKey_() {
  return PropertiesService.getScriptProperties().getProperty('MSTY_API_KEY') || '';
}
function mstyRequest_(url, key, body, authMode) {
  var headers = authMode === 'x-api-key'
    ? { 'x-api-key': key }
    : authMode === 'api-key'
      ? { 'api-key': key }
      : { Authorization: 'Bearer ' + key };
  return UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
}

function mstyGenerate_(key, systemText, userText, opts) {
  opts = opts || {};
  var props = PropertiesService.getScriptProperties();
  var base = props.getProperty('MSTY_BASE_URL') || 'https://ai.montessori-ksa.com/v1';
  base = String(base).replace(/\/+$/, '');
  var model = props.getProperty('MSTY_MODEL') || 'gpt-4.1-mini';
  var body = {
    model: model,
    messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }],
    temperature: opts.temperature == null ? 0.2 : opts.temperature,
    max_tokens: opts.maxTokens || 1600
  };
  var url = base + '/chat/completions';
  var resp = mstyRequest_(url, key, body, 'bearer');
  var code = resp.getResponseCode(), raw = resp.getContentText();

  // Msty-compatible gateways differ on the accepted API-key header.
  // Retry only an authentication rejection, preserving normal response speed.
  if (code === 401) {
    resp = mstyRequest_(url, key, body, 'x-api-key');
    code = resp.getResponseCode();
    raw = resp.getContentText();
  }
  if (code === 401) {
    resp = mstyRequest_(url, key, body, 'api-key');
    code = resp.getResponseCode();
    raw = resp.getContentText();
  }
  if (code < 200 || code >= 300) {
    console.error('msty http ' + code);
    return { ok: false, code: 'API', msg: 'HTTP ' + code };
  }
  var data; try { data = JSON.parse(raw); } catch (e) { return { ok: false, code: 'API', msg: 'parse' }; }
  var choice = (data.choices || [])[0] || {};
  var text = String((choice.message || {}).content || '').trim();
  if (!text) return { ok: false, code: 'API', msg: 'empty' };
  return { ok: true, text: text, finishReason: choice.finish_reason === 'length' ? 'MAX_TOKENS' : '' };
}

// ---------------------------------------------------------------------------
// CLAUDE BACKEND (Anthropic API) — used when the ANTHROPIC_API_KEY script
// property is set; otherwise the assistant falls back to the Gemini path below.
// Apps Script has no Anthropic SDK, so this is the documented raw-HTTP shape.
//
// Model: claude-opus-5. Notes that matter here:
//  - Thinking is ON by default on Opus 5 (omitting `thinking` runs adaptive),
//    and max_tokens caps thinking + visible text together — hence 16000, not a
//    tight budget sized around the answer alone.
//  - temperature / top_p / top_k are REMOVED on Opus 5 (400 if sent).
//  - Safety classifiers can decline with HTTP 200 + stop_reason "refusal", so
//    stop_reason is checked before content is read, and server-side fallbacks
//    are enabled so a declined request is re-run on another model in-place.
//  - The dashboard context is a large stable prefix, so it carries a cache
//    breakpoint: repeat questions read it at ~0.1x input price instead of full.
// ---------------------------------------------------------------------------
function claudeKey_() {
  return PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || '';
}
function claudeGenerate_(key, systemText, userText, opts) {
  opts = opts || {};
  var model = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_MODEL') || 'claude-opus-5';
  var body = {
    model: model,
    max_tokens: opts.maxTokens || 16000,
    // Stable dashboard context cached at a breakpoint; the question itself is
    // appended after it in the user turn so the prefix stays byte-identical.
    system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText }],
    output_config: { effort: opts.effort || 'high' },
    fallbacks: 'default'
  };
  var resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var raw = resp.getContentText();
  if (code !== 200) {
    // Never echo the body — UrlFetchApp errors can embed the request URL/key.
    console.error('claude http ' + code + ': ' + String(raw).slice(0, 300));
    return { ok: false, code: 'API', msg: 'HTTP ' + code };
  }
  var b; try { b = JSON.parse(raw); } catch (e) { return { ok: false, code: 'API', msg: 'parse' }; }
  if (b.stop_reason === 'refusal') return { ok: false, code: 'BLOCKED' };
  var text = (b.content || []).filter(function (x) { return x.type === 'text'; })
    .map(function (x) { return x.text || ''; }).join('').trim();
  if (!text) return { ok: false, code: 'API', msg: String(b.stop_reason || 'empty') };
  return { ok: true, text: text, finishReason: b.stop_reason === 'max_tokens' ? 'MAX_TOKENS' : '' };
}

// Robust Gemini caller shared by the free question (askAI) and the
// deck/excel/email builders (Deck.js). It exists because the evergreen alias
// gemini-flash-latest now resolves to a Gemini-3 "thinking" model, which —
// left unconfigured — spends the output budget on hidden reasoning and returns
// an EMPTY MAX_TOKENS response, and because the endpoint intermittently answers
// 503/500/429/403 under load with no resilience in the old one-shot code.
//
// Measured on this key, 2026-08-16 (see the diagnostics that produced this fix):
//   generationConfig.thinkingConfig.thinkingLevel:'low'  -> real output on
//     gemini-flash-latest(=3.7), gemini-3.6-flash AND gemini-flash-lite-latest.
//   thinkingBudget:0            -> 400 INVALID_ARGUMENT on 3.6 / lite.
//   thinkingLevel:'none'        -> 400 on every model.
//   omitting thinkingConfig     -> 200 on every model (used as the 400 fallback).
//   gemini-2.5-flash / 2.0-flash-> 404 (retired for new keys) -> next in chain.
// Returns {ok:true,text,finishReason} or {ok:false,code:'API'|'BLOCKED',msg}.
function tcGenerate_(key, model, genConfig, promptText) {
  // Chain order measured on this key 2026-08-17: every gemini-3.x *flash* model
  // answers a real allocation calculation correctly, so quality is not the
  // differentiator — availability is. The free tier grants a SEPARATE daily
  // allowance per model, so a chain of distinct models multiplies capacity.
  // NOTE: gemini-pro-latest / 3.1-pro return 429 "check your plan and billing"
  // — Pro has ZERO free-tier quota. Set the GEMINI_MODEL script property to a
  // pro model only after billing is enabled on the Gemini project.
  var chain = [];
  [model, 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
    .forEach(function (m) { if (m && chain.indexOf(m) < 0) chain.push(m); });

  function attempt(m, useThinking) {
    var gc = {};
    for (var k in genConfig) gc[k] = genConfig[k];
    if (useThinking) gc.thinkingConfig = { thinkingLevel: 'low' };
    return UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(m) + ':generateContent',
      {
        method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key },
        payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: promptText }] }], generationConfig: gc }),
        muteHttpExceptions: true
      }
    );
  }

  var lastCode = 0;
  for (var ci = 0; ci < chain.length; ci++) {
    var m = chain[ci], useThinking = true;
    for (var tries = 0; tries < 4; tries++) {
      var resp = attempt(m, useThinking);
      var code = resp.getResponseCode();
      var bodyTxt = resp.getContentText();
      lastCode = code;
      if (code === 200) {
        var body; try { body = JSON.parse(bodyTxt); } catch (e) { body = {}; }
        var cand = (body.candidates || [])[0] || {};
        var parts = (cand.content || {}).parts || [];
        var text = parts.map(function (p) { return p.text || ''; }).join('').trim();
        var fr = String(cand.finishReason || '');
        if (text) return { ok: true, text: text, finishReason: fr };
        if (fr === 'SAFETY' || (body.promptFeedback && body.promptFeedback.blockReason)) return { ok: false, code: 'BLOCKED' };
        break; // empty output (e.g. MAX_TOKENS) — try the next model in the chain
      }
      if (code === 400 && useThinking && /thinking/i.test(bodyTxt)) { useThinking = false; continue; } // same model, no thinking cfg
      if (code === 404) break; // retired model — next in chain
      // 429 comes in two flavours: a daily allowance that is spent (or a plan
      // with no quota at all — the Pro models) which will NOT clear by waiting,
      // and a short per-minute burst. Only the second is worth retrying.
      if (code === 429) {
        if (/per\s*day|PerDay|daily|billing|plan and billing/i.test(bodyTxt)) break;
        Utilities.sleep(1200 * (tries + 1)); continue;
      }
      if (code === 503 || code === 500) { Utilities.sleep(1200 * (tries + 1)); continue; } // transient spike — retry
      // other codes (e.g. a transient 403): one short retry, then fall through to next model
      if (tries === 0) { Utilities.sleep(800); continue; }
      break;
    }
  }
  return { ok: false, code: 'API', msg: 'HTTP ' + (lastCode || 0) };
}

// Whitelist sanitizer: everything is HTML-escaped, then ONLY the exact
// dashboard-style tokens are turned back into tags. Attribute injection is
// impossible — a tag with any extra attribute stays visible escaped text.
function tcSanitize_(t) {
  t = String(t).replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
  // markdown fallbacks in case the model slips
  t = t.replace(/^#{1,5}\s*/gm, '').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  ['b', '/b', 'i', '/i', 'table', '/table', 'tr', '/tr', 'th', '/th', 'td', '/td', '/span', '/div', 'br']
    .forEach(function (tag) { t = t.split('&lt;' + tag + '&gt;').join('<' + tag + '>'); });
  t = t.split('&lt;span class="pos"&gt;').join('<span class="pos">');
  t = t.split('&lt;span class="neg"&gt;').join('<span class="neg">');
  t = t.split('&lt;div class="tcsrc"&gt;').join('<div class="tcsrc">');
  // Gemini often puts the pos/neg class straight on the cell (and sometimes uses
  // single quotes) — restore those exact tokens too, else they leak as raw text.
  ['td', 'th'].forEach(function (tag) {
    ['pos', 'neg'].forEach(function (cls) {
      t = t.split('&lt;' + tag + ' class="' + cls + '"&gt;').join('<' + tag + ' class="' + cls + '">');
      t = t.split("&lt;" + tag + " class='" + cls + "'&gt;").join('<' + tag + ' class="' + cls + '">');
    });
  });
  ['pos', 'neg'].forEach(function (cls) { // class on <tr> styles nothing — plain row
    t = t.split('&lt;tr class="' + cls + '"&gt;').join('<tr>');
    t = t.split("&lt;tr class='" + cls + "'&gt;").join('<tr>');
  });
  t = t.split("&lt;span class='pos'&gt;").join('<span class="pos">');
  t = t.split("&lt;span class='neg'&gt;").join('<span class="neg">');
  t = t.split("&lt;div class='tcsrc'&gt;").join('<div class="tcsrc">');
  return t.trim();
}

// Compact data context for the model (cached 15 min; ~15-25KB).
function aiContext_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('aiCtx_v1');
  if (hit) return hit;
  var store = getAggregates() || {};
  var S = store.global || {};
  var D = S.bdDash;
  if (!D) return null;

  var seq = D.seq, curY = D.curY, curM = D.curM, curD = D.curD;
  var dim = new Date(curY, curM + 1, 0).getDate();
  var me = curM + curD / dim;
  function ml(mi) { var s = seq[mi]; return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][s.m] + '-' + String(s.y).slice(2); }
  function isCurY(mi) { return seq[mi] && seq[mi].y === curY; }

  // totals per div+line (Tamer year + BD year) & monthly per div
  var tot = {}, monDiv = {};
  (D.a1 || []).forEach(function (r) { // [div,line,mi,v]
    var kT = r[0] + '|' + r[1];
    tot[kT] = tot[kT] || { tamer: 0, bd: 0 };
    tot[kT].bd += r[3];
    if (isCurY(r[2])) tot[kT].tamer += r[3];
    var mk = r[0] + '|' + ml(r[2]);
    monDiv[mk] = (monDiv[mk] || 0) + r[3];
  });

  // top 20 customers (Tamer year)
  var cust = {};
  (D.a3 || []).forEach(function (r) { // [div,acct,line,mi,v]
    if (!isCurY(r[3])) return;
    var k = r[0] + '|' + r[1];
    cust[k] = (cust[k] || 0) + r[4];
  });
  var topCust = Object.keys(cust).map(function (k) { return [k, Math.round(cust[k])]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 20);

  // top 5 products per div|line (Tamer year)
  var prodBy = {};
  (D.a5 || []).forEach(function (r) { // [div,line,cat,catNo,desc,vPrev,vCur]
    if (!r[6]) return;
    var k = r[0] + '|' + r[1];
    (prodBy[k] = prodBy[k] || []).push([r[3], r[4], Math.round(r[6])]);
  });
  Object.keys(prodBy).forEach(function (k) {
    prodBy[k] = prodBy[k].sort(function (a, b) { return b[2] - a[2]; }).slice(0, 5);
  });

  // returns: per div|line total + top 8 invoices (all months in seq)
  var retTot = {};
  (D.ret1 || []).forEach(function (r) { retTot[r[0] + '|' + r[1]] = Math.round((retTot[r[0] + '|' + r[1]] || 0) + r[3]); });
  var retTop = (D.retDet || []).slice().sort(function (a, b) { return Math.abs(b[6]) - Math.abs(a[6]); })
    .slice(0, 8).map(function (r) { return { invoice: r[3], account: r[2], line: r[0] + '|' + r[1], month: ml(r[5]), value: Math.round(r[6]) }; });

  // LY same-period totals per div|line
  var ly = {};
  (D.l1 || []).forEach(function (r) { ly[r[0] + '|' + r[1]] = Math.round((ly[r[0] + '|' + r[1]] || 0) + r[3]); });

  // ---- stock: FULL aging detail ------------------------------------------
  // The assistant used to receive only totals here and therefore answered
  // "the dashboard does not contain that" to age questions. Every aging bucket
  // the engine holds is now passed through.
  var R = Math.round;
  function agingOf_(o) {
    return { onhand: R(o.onhand || 0), qty: R(o.qty || 0),
      fresh_0_90: R(o.fresh || 0), d91_180: R(o.d91_180 || 0),
      d181_360: R(o.d181_360 || 0), over360: R(o.over360 || 0),
      over180: R((o.d181_360 || 0) + (o.over360 || 0)) };
  }
  function stockBlock_(SS, withDetail) {
    if (!SS || !SS.divisions || !SS.divisions.length) return null;
    var t = { onhand: 0, fresh: 0, d91_180: 0, d181_360: 0, over360: 0 };
    SS.divisions.forEach(function (d) {
      t.onhand += d.onhand || 0; t.fresh += d.fresh || 0; t.d91_180 += d.d91_180 || 0;
      t.d181_360 += d.d181_360 || 0; t.over360 += d.over360 || 0;
    });
    var out = { snapshot: SS.snapshot, total: agingOf_(t),
      byDivision: SS.divisions.map(function (d) {
        var o = agingOf_(d); o.division = d.div;
        if (withDetail) {
          o.warehouses = (d.warehouses || []).map(function (w) {
            return { warehouse: w.whse, value: R(w.value || 0), fresh_0_90: R(w.fresh || 0),
                     d181_360: R(w.d181_360 || 0), over360: R(w.over360 || 0) };
          });
          o.subCategories = (d.subcats || []).map(function (sb) {
            return { subCategory: sb.sub, value: R(sb.value || 0), qty: R(sb.qty || 0), over360: R(sb.over360 || 0) };
          });
        }
        return o;
      }) };
    if (withDetail) {
      var aged = [];
      SS.divisions.forEach(function (d) {
        (d.subcats || []).forEach(function (sb) {
          (sb.items || []).forEach(function (it) {
            if ((it.over360 || 0) > 0) aged.push({ division: d.div, subCategory: sb.sub,
              catalog: it.cat || '', item: it.desc || '', value: R(it.value || 0),
              qty: R(it.qty || 0), over360: R(it.over360 || 0) });
          });
        });
      });
      aged.sort(function (a, b) { return b.over360 - a.over360; });
      out.topItemsAgedOver360 = aged.slice(0, 15);
      out.itemsAgedOver360Count = aged.length;
      // EVERY item, keyed by BD catalog number, so a question about one item is
      // answerable instead of "the dashboard does not contain that". Compact
      // positional form to stay well inside the 100KB context cache.
      var byCat = {};
      SS.divisions.forEach(function (d) {
        (d.subcats || []).forEach(function (sb) {
          (sb.items || []).forEach(function (it) {
            var c = String(it.cat || '').trim() || ('#' + it.code);
            var e = byCat[c] || (byCat[c] = [0, 0, 0, 0, 0, 0, d.div, sb.sub, String(it.desc || '').slice(0, 32)]);
            e[0] += it.qty || 0; e[1] += it.value || 0; e[2] += it.fresh || 0;
            e[3] += it.d91_180 || 0; e[4] += it.d181_360 || 0; e[5] += it.over360 || 0;
          });
        });
      });
      Object.keys(byCat).forEach(function (c) { var e = byCat[c];
        for (var i = 0; i < 6; i++) e[i] = R(e[i]); });
      out.everyItemByCatalog = byCat;
      out.everyItemByCatalogSchema = '{ "BD catalog #": [qty, value, fresh_0_90, d91_180, d181_360, over360, division, subCategory, description] } — values in SAR, one entry per catalog across all warehouses. over180 = d181_360 + over360.';
    }
    return out;
  }
  var localStock = stockBlock_(S.bdSCStock, true);
  var intlStock = stockBlock_(S.bdIntlStock, false);

  // GPPRR consignment by hospital — with its full aging, not just over360
  var stock = null;
  if (S.bdStock && S.bdStock.hospitals) {
    stock = {
      snapshot: S.bdStock.snapshot, total: R(S.bdStock.total),
      hospitals: S.bdStock.hospitals.map(function (h) {
        return { name: h.name, stock: R(h.stock), fresh_0_90: R(h.fresh || 0),
                 d91_180: R(h.d91_180 || 0), d181_360: R(h.d181_360 || 0),
                 over360: R(h.over360 || 0), over180: R((h.d181_360 || 0) + (h.over360 || 0)) };
      })
    };
  }
  // consignment rows: [type,div,line,area,account,value,fresh,d91_180,d181_360,over360]
  var consign = null;
  if (S.bdConsign && S.bdConsign.rows && S.bdConsign.rows.length) {
    consign = { snapshot: S.bdConsign.snapshot, total: R(S.bdConsign.total || 0),
      rows: S.bdConsign.rows.slice(0, 60).map(function (r) {
        return { type: r[0], division: r[1], line: r[2], area: r[3], account: String(r[4]).slice(0, 46),
                 value: R(r[5] || 0), fresh_0_90: R(r[6] || 0), d91_180: R(r[7] || 0),
                 d181_360: R(r[8] || 0), over360: R(r[9] || 0) };
      }) };
  }
  var consignTotal = (S.bdConsign && S.bdConsign.total) ? R(S.bdConsign.total) : null;

  // open NUPCO tenders (OTR tab) — so the assistant can answer commitment questions
  var nupco = null;
  try {
    var NU = getNupco_();
    if (NU && NU.kpis) {
      nupco = { asOf: NU.meta && NU.meta.lastUpdate, scope: NU.meta && NU.meta.scope,
        openValue: NU.kpis.openValue, openQty: NU.kpis.openQty, poCount: NU.kpis.poCount,
        poLines: NU.kpis.poLines, asnValue: NU.kpis.asnValue,
        byTenderType: (NU.breakdowns && NU.breakdowns.tenderType || []).map(function (x) { return { k: x[0], openValue: x[1] }; }),
        byDueStatus: (NU.breakdowns && NU.breakdowns.dueStatus || []).map(function (x) { return { k: x[0], openValue: x[1] }; }),
        byAgingPeriod: (NU.breakdowns && NU.breakdowns.period || []).map(function (x) { return { k: x[0], openValue: x[1] }; }),
        byAccount: (NU.breakdowns && NU.breakdowns.customer || []).slice(0, 15).map(function (x) { return { k: x[0], openValue: x[1] }; }),
        note: 'Open (not yet delivered) NUPCO tender commitments, BD only. Coverage vs stock is computed on the OTR tab.' };
    }
  } catch (e) { }

  var ctx = {
    asOfNote: 'Values in SAR. Tamer year = Jan to today; BD year = Oct to today. Current month is partial.',
    today: { year: curY, monthIndex0: curM, day: curD, monthsElapsed: Math.round(me * 100) / 100 },
    plTargetsAnnualSAR: { DS: 50000000, MMS: 35000000, SM: 90000000, note: 'Annual P&L targets (owners: DS Montaser, SM Nabil, MMS split Nabil 25M / Montaser 10M). Compared here against GROSS billing.' },
    totalsByDivLine: tot,
    monthlyByDiv: monDiv,
    top20CustomersTamerYear: topCust,
    top5ProductsByDivLine: prodBy,
    returnsTotalsByDivLine: retTot,
    topReturnInvoices: retTop,
    lySamePeriodByDivLine: ly,
    stockOnHandWithAging: localStock,
    internationalStockWithAging: intlStock,
    gpprrConsignmentStockMG: stock,
    consignmentDetail: consign,
    stockDimensionsNote: 'Stock aging buckets are: fresh 0-90, 91-180, 181-360, over360 days. "over180" is provided ready-made (181-360 + over360). Stock is held by DIVISION (DS/MMS/SM), warehouse, sub-category and item — the sales "line" (Goods/GPPRR/Kiestra/Service/Tender) is NOT a stock dimension, so answer stock-age questions by division / sub-category / item and say so if the user asks by line.',
    openTendersNUPCO: nupco
  };
  var out = JSON.stringify(ctx);
  try { cache.put('aiCtx_v1', out, 900); } catch (e) { /* >100KB: skip cache */ }
  return out;
}

// ---------------------------- client widget --------------------------------
function chatWidget_() {
  var p = [];
  p.push('<style>');
  p.push('#tcBtn{position:fixed;bottom:20px;right:20px;z-index:400;height:52px;padding:0 20px;border-radius:26px;border:none;cursor:pointer;background:linear-gradient(135deg,#0B2E59,#1D4ED8);color:#fff;font-size:15px;font-weight:800;font-family:"Google Sans",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 8px 24px rgba(11,46,89,.45);transition:transform .15s;display:flex;align-items:center;gap:8px}');
  p.push('#tcBtn:hover{transform:scale(1.05)}');
  p.push('#tcActs{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:10px 11px;border-bottom:1px solid #EDF1F7;background:#fff}');
  p.push('.tca{border-radius:10px;padding:9px 6px;font-size:11.5px;font-weight:800;cursor:pointer;text-align:center;border:1.5px solid}');
  p.push('.tca.deck{background:#FFF7ED;border-color:#F59E0B;color:#B45309}.tca.deck:hover{background:#F59E0B;color:#fff}');
  p.push('.tca.xls{background:#ECFDF3;border-color:#188038;color:#188038}.tca.xls:hover{background:#188038;color:#fff}');
  p.push('.tca.mail{background:#F5F3FF;border-color:#7C3AED;color:#7C3AED}.tca.mail:hover{background:#7C3AED;color:#fff}');
  p.push('.tca.ask{background:#EFF6FF;border-color:#1D4ED8;color:#1D4ED8}.tca.ask:hover{background:#1D4ED8;color:#fff}');
  p.push('#tcBackdrop{position:fixed;inset:0;z-index:401;background:rgba(11,23,45,.55);backdrop-filter:blur(2px);display:none}');
  p.push('#tcBackdrop.open{display:block}');
  p.push('#tcPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:402;width:min(1000px,96vw);height:92vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.45);display:none;flex-direction:column;overflow:hidden;font-family:"Google Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}');
  p.push('#tcPanel.open{display:flex}');
  p.push('#tcHead{background:linear-gradient(135deg,#0B2E59,#1E4A8A);color:#fff;padding:13px 16px;display:flex;align-items:center;gap:9px}');
  p.push('#tcHead .t{font-weight:800;font-size:14.5px}#tcHead .s{font-size:10.5px;color:#B9CCEC;margin-top:1px}');
  p.push('#tcHead .x{margin-left:auto;cursor:pointer;font-size:17px;color:#B9CCEC;background:none;border:none}#tcHead .x:hover{color:#fff}');
  p.push('#tcQs{padding:9px 11px 6px;display:flex;flex-wrap:wrap;gap:5px;border-bottom:1px solid #EDF1F7;background:#F8FAFD;flex:0 0 auto;max-height:26vh;overflow-y:auto}');
  p.push('#tcQhd{display:flex;align-items:center;gap:6px;width:100%;cursor:pointer;font-size:10px;font-weight:800;color:#5F6B7A;text-transform:uppercase;letter-spacing:.5px;user-select:none}');
  p.push('#tcQhd .cv{margin-left:auto;font-size:11px;color:#1D4ED8}');
  p.push('#tcQs.collapsed .tcq{display:none}');
  p.push('.tcq{background:#fff;border:1px solid #D7E1EF;color:#0B2E59;border-radius:14px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-bottom:5px}');
  p.push('.tcq:hover{background:#1D4ED8;border-color:#1D4ED8;color:#fff}');
  p.push('.tcq b{color:#1A73E8;margin-right:3px}.tcq:hover b{color:#fff}');
  p.push('#tcMsgs{flex:1;overflow-y:auto;padding:12px;background:#F4F6FA}');
  p.push('#tcMsgs .tcm{max-width:760px}');
  p.push('.tcm{max-width:88%;margin-bottom:9px;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.65;white-space:pre-wrap;word-wrap:break-word}');
  p.push('.tcm.u{background:#1D4ED8;color:#fff;margin-left:auto;border-bottom-right-radius:4px}');
  p.push('.tcm.a{background:#fff;color:#1F2937;border:1px solid #E3E8EF;margin-right:auto;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.04);max-width:97%;overflow-x:auto}');
  // the dashboard theme (/*RBK1*/) styles bare `table th/td` with !important —
  // these rules must carry !important too or chat tables go gray-on-navy.
  p.push('.tcm.a table{border-collapse:collapse;width:100%;margin:4px 0;font-size:10.5px}');
  p.push('.tcm.a th{background:#0B2E59;color:#fff !important;padding:3px 4px !important;font-size:9.5px !important;text-transform:none;letter-spacing:0;border-bottom:none}');
  p.push('.tcm.a td{border:1px solid #E3E8EF;padding:3px 4px !important;white-space:nowrap;font-size:10.5px !important}');
  p.push('.tcm.a .neg{color:#D93025;font-weight:700}.tcm.a .pos{color:#188038;font-weight:700}');
  p.push('.tcsrc{font-size:9.5px;color:#93A3B8;margin-top:5px}');
  p.push('#tcTyping{display:none;padding:0 14px 8px;color:#5F6B7A;font-size:11px}');
  p.push('#tcIn{display:flex;gap:7px;padding:10px 11px;border-top:1px solid #EDF1F7;background:#fff}');
  p.push('#tcTxt{flex:1;border:1px solid #D7E1EF;border-radius:10px;padding:9px 12px;font-size:12.5px;outline:none;font-family:inherit}');
  p.push('#tcTxt:focus{border-color:#1D4ED8}');
  p.push('#tcSend{background:#1D4ED8;color:#fff;border:none;border-radius:10px;padding:0 16px;font-size:13px;font-weight:800;cursor:pointer}');
  p.push('#tcSend:disabled{background:#9DB6EE;cursor:default}');
  // at <=860px the dashboard sidebar becomes a fixed bottom bar (z-index 50,
  // ~74px tall) — lift the FAB and panel above it or it covers the last nav item.
  p.push('@media (max-width:860px){#tcBtn{bottom:calc(88px + env(safe-area-inset-bottom))}#tcPanel{width:100vw;height:100vh;height:100dvh;max-width:100vw;border-radius:0;top:0;left:0;transform:none}#tcQs{max-height:34vh}}');
  p.push('</style>');

  p.push('<button id="tcBtn" title="AI Assistant">🤖 <span>AI Assistant</span></button>');
  p.push('<div id="tcBackdrop"></div>');
  p.push('<div id="tcPanel">');
  p.push('<div id="tcHead"><div><div class="t">🤖 AI Assistant</div><div class="s">TAMER dashboard data · quick answers, questions & presentations</div></div><button class="x" id="tcClose">✕</button></div>');
  p.push('<div id="tcActs"><button class="tca deck" id="tcDeck">📊 Presentation</button><button class="tca xls" id="tcXls">📈 Excel file</button><button class="tca mail" id="tcMail">✉️ Draft an email</button><button class="tca ask" id="tcAsk">💬 Ask anything</button></div>');
  p.push('<div id="tcQs"></div>');
  p.push('<div id="tcMsgs"></div>');
  p.push('<div id="tcTyping">⏳ Thinking…</div>');
  p.push('<div id="tcIn"><input id="tcTxt" type="text" maxlength="500" placeholder="Type any question…"><button id="tcSend">Send</button></div>');
  p.push('</div>');

  p.push('<script>');
  p.push([
    "(function(){",
    "var TCQ=[",
    " {n:1,t:'Top customers this month',f:qTopCust},",
    " {n:2,t:'Total sales this year',f:qTotalYear},",
    " {n:3,t:'Top products',f:qTopProd},",
    " {n:4,t:'Returns this month',f:qReturns},",
    " {n:5,t:'This month vs last year',f:qYoY},",
    " {n:6,t:'Sales by category',f:qDivBreak},",
    " {n:7,t:'Fastest growing area',f:qBranchGrowth},",
    " {n:8,t:'Top locations',f:qTopBranch},",
    " {n:9,t:'Returns breakdown',f:qRetByLine},",
    " {n:10,t:'Biggest single return',f:qBigReturn},",
    " {n:11,t:'Monthly trend',f:qMonthly}",
    "];",
    "var TGT={DS:50000000,MMS:35000000,SM:90000000};",
    "function esc2(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}",
    "function nf(v){return fmt(Math.round(v));}",
    "function curMi(){for(var i=D.seq.length-1;i>=0;i--){if(D.seq[i].y===D.curY&&D.seq[i].m===D.curM)return i;}return D.seq.length-1;}",
    "function dvScope(){return (typeof st!=='undefined'&&st.div)?st.div:(LOCK||'ALL');}",
    "function inScope(dv){var s=dvScope();return s==='ALL'||dv===s;}",
    "function scopeLbl(){var s=dvScope();return s==='ALL'?'All BD':(s+' division');}",
    "// Q1 — top 5 customers this month",
    "function qTopCust(){var mi=curMi(),m={};for(var i=0;i<D.a3.length;i++){var r=D.a3[i];if(!inScope(r[0]))continue;if(r[3]!==mi)continue;var k=(dvScope()==='ALL'?r[0]+' · ':'')+r[1];m[k]=(m[k]||0)+r[4];}",
    "var a=Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(x,y){return y[1]-x[1];}).slice(0,5);",
    "if(!a.length)return 'No billing so far in '+mlab(mi)+' for '+scopeLbl()+'.';",
    "var h='🏆 Top 5 customers in '+mlab(mi)+' (partial, up to today) — '+scopeLbl()+':\\n<table><tr><th>#</th><th>Customer</th><th>SAR</th></tr>';",
    "for(var j=0;j<a.length;j++){h+='<tr><td>'+(j+1)+'</td><td>'+esc2(a[j][0])+'</td><td class=pos>'+nf(a[j][1])+'</td></tr>';}",
    "h+='</table><div class=tcsrc>Source: this page\\u2019s data · gross billing</div>';return h;}",
    "// Q2 — total sales this year",
    "function qTotalYear(){var tot=0,mi=curMi(),mtot=0,ms={};for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!inScope(r[0]))continue;if(!D.seq[r[2]]||D.seq[r[2]].y!==D.curY)continue;tot+=r[3];ms[r[2]]=1;if(r[2]===mi)mtot+=r[3];}",
    "var nm=Object.keys(ms).length;if(!tot)return 'No sales recorded yet for '+scopeLbl()+' this year.';",
    "var h='💰 Sales so far this year — '+scopeLbl()+':\\n<table><tr><th>Metric</th><th>Value</th></tr>';",
    "h+='<tr><td>Total (Jan → today)</td><td class=pos>'+nf(tot)+'</td></tr>';",
    "h+='<tr><td>This month ('+mlab(mi)+', partial)</td><td>'+nf(mtot)+'</td></tr>';",
    "h+='<tr><td>Active months</td><td>'+nm+'</td></tr>';",
    "h+='<tr><td>Avg / month</td><td>'+nf(nm?tot/nm:0)+'</td></tr></table><div class=tcsrc>Current month partial · SAR</div>';return h;}",
    "// Q3 — top products (all, this year)",
    "function qTopProd(){var m={},dsc={};for(var i=0;i<(D.a5||[]).length;i++){var r=D.a5[i];if(!inScope(r[0]))continue;if(!r[6])continue;m[r[3]]=(m[r[3]]||0)+r[6];if(!dsc[r[3]])dsc[r[3]]=r[4];}",
    "var a=Object.keys(m).map(function(k){return [k,dsc[k],m[k]];}).sort(function(x,y){return y[2]-x[2];}).slice(0,8);",
    "if(!a.length)return 'No product sales for '+scopeLbl()+' this year.';",
    "var h='📦 Top products — this year — '+scopeLbl()+':\\n<table><tr><th>#</th><th>Code</th><th>Product</th><th>SAR</th></tr>';",
    "for(var j=0;j<a.length;j++){h+='<tr><td>'+(j+1)+'</td><td><b>'+esc2(a[j][0])+'</b></td><td>'+esc2(String(a[j][1]).slice(0,45))+'</td><td class=pos>'+nf(a[j][2])+'</td></tr>';}",
    "h+='</table><div class=tcsrc>Source: this page\\u2019s data · gross billing</div>';return h;}",
    "// Q4 — returns this month + biggest return invoices",
    "function qReturns(){var mi=curMi(),tot=0;for(var i=0;i<(D.ret1||[]).length;i++){var r=D.ret1[i];if(!inScope(r[0]))continue;if(r[2]!==mi)continue;tot+=r[3];}",
    "var det=[];for(var i2=0;i2<(D.retDet||[]).length;i2++){var r2=D.retDet[i2];if(!inScope(r2[0]))continue;if(r2[5]!==mi)continue;det.push(r2);}",
    "det.sort(function(x,y){return Math.abs(y[6])-Math.abs(x[6]);});",
    "if(!tot&&!det.length)return '✅ No returns recorded in '+mlab(mi)+' for '+scopeLbl()+' so far.';",
    "var h='↩️ Returns in '+mlab(mi)+' (partial) — '+scopeLbl()+':\\nTotal: <span class=neg>'+nf(tot)+'</span> SAR\\n';",
    "if(det.length){h+='Biggest return invoices:\\n<table><tr><th>Invoice</th><th>Account</th><th>SAR</th></tr>';",
    "for(var j=0;j<Math.min(3,det.length);j++){h+='<tr><td><b>'+esc2(det[j][3])+'</b></td><td>'+esc2(String(det[j][2]).slice(0,32))+'</td><td class=neg>'+nf(det[j][6])+'</td></tr>';}h+='</table>';}",
    "h+='<div class=tcsrc>Source: this page\\u2019s data · more detail in the Returns tab</div>';return h;}",
    "// Q5 — this month vs same month LY (same-period partial)",
    "function qYoY(){var mi=curMi(),grp={},grpLy={};var all=dvScope()==='ALL';",
    "for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!inScope(r[0]))continue;if(r[2]!==mi)continue;var g=all?r[0]:r[1];grp[g]=(grp[g]||0)+r[3];}",
    "for(var i2=0;i2<(D.l1||[]).length;i2++){var r2=D.l1[i2];if(!inScope(r2[0]))continue;if(r2[2]!==D.curM)continue;var g2=all?r2[0]:r2[1];grpLy[g2]=(grpLy[g2]||0)+r2[3];}",
    "var ks={};Object.keys(grp).forEach(function(k){ks[k]=1;});Object.keys(grpLy).forEach(function(k){ks[k]=1;});var keys=Object.keys(ks);",
    "if(!keys.length)return 'No data for this month yet.';",
    "var h='📅 '+mlab(mi)+' vs same period last year (up to day '+D.curD+') — '+scopeLbl()+':\\n<table><tr><th>'+(all?'Division':'Line')+'</th><th>This year</th><th>Last year</th><th>Δ</th></tr>';",
    "var tc=0,tl=0;keys.sort().forEach(function(k){var c=grp[k]||0,l=grpLy[k]||0;tc+=c;tl+=l;var d=l?Math.round((c-l)/l*100):null;",
    "h+='<tr><td><b>'+esc2(k)+'</b></td><td>'+nf(c)+'</td><td>'+nf(l)+'</td><td class='+(d==null?'':(d>=0?'pos':'neg'))+'>'+(d==null?'new':(d>=0?'+':'')+d+'%')+'</td></tr>';});",
    "var td=tl?Math.round((tc-tl)/tl*100):null;",
    "h+='<tr><td><b>Total</b></td><td><b>'+nf(tc)+'</b></td><td><b>'+nf(tl)+'</b></td><td class='+(td==null?'':(td>=0?'pos':'neg'))+'><b>'+(td==null?'—':(td>=0?'+':'')+td+'%')+'</b></td></tr></table>';",
    "h+='<div class=tcsrc>LY = same partial period of the matching month (l1)</div>';return h;}",
    "// Q6 — GPPRR months of cover per hospital",
    "function qCover(){if(!STK||!STK.hospitals||typeof covSales!=='function')return 'GPPRR stock data is not available on this page.';",
    "var sales=covSales(),me=COV.me;var hs=STK.hospitals.slice().sort(function(a,b){return b.stock-a.stock;});",
    "var h='📦 GPPRR consignment stock (MG warehouses) & months of cover — snapshot '+esc2(STK.snapshot||'')+':\\n<table><tr><th>Hospital</th><th>Stock</th><th>Cover</th></tr>';",
    "hs.forEach(function(hp){var y=sales[hp.name]||0,avg=y/me,cov=avg>0?(hp.stock/avg):null;",
    "h+='<tr><td>'+esc2(hp.name)+'</td><td>'+nf(hp.stock)+'</td><td class='+(cov==null?'neg':(cov<=12?'pos':'neg'))+'>'+(cov==null?'No billing ⚠️':cov.toFixed(1)+' mo')+'</td></tr>';});",
    "h+='</table><div class=tcsrc>Cover = stock ÷ avg monthly billing (Jan→today ÷ '+me.toFixed(2)+') · long cover or no billing = idle stock</div>';return h;}",
    "// Q7 — fastest growing branch (last complete month vs avg of prior 3)",
    "function qBranchGrowth(){var mi=curMi()-1;if(mi<3)return 'Not enough months to compare.';",
    "var cur={},prev={};for(var i=0;i<D.a2.length;i++){var r=D.a2[i];if(!inScope(r[0]))continue;",
    "if(r[2]===mi)cur[r[1]]=(cur[r[1]]||0)+r[3];",
    "if(r[2]>=mi-3&&r[2]<mi)prev[r[1]]=(prev[r[1]]||0)+r[3]/3;}",
    "var a=[];Object.keys(cur).forEach(function(b){var p2=prev[b]||0;if(p2<50000)return;a.push([b,cur[b],p2,(cur[b]-p2)/p2*100]);});",
    "if(!a.length)return 'No branches large enough to compare for '+scopeLbl()+'.';",
    "a.sort(function(x,y){return y[3]-x[3];});",
    "var h='📈 Fastest growing branches — '+mlab(mi)+' (last complete month) vs the prior 3-month average — '+scopeLbl()+':\\n<table><tr><th>Branch</th><th>'+mlab(mi)+'</th><th>3-mo avg</th><th>Growth</th></tr>';",
    "for(var j=0;j<Math.min(3,a.length);j++){var g=Math.round(a[j][3]);h+='<tr><td><b>'+esc2(a[j][0])+'</b></td><td>'+nf(a[j][1])+'</td><td>'+nf(a[j][2])+'</td><td class='+(g>=0?'pos':'neg')+'>'+(g>=0?'+':'')+g+'%</td></tr>';}",
    "var w=a[a.length-1];if(a.length>3)h+='<tr><td colspan=4 style=\"color:#5F6B7A\">Biggest decline: <b>'+esc2(w[0])+'</b> ('+Math.round(w[3])+'%)</td></tr>';",
    "h+='</table><div class=tcsrc>Branches averaging under 50K are excluded</div>';return h;}",
    "// Q8 — division breakdown YTD (Tamer year)",
    "function qDivBreak(){var m={},tot=0;for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!D.seq[r[2]]||D.seq[r[2]].y!==D.curY)continue;if(!inScope(r[0]))continue;m[r[0]]=(m[r[0]]||0)+r[3];tot+=r[3];}",
    "var a=Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(x,y){return y[1]-x[1];});if(!a.length)return 'No data.';",
    "var h='🏢 Division breakdown — Tamer year (Jan→today) — '+scopeLbl()+':\\n<table><tr><th>Division</th><th>SAR</th><th>Share</th></tr>';",
    "a.forEach(function(x){h+='<tr><td><b>'+esc2(x[0])+'</b></td><td class=pos>'+nf(x[1])+'</td><td>'+(tot?Math.round(x[1]/tot*100):0)+'%</td></tr>';});",
    "h+='<tr><td><b>Total</b></td><td><b>'+nf(tot)+'</b></td><td>100%</td></tr></table><div class=tcsrc>Gross billing · partial current month</div>';return h;}",
    "// Q9 — line breakdown (Tamer year)",
    "function qLineBreak(){var m={},tot=0;for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!D.seq[r[2]]||D.seq[r[2]].y!==D.curY)continue;if(!inScope(r[0]))continue;var k=(dvScope()==='ALL'?r[0]+' · ':'')+r[1];m[k]=(m[k]||0)+r[3];tot+=r[3];}",
    "var a=Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(x,y){return y[1]-x[1];});if(!a.length)return 'No data.';",
    "var h='🧬 Line breakdown — Tamer year — '+scopeLbl()+':\\n<table><tr><th>Line</th><th>SAR</th><th>Share</th></tr>';",
    "a.forEach(function(x){h+='<tr><td>'+esc2(x[0])+'</td><td class=pos>'+nf(x[1])+'</td><td>'+(tot?Math.round(x[1]/tot*100):0)+'%</td></tr>';});",
    "h+='<tr><td><b>Total</b></td><td><b>'+nf(tot)+'</b></td><td>100%</td></tr></table><div class=tcsrc>Gross billing · partial current month</div>';return h;}",
    "// Q10 — top branches (Tamer year)",
    "function qTopBranch(){var mo=months(),m={};for(var i=0;i<D.a2.length;i++){var r=D.a2[i];if(!inScope(r[0]))continue;if(mo.indexOf(r[2])<0)continue;m[r[1]]=(m[r[1]]||0)+r[3];}",
    "var a=Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(x,y){return y[1]-x[1];}).slice(0,8);if(!a.length)return 'No branch data for '+scopeLbl()+'.';",
    "var h='🏬 Top branches — '+scopeLbl()+' (selected period):\\n<table><tr><th>#</th><th>Branch</th><th>SAR</th></tr>';",
    "for(var j=0;j<a.length;j++){h+='<tr><td>'+(j+1)+'</td><td>'+esc2(a[j][0])+'</td><td class=pos>'+nf(a[j][1])+'</td></tr>';}",
    "h+='</table><div class=tcsrc>Source: this page\\u2019s data (a2)</div>';return h;}",
    "// Q11 — returns by line (all periods)",
    "function qRetByLine(){var m={},tot=0;for(var i=0;i<(D.ret1||[]).length;i++){var r=D.ret1[i];if(!inScope(r[0]))continue;var k=(dvScope()==='ALL'?r[0]+' · ':'')+r[1];m[k]=(m[k]||0)+r[3];tot+=r[3];}",
    "var a=Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(x,y){return x[1]-y[1];});if(!a.length)return '✅ No returns recorded for '+scopeLbl()+'.';",
    "var h='↩️ Returns by line — '+scopeLbl()+':\\n<table><tr><th>Line</th><th>SAR</th></tr>';",
    "a.forEach(function(x){h+='<tr><td>'+esc2(x[0])+'</td><td class=neg>'+nf(x[1])+'</td></tr>';});",
    "h+='<tr><td><b>Total</b></td><td class=neg><b>'+nf(tot)+'</b></td></tr></table><div class=tcsrc>From the sales sheets (negative-value rows)</div>';return h;}",
    "// Q12 — BD year vs Tamer year per division",
    "function qBdVsTam(){var tam={},bd={};for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!inScope(r[0]))continue;var g=(dvScope()==='ALL'?r[0]:r[1]);bd[g]=(bd[g]||0)+r[3];if(D.seq[r[2]]&&D.seq[r[2]].y===D.curY)tam[g]=(tam[g]||0)+r[3];}",
    "var ks={};Object.keys(bd).forEach(function(k){ks[k]=1;});var keys=Object.keys(ks);if(!keys.length)return 'No data.';",
    "var h='📆 BD year (Oct→today) vs Tamer year (Jan→today) — '+scopeLbl()+':\\n<table><tr><th>'+(dvScope()==='ALL'?'Division':'Line')+'</th><th>BD year</th><th>Tamer year</th></tr>';",
    "var tb=0,tt=0;keys.sort().forEach(function(k){var b=bd[k]||0,t=tam[k]||0;tb+=b;tt+=t;h+='<tr><td><b>'+esc2(k)+'</b></td><td>'+nf(b)+'</td><td>'+nf(t)+'</td></tr>';});",
    "h+='<tr><td><b>Total</b></td><td><b>'+nf(tb)+'</b></td><td><b>'+nf(tt)+'</b></td></tr></table><div class=tcsrc>BD year adds Oct\\u2013Dec of last year · gross billing</div>';return h;}",
    "// Q13 — biggest single return invoice (all periods)",
    "function qBigReturn(){var det=(D.retDet||[]).filter(function(r){return inScope(r[0]);});if(!det.length)return '✅ No return invoices for '+scopeLbl()+'.';",
    "det=det.slice().sort(function(a,b){return Math.abs(b[6])-Math.abs(a[6]);}).slice(0,5);",
    "var h='↩️ Biggest single returns — '+scopeLbl()+':\\n<table><tr><th>Invoice</th><th>Account</th><th>Line</th><th>SAR</th></tr>';",
    "det.forEach(function(r){h+='<tr><td><b>'+esc2(r[3])+'</b></td><td>'+esc2(String(r[2]).slice(0,26))+'</td><td>'+esc2(r[1])+'</td><td class=neg>'+nf(r[6])+'</td></tr>';});",
    "h+='</table><div class=tcsrc>Source: this page\\u2019s data (retDet)</div>';return h;}",
    "// Q14 — monthly total trend (Tamer year)",
    "function qMonthly(){var mo=months(),m={};for(var i=0;i<D.a1.length;i++){var r=D.a1[i];if(!inScope(r[0]))continue;if(mo.indexOf(r[2])<0)continue;m[r[2]]=(m[r[2]]||0)+r[3];}",
    "var keys=Object.keys(m).map(Number).sort(function(a,b){return a-b;});if(!keys.length)return 'No data.';",
    "var h='📈 Monthly total — '+scopeLbl()+':\\n<table><tr><th>Month</th><th>SAR</th></tr>';var tot=0;",
    "keys.forEach(function(mi){tot+=m[mi];h+='<tr><td>'+mlab(mi)+'</td><td class=pos>'+nf(m[mi])+'</td></tr>';});",
    "h+='<tr><td><b>Total</b></td><td><b>'+nf(tot)+'</b></td></tr></table><div class=tcsrc>Gross billing · current month partial</div>';return h;}",
    "// ---- UI wiring ----",
    "var elB=document.getElementById('tcBtn'),elP=document.getElementById('tcPanel'),elQ=document.getElementById('tcQs'),elM=document.getElementById('tcMsgs'),elT=document.getElementById('tcTxt'),elS=document.getElementById('tcSend'),elTy=document.getElementById('tcTyping');",
    "var qh='<div id=tcQhd><span>⚡ Quick questions — tap a number</span><span class=cv id=tcQcv>Hide ▲</span></div>';",
    "TCQ.forEach(function(q){qh+='<button class=tcq data-q=\"'+q.n+'\"><b>'+q.n+'</b>'+q.t+'</button>';});",
    "elQ.innerHTML=qh;",
    "document.getElementById('tcQhd').onclick=function(){var c=elQ.classList.toggle('collapsed');document.getElementById('tcQcv').textContent=c?'Show ▼':'Hide ▲';};",
    "function addMsg(html,who){var d=document.createElement('div');d.className='tcm '+who;d.innerHTML=html;elM.appendChild(d);elM.scrollTop=elM.scrollHeight;}",
    "var elBd=document.getElementById('tcBackdrop');",
    "function openPanel(){elP.classList.add('open');elBd.classList.add('open');if(!elM.children.length){addMsg('Hi 👋 I\\u2019m your AI assistant for this dashboard.\\n\\u2022 Tap a numbered quick question for an instant answer\\n\\u2022 📊 Presentation \\u00b7 📈 Excel \\u00b7 ✉️ Draft email \\u2014 describe it and I\\u2019ll build it from the dashboard data\\n\\u2022 💬 Ask anything \\u2014 free questions answered from the data','a');}elT.focus();}",
    "function closePanel(){elP.classList.remove('open');elBd.classList.remove('open');}",
    "elB.onclick=function(){if(elP.classList.contains('open'))closePanel();else openPanel();};",
    "elBd.onclick=closePanel;",
    "document.getElementById('tcClose').onclick=closePanel;",
    "document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&elP.classList.contains('open'))closePanel();});",
    "elQ.onclick=function(ev){var b=ev.target.closest('.tcq');if(!b)return;var q=null;for(var i=0;i<TCQ.length;i++){if(TCQ[i].n==b.getAttribute('data-q'))q=TCQ[i];}if(!q)return;",
    "addMsg(esc2(q.n+'. '+q.t),'u');try{addMsg(q.f(),'a');}catch(e){addMsg('Something went wrong computing this answer: '+esc2(e.message),'a');}};",
    "var elD=document.getElementById('tcDeck'),elX=document.getElementById('tcXls'),elMl=document.getElementById('tcMail'),elA=document.getElementById('tcAsk');",
    "var mode='ask';", // ask | deck | xls | mail
    "var PH={ask:'Type any question\\u2026',deck:'Describe your presentation\\u2026',xls:'Describe the Excel file\\u2026',mail:'Describe the email\\u2026'};",
    "function setMode(m){mode=m;elT.placeholder=PH[m]||PH.ask;}",
    "elD.onclick=function(){setMode('deck');addMsg('📊 Sure — describe what the presentation should include (e.g. \"DS performance vs target, top customers, returns\") and I\\u2019ll build a Google Slides deck.','a');elT.focus();};",
    "elX.onclick=function(){setMode('xls');addMsg('📈 Describe the Excel file you want (e.g. \"all products by line with values, plus a returns tab\") and I\\u2019ll build it and give you a download link.','a');elT.focus();};",
    "elMl.onclick=function(){setMode('mail');addMsg('✉️ Describe the email (topic, recipient, tone). I\\u2019ll write it and save it to your Gmail Drafts \\u2014 nothing is sent.','a');elT.focus();};",
    "elA.onclick=function(){setMode('ask');addMsg('💬 Ask me anything about the dashboard data \\u2014 customers, products, targets, returns, stock cover, comparisons\\u2026','a');elT.focus();};",
    "function noGoogle(){if(typeof google==='undefined'||!google.script||!google.script.run){addMsg('This feature needs the page opened from the official dashboard link. The quick questions above work as usual 👆','a');return true;}return false;}",
    "function commonFail(res){",
    "if(res&&res.code==='NO_KEY'){addMsg('🔑 AI features are not activated yet (a Gemini key needs to be added in the project settings).\\nThe numbered quick questions above work as usual 👆','a');}",
    "else if(res&&res.code==='BLOCKED'){addMsg('The AI declined this request — try rephrasing it.','a');}",
    "else if(res&&res.code==='PARSE'){addMsg('I could not structure that — try describing what you want more concretely.','a');}",
    "else{addMsg('Could not complete this right now'+esc2(res&&res.msg?(' ('+res.msg+')'):'')+' — please try again.','a');}}",
    "function busy(t){elS.disabled=true;elTy.textContent=t;elTy.style.display='block';}",
    "function done(){elS.disabled=false;elTy.style.display='none';}",
    "function btnLink(href,label,color){return '<a href=\"'+esc2(href)+'\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;margin-top:6px;background:'+color+';color:#fff;font-weight:800;padding:8px 14px;border-radius:9px;text-decoration:none\">'+label+'</a>';}",
    "function runAsk(q){busy('⏳ Thinking\\u2026');",
    "google.script.run.withSuccessHandler(function(res){done();",
    "if(res&&res.ok){addMsg(res.answer,'a');}else{commonFail(res);}",
    "}).withFailureHandler(function(err){done();addMsg('Connection error: '+esc2(err&&err.message||err),'a');",
    "}).askAI(q,dvScope());}",
    "function runDeck(q){busy('📊 Building your presentation\\u2026 about a minute');",
    "google.script.run.withSuccessHandler(function(res){done();setMode('ask');",
    "if(res&&res.ok){addMsg('📊 <b>'+esc2(res.title||'Presentation')+'</b> is ready ('+(res.slides||'?')+' slides).\\n'+btnLink(res.url,'Open in Google Slides ↗','#B45309')+'\\n<span class=tcsrc>Shared view-only inside Tamer \\u00b7 built from live dashboard data</span>','a');}",
    "else{commonFail(res);}",
    "}).withFailureHandler(function(err){done();setMode('ask');addMsg('Connection error: '+esc2(err&&err.message||err),'a');",
    "}).makeDeck(q,dvScope());}",
    "function runXls(q){busy('📈 Building your Excel file\\u2026 about a minute');",
    "google.script.run.withSuccessHandler(function(res){done();setMode('ask');",
    "if(res&&res.ok){addMsg('📈 <b>'+esc2(res.title||'Excel file')+'</b> is ready ('+(res.sheets||'?')+' tab(s)).\\n'+btnLink(res.download||res.url,'⬇ Download Excel','#188038')+' '+btnLink(res.url,'Open online ↗','#0B2E59')+'\\n<span class=tcsrc>Built from live dashboard data</span>','a');}",
    "else{commonFail(res);}",
    "}).withFailureHandler(function(err){done();setMode('ask');addMsg('Connection error: '+esc2(err&&err.message||err),'a');",
    "}).makeSheet(q,dvScope());}",
    "function runMail(q){busy('✉️ Writing your email\\u2026');",
    "google.script.run.withSuccessHandler(function(res){done();setMode('ask');",
    "if(res&&res.ok){var pv='<b>Subject:</b> '+esc2(res.subject)+(res.to?('<br><b>To:</b> '+esc2(res.to)):'')+'<br><br>'+esc2(res.body).replace(/\\n/g,'<br>');addMsg('✉️ Draft saved to your Gmail Drafts (not sent).\\n'+pv+'\\n'+btnLink(res.draftUrl||'https://mail.google.com/mail/u/0/#drafts','Open Gmail Drafts ↗','#7C3AED'),'a');}",
    "else{commonFail(res);}",
    "}).withFailureHandler(function(err){done();setMode('ask');addMsg('Connection error: '+esc2(err&&err.message||err),'a');",
    "}).makeEmail(q,dvScope());}",
    "function freeAsk(){var q=(elT.value||'').trim();if(!q)return;elT.value='';addMsg(esc2(q),'u');",
    "if(noGoogle())return;",
    "var m=mode;",
    "if(m==='ask'){if(/\\b(presentation|deck|slides|powerpoint|ppt)\\b/i.test(q))m='deck';else if(/\\b(excel|spreadsheet|xlsx|sheet|workbook)\\b/i.test(q))m='xls';else if(/\\b(email|e-mail|draft.*mail|mail.*draft)\\b/i.test(q))m='mail';}",
    "if(m==='deck')runDeck(q);else if(m==='xls')runXls(q);else if(m==='mail')runMail(q);else runAsk(q);}",
    "elS.onclick=freeAsk;",
    "elT.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();freeAsk();}});",
    "})();"
  ].join('\n'));
  p.push('</script>');
  return p.join('\n');
}

// ---------------------------------------------------------------------------
// Executive Brief commentary. The client sends the figures it has already
// measured and displayed; the model gets those and nothing else, and is told
// plainly it may not introduce a number of its own. Anything it returns that
// is not one of the supplied figures is stripped before it reaches the screen,
// so the commentary can never quietly invent a total in front of the CEO.
// ---------------------------------------------------------------------------
function briefAI(factsJson) {
  try {
    var facts;
    try { facts = JSON.parse(factsJson); } catch (e) { return { ok:false, code:'BAD_INPUT' }; }
    if (!facts || !facts.book) return { ok:false, code:'BAD_INPUT' };

    var cache = CacheService.getScriptCache();
    var key = 'brief_' + Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, factsJson)).slice(0, 40);
    var hit = cache.get(key);
    if (hit) return { ok:true, text:hit, cached:true, model:'cached' };

    var sys = [
      'You are briefing the CEO of TAMER Healthcare before a meeting about the open NUPCO order book (BD products, Saudi Arabia).',
      'You are given figures already measured from the live data. Write what a sharp chief of staff would write.',
      '',
      'HARD RULES:',
      '- Use ONLY the numbers in the JSON below. Never state a number that is not there, and never estimate one.',
      '- A percentage is allowed only where it is arithmetic on two supplied numbers.',
      '- Do not invent causes, names, dates, customers or commitments.',
      '- Say plainly when a number is bad news. No hedging, no filler, no apologies.',
      '',
      'FORMAT: 5 to 7 short lines, each starting with a bullet character. Plain text only, no markdown.',
      'First line = the single most important thing the CEO must grasp.',
      'Last line = the one decision that unlocks the most value.',
      'Currency is SAR, with thousand separators.',
      '',
      'MEASURED FIGURES (the only permitted source):',
      JSON.stringify(facts, null, 1)
    ].join('\n');

    var ck = claudeKey_();
    var res;
    if (ck) {
      res = claudeGenerate_(ck, sys, 'Write the commentary.', { effort:'high', maxTokens:2000 });
    } else {
      var props = PropertiesService.getScriptProperties();
      var gk = props.getProperty('GEMINI_API_KEY');
      if (!gk) return { ok:false, code:'NO_KEY' };
      var model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';
      res = tcGenerate_(gk, model, { temperature:0.2, maxOutputTokens:1200 },
        sys + '\n\nWrite the commentary.');
    }
    if (!res || !res.ok) return { ok:false, code:(res && res.code) || 'API' };

    var text = briefScrub_(res.text, facts);
    cache.put(key, text, 1800);
    return { ok:true, text:text, model: ck ? 'Claude' : 'Gemini' };
  } catch (e) {
    console.error('briefAI failed: ' + (e && e.message));
    return { ok:false, code:'ERR' };
  }
}
// Drops any line carrying a figure we did not supply. A model that invents a
// total loses that line, rather than putting a number the dashboard cannot
// stand behind in front of the CEO.
function briefScrub_(text, facts) {
  var allowed = {};
  (function walk(o) {
    if (o == null) return;
    if (typeof o === 'number') { allowed[Math.round(o)] = 1; return; }
    if (typeof o === 'object') { Object.keys(o).forEach(function (k) { walk(o[k]); }); }
  })(facts);
  var nums = Object.keys(allowed).map(Number), pcts = {};
  nums.forEach(function (a) { nums.forEach(function (b) {
    if (b > 0 && a <= b) pcts[Math.round(100 * a / b)] = 1; }); });

  var kept = String(text || '').split('\n').filter(function (line) {
    var found = String(line).match(/\d[\d,]*(?:\.\d+)?/g) || [];
    for (var i = 0; i < found.length; i++) {
      var raw = found[i], n = Number(raw.replace(/,/g, ''));
      if (isNaN(n)) continue;
      if (/%/.test(line) && pcts[Math.round(n)]) continue;  // a derived percentage
      if (n < 100 && raw.indexOf(',') < 0) continue;        // counts, list markers, years
      if (!allowed[Math.round(n)]) return false;            // a figure never supplied
    }
    return true;
  });
  return kept.join('\n').trim() ||
    '(The commentary was withheld: it contained figures that are not in the measured data.)';
}
