function doGet(e) {
  const q = (e && e.parameter) || {};
  const p = ((q.page || 'bd') + '').toLowerCase();
  // Refresh the GP cache from within the web-app identity (USER_DEPLOYING),
  // so the store always lands in the deploying account's Drive that fetchPage reads.
  if (q.gpingest) {
    var _r; try { _r = gpIngest(); } catch (_e) { _r = { error: String(_e) }; }
    return ContentService.createTextOutput(JSON.stringify(_r)).setMimeType(ContentService.MimeType.JSON);
  }
  const st = (q.st || '') + '';
  const shell = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#0F2A6B;background:linear-gradient(135deg,#0F2A6B 0%,#1D4ED8 55%,#3B82F6 100%);color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden;position:relative}.orb{position:absolute;border-radius:50%;filter:blur(48px);opacity:.35;animation:float 9s ease-in-out infinite}.orb.a{width:420px;height:420px;background:#60A5FA;top:-120px;left:-100px}.orb.b{width:360px;height:360px;background:#1E40AF;bottom:-120px;right:-80px;animation-delay:-3s}.orb.c{width:280px;height:280px;background:#93C5FD;bottom:40px;left:30%;animation-delay:-5s;opacity:.22}@keyframes float{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-30px) translateX(20px)}}.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:radial-gradient(circle at 50% 45%,#000 30%,transparent 75%);mask-image:radial-gradient(circle at 50% 45%,#000 30%,transparent 75%)}.wrap{position:relative;z-index:2;text-align:center;padding:32px}.logo{display:inline-block;background:#fff;color:#0F2A6B;font-weight:800;letter-spacing:.5px;font-size:30px;padding:12px 26px;border-radius:16px;box-shadow:0 18px 44px rgba(0,0,0,.28);animation:pop .7s cubic-bezier(.2,.8,.2,1) both}@keyframes pop{0%{transform:scale(.82);opacity:0}100%{transform:scale(1);opacity:1}}.sub{margin-top:16px;font-size:16px;font-weight:600;color:#DBE7FF;letter-spacing:.3px}.tag{margin-top:4px;font-size:12.5px;color:#9DB6EE;font-weight:500}.ring{margin:34px auto 0;width:56px;height:56px}.ring svg{width:56px;height:56px;animation:spin 1.1s linear infinite}.ring circle{fill:none;stroke-width:5;stroke-linecap:round}.ring .bg{stroke:rgba(255,255,255,.18)}.ring .fg{stroke:#fff;stroke-dasharray:150;stroke-dashoffset:110}@keyframes spin{to{transform:rotate(360deg)}}.bar{margin:26px auto 0;width:230px;height:6px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden}.bar i{display:block;height:100%;width:40%;border-radius:99px;background:linear-gradient(90deg,transparent,#fff,transparent);animation:slide 1.4s ease-in-out infinite}@keyframes slide{0%{transform:translateX(-120%)}100%{transform:translateX(330%)}}.status{margin-top:16px;font-size:13px;color:#C7D8FF;font-weight:600;min-height:18px}.foot{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:11px;color:#7E9BE0;z-index:2;letter-spacing:.4px}</style>' +
    '</head><body><div class="orb a"></div><div class="orb b"></div><div class="orb c"></div><div class="grid"></div><div class="wrap"><div class="logo">TAMER</div><div class="sub">HC Sales Dashboard</div><div class="tag">Executive View · BD</div><div class="ring"><svg viewBox="0 0 56 56"><circle class="bg" cx="28" cy="28" r="24"/><circle class="fg" cx="28" cy="28" r="24"/></svg></div><div class="bar"><i></i></div><div class="status" id="m">Preparing your dashboard…</div></div><div class="foot">Loading securely · please wait</div>' +
    '<scr' + 'ipt>google.script.run.withSuccessHandler(function(h){document.open();document.write(h);document.close();}).withFailureHandler(function(err){document.getElementById("m").textContent="Error: "+(err&&err.message||err)+" — refresh to retry";}).fetchPage(' + JSON.stringify(p) + ',0,' + JSON.stringify(st) + ');</scr' + 'ipt></body></html>';
  return HtmlService.createHtmlOutput(shell)
    .setTitle('TAMER BD Dashboards')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
// All pages are served locally by buildPage() from the engine's Drive store.
const LOCAL_PAGES = { bd: 1, ds: 1, mms: 1, sm: 1, kiestra: 1 };

function fetchPage(p, dbg, st) {
  let html;
  if (LOCAL_PAGES[p]) {
    html = buildPage(p);
  } else {
    // retired pages (e.g. the old commercial link)
    html = '<h3 style="font-family:sans-serif;padding:30px;color:#334155">This page has been retired — please use the main dashboard link.</h3>';
  }
  let inject = '';
  if (st) {
    inject += '<scr'+'ipt>window.__ST0=' + JSON.stringify(String(st)) +
      ';try{history.replaceState(null,"",location.pathname+location.search+"#"+encodeURIComponent(window.__ST0))}catch(err){}</scr'+'ipt>';
  }
  if (inject) html = html.replace('<head>', '<head>' + inject);
  return html;
}

// Row-level NUPCO Open Tender data for the Coverage tab's Data Extraction view.
// Read lazily by the client (google.script.run) so the main page stays light.
function nupcoRows(){
  try{ var it=DriveApp.getFilesByName('TAMER-NUPCO-Rows.json');
       return it.hasNext()? it.next().getBlob().getDataAsString() : ''; }
  catch(e){ return ''; }
}
