// ============================================================================
// Recognised-cube intake — Apps Script replacement for the n8n
// `recog-sd7-upd8k2x` webhook + "Store Recognized" node.
//
// The daily Looker scrape POSTs the SD7 recognised cube here instead of to
// n8n. Stored in its own Drive file (kept separate from the sales store so a
// bad push can never damage the sales aggregate).
//
// Contract (unchanged from the n8n node, so the existing scraper only needs a
// new URL + the shared key):
//   POST <webapp>/exec?_k=<RECOG_KEY>
//   body: {total, budget, asof, viz?, cube?, wopInv?, retInv?}
//   - omitting `viz` / `cube` / `wopInv` / `retInv` PRESERVES the stored one
//   - omitting `budget` preserves the stored budget
// ============================================================================

var RECOG_FILE = 'TAMER-Recognised-Data.json';
var RECOG_PROP = 'RECOG_KEY';   // set in Script Properties; never hard-coded

function getRecognised(){
  var it = DriveApp.getFilesByName(RECOG_FILE);
  if(!it.hasNext()) return null;
  try { return JSON.parse(it.next().getBlob().getDataAsString()); } catch(e){ return null; }
}
function writeRecognised_(o){
  var s = JSON.stringify(o);
  var it = DriveApp.getFilesByName(RECOG_FILE);
  while(it.hasNext()) it.next().setTrashed(true);
  DriveApp.createFile(RECOG_FILE, s, 'application/json');
}

function _jsonOut_(o){
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  var key = PropertiesService.getScriptProperties().getProperty(RECOG_PROP);
  var got = (e && e.parameter && e.parameter._k) || '';
  if(!key || got !== key) return _jsonOut_({ ok:false, error:'forbidden' });

  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err){ return _jsonOut_({ ok:false, error:'bad json' }); }

  var total = Number(body.total);
  // sanity range carried over from the n8n node - refuse an obviously broken scrape
  // rather than overwrite a good cube with garbage.
  if(!isFinite(total) || total < 10000000 || total > 500000000)
    return _jsonOut_({ ok:false, error:'total out of range: '+body.total });

  var prev = getRecognised() || {};
  var rec = {
    total:   Math.round(total),
    budget:  (body.budget != null ? Number(body.budget) : prev.budget) || null,
    asof:    body.asof || new Date().toISOString().slice(0,10),
    updated: new Date().toISOString(),
    // optional blocks: keep the last good one when the push omits them
    viz:     body.viz     || prev.viz     || null,
    cube:    body.cube    || prev.cube    || null,
    wopInv:  body.wopInv  || prev.wopInv  || null,
    retInv:  body.retInv  || prev.retInv  || null
  };
  writeRecognised_(rec);
  return _jsonOut_({ ok:true, total:rec.total, asof:rec.asof,
    kept:{ viz:!body.viz && !!rec.viz, cube:!body.cube && !!rec.cube } });
}

// one-off helper: generate + store the shared key, then print it once
function setupRecogKey(){
  var p = PropertiesService.getScriptProperties();
  var k = p.getProperty(RECOG_PROP);
  if(!k){
    k=''; var A='abcdef0123456789';
    for(var i=0;i<32;i++) k+=A.charAt(Math.floor(Math.random()*A.length));
    p.setProperty(RECOG_PROP,k);
  }
  Logger.log('RECOG_KEY = '+k);
  return k;
}
