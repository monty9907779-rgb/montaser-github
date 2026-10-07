/**
 * Daily per-division sales report emails (Waters/DS → BD, SM → Nabil).
 *
 * Sourced 100% from official Tamer reports via Engine.gs `gatherSalesRows_`
 * (TamerSC BD-Saudi private + Muhannad tender) — no n8n, no forwards from the
 * owner's own mailbox.
 *
 * Every source row is accounted for in the Data Coverage panel, and the
 * dimension sections adapt to whichever columns the official feed actually
 * carries: any column present is reported, any expected column that is absent
 * is listed explicitly rather than silently skipped.
 */

// ── config ──────────────────────────────────────────────────────────────────
var RPT_ALERT_TO = 'mohamed.montaser@tamergroup.com';

// While true, every report goes ONLY to RPT_ALERT_TO. Flip to false to go live.
var RPT_DRY_RUN = false;   // LIVE since 2026-08-03 - reports go to the real distribution lists

var RPT_ITEM_CAP = 400;   // per segment; any truncation is stated in the email

var RPT_DIVISIONS = [
  { div: 'DS',
    title: 'Waters — DS Division Sales Report',
    to: 'mahmoud.hasan@bd.com, sattam.alodailah@bd.com, ahmed.mustafa@bd.com, houssam.el.kraidli@bd.com, Hattan.Reshwan@bd.com',
    subject: 'Waters DS Report - BD Year (1 Oct) & Tamer YTD',
    senderName: 'Waters Sales Automation' },
  { div: 'SM',
    title: 'SM Division Sales Report',
    to: 'mohamed.nabil@tamergroup.com',
    subject: 'SM Sales Report - Tamer YTD & BD Year (1 Oct)',
    senderName: 'Tamer Group Sales Automation' },
  { div: 'MMS',
    title: 'MMS Division Sales Report',
    to: 'mohamed.montaser@tamergroup.com, mohamed.nabil@tamergroup.com',
    subject: 'MMS Sales Report - Tamer YTD & BD Year (1 Oct)',
    senderName: 'Tamer Group Sales Automation' },
  { div: 'ALL',
    title: 'Total Tamer - BD Sales Report (DS / MMS / SM)',
    to: 'mohamed.nabil@tamergroup.com, ahmed.hussein@tamergroup.com',
    subject: 'Total Tamer Daily Sales Report - Tamer YTD & BD Year (1 Oct)',
    senderName: 'Tamer Group Sales Automation' }
];

var RPT_SEG_ALL = { DS: ['DS_GOODS','DS_GPPRR','DS_KIES','DS_SVC','DS_TENDER'],
                    MMS:['MMS_GOODS','MMS_SVC'],
                    SM: ['SM_GOODS','SM_TENDER'] };
var RPT_SEG_L = { DS_GOODS:'Goods', DS_GPPRR:'GPPRR', DS_KIES:'Kiestra', DS_SVC:'Service', DS_TENDER:'Tender',
                  MMS_GOODS:'Goods', MMS_SVC:'Service', SM_GOODS:'Goods', SM_TENDER:'Tender' };
var RPT_SEG_C = { DS_GOODS:'#D97706', DS_GPPRR:'#7C3AED', DS_KIES:'#0891B2', DS_SVC:'#475569', DS_TENDER:'#DC2626',
                  MMS_GOODS:'#059669', MMS_SVC:'#65A30D', SM_GOODS:'#2563EB', SM_TENDER:'#DB2777' };

// dimension sections; rendered only when the source actually carries the column
var RPT_DIMS = [
  { title:'Branch Performance', unit:'branches',     color:'#0284C7', cols:['Branch Name'] },
  { title:'Customer Type',      unit:'types',        color:'#7C3AED', cols:['Customer Type'] },
  { title:'Customer Nature',    unit:'natures',      color:'#059669', cols:['Customer Nature','Customer Sub Nature'] },
  { title:'Category',           unit:'categories',   color:'#DB2777', cols:['Category','Sub Category'] },
  { title:'Vendor / Site',      unit:'vendor sites', color:'#D97706', cols:['Vendor','Vendor Site'] },
  { title:'Recognition Status', unit:'statuses',     color:'#475569', cols:['Recognition Status'] }
];

var RPT_ML = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── small helpers ───────────────────────────────────────────────────────────
function rptEsc_(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function rptFmt_(n){ n=Number(n||0);
  return (Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function rptFmtK_(n){ n=Number(n||0); var a=Math.abs(n);
  if(a>=1e6) return (n/1e6).toFixed(1)+'M'; if(a>=1e3) return (n/1e3).toFixed(0)+'K'; return rptFmt_(n); }
function rptNum_(v){ var n=parseFloat(String(v==null?'':v).replace(/,/g,'').trim()); return isNaN(n)?0:n; }
function rptPick_(r, names){ for(var i=0;i<names.length;i++){ if(r[names[i]]!=null && String(r[names[i]]).trim()!=='')
  return String(r[names[i]]).trim(); } return ''; }
function rptHas_(rows, col){ for(var i=0;i<rows.length;i++){ if(col in rows[i]) return true; } return false; }

// ── the report builder ──────────────────────────────────────────────────────
function buildDivisionReport_(rows, cfg, now){
  var DIV = cfg.div, TITLE = cfg.title;
  var curY=now.getFullYear(), curM=now.getMonth(), curD=now.getDate();
  var bdStartYear = curM>=9 ? curY : curY-1;

  /*CALYTD*/ var SEQ=[]; if(bdStartYear<curY){ for(var m=9;m<12;m++) SEQ.push({y:bdStartYear,m:m}); }
  /*CALYTD*/ for(var m2=0;m2<=curM;m2++) SEQ.push({y:curY,m:m2});
  var seqIdx={}; for(var i=0;i<SEQ.length;i++) seqIdx[SEQ[i].y+'-'+SEQ[i].m]=i;
  function isTamer(i){ return SEQ[i].y===curY; }

  var SEG_ALL = (DIV==='ALL')
    ? RPT_SEG_ALL.DS.concat(RPT_SEG_ALL.MMS, RPT_SEG_ALL.SM)
    : RPT_SEG_ALL[DIV];
  // in the all-divisions report the bare line names collide (three "Goods"),
  // so prefix them with the division there and only there.
  function SEGL(s2){ return (DIV==='ALL' ? s2.split('_')[0]+' ' : '') + RPT_SEG_L[s2]; }

  // which optional columns does the official feed actually carry?
  var present = {}, missing = [];
  RPT_DIMS.forEach(function(d){
    var ok = d.cols.filter(function(c){ return rptHas_(rows, c); });
    present[d.title] = ok;
    if(!ok.length) missing.push(d.title + ' (' + d.cols.join(' / ') + ')');
  });
  var hasQty  = rptHas_(rows,'Current Sales Goods');
  var hasInv  = rptHas_(rows,'Invoice #');
  var itemCols = ['Item Description','Item Desc','Item Name','Item No'].filter(function(c){ return rptHas_(rows,c); });

  // ── ingest ────────────────────────────────────────────────────────────────
  var D = { total: rows.length, noDate:0, outWindow:0, outWindowVal:0, future:0,
            otherDiv:0, zero:0, used:0 };
  var scoped=[];
  for(var r0=0;r0<rows.length;r0++){
    var r = rows[r0];
    var d = parseDate_(r['Invoice Date']);
    if(!d){ D.noDate++; continue; }
    var seg = classifySeg_(r);
    if(!SEG_META[seg] || (DIV!=='ALL' && SEG_META[seg][0]!==DIV)){ D.otherDiv++; continue; }
    // DUAL-YEAR semantics, same rule as Engine.gs buildAggregates_: a CUMULATIVE
    // report (_cum) puts prior-year figures in the LY column with Current = 0, so
    // the column must be picked by invoice year. Month-to-date snapshots always
    // use Current. Without this the BD-year months (Oct-Dec) read as zero for
    // every cumulative feed (MMS/2039 and tender).
    var priorCum = (r._cum && d.year !== curY);
    var val = priorCum ? rptNum_(r['LY. Sales Value (SAR)'])
                       : rptNum_(r['Current Sales Value (SAR)']);
    var mi = seqIdx[d.year+'-'+d.month];
    if(mi===undefined){ D.outWindow++; D.outWindowVal+=val; continue; }
    if(d.year===curY && d.month===curM && d.day>curD){ D.future++; continue; }
    var qty = priorCum ? (rptNum_(r['LY. Sales Goods']) || rptNum_(r['Current Sales Goods']))
                       : rptNum_(r['Current Sales Goods']);
    if(val===0 && qty===0){ D.zero++; continue; }
    if(val===0) D.zero++;                       // disclosed, but kept
    D.used++;
    scoped.push({ seg:seg, mi:mi, v:val, q:qty, row:r,
      acct: rptPick_(r,['Customer Name','Customer']) || 'N/A',
      acctNo: rptPick_(r,['Customer #','Customer No']),
      item: rptPick_(r, itemCols.length?itemCols:['Item Description']),
      vcat: rptPick_(r,['Vndr Catalog']) });
  }

  // ── fail loud ─────────────────────────────────────────────────────────────
  var FAIL='';
  if(!rows.length) FAIL='No rows fetched from the official reports at all (Gmail returned nothing).';
  else if(!D.used) FAIL='No usable '+DIV+' rows ('+D.total+' fetched: '+D.noDate+' bad date, '
      +D.otherDiv+' other division, '+D.outWindow+' outside window, '+D.zero+' zero-value).';

  // ── aggregate ─────────────────────────────────────────────────────────────
  var M={}, Q={}, AD={}, ITEMS={};
  SEG_ALL.forEach(function(s){ M[s]=SEQ.map(function(){return 0;}); Q[s]=SEQ.map(function(){return 0;});
    AD[s]={}; ITEMS[s]={}; });
  var acctSet={}, invSet={}, nAcct=0, nInv=0;
  var DIMDATA={}; RPT_DIMS.forEach(function(d){ if(present[d.title].length) DIMDATA[d.title]={}; });

  function bump(o,k,v,q){ if(!o[k]) o[k]={v:0,q:0,n:0}; o[k].v+=v; o[k].q+=q; o[k].n++; }

  scoped.forEach(function(x){
    if(!M[x.seg]) return;
    M[x.seg][x.mi]+=x.v; Q[x.seg][x.mi]+=x.q;
    if(!acctSet[x.acct]){ acctSet[x.acct]=1; nAcct++; }
    var inv = rptPick_(x.row,['Invoice #']); if(inv && !invSet[inv]){ invSet[inv]=1; nInv++; }

    var ak = x.acct + (x.acctNo ? ' • ' + x.acctNo : '');
    if(!AD[x.seg][ak]) AD[x.seg][ak]={t:0,q:0,m:SEQ.map(function(){return 0;})};
    AD[x.seg][ak].t+=x.v; AD[x.seg][ak].q+=x.q; AD[x.seg][ak].m[x.mi]+=x.v;

    var ik = (x.vcat||'-') + '␟' + (x.item||'-');
    if(!ITEMS[x.seg][ik]) ITEMS[x.seg][ik]={v:0,q:0,n:0,
      cat: rptPick_(x.row,['Category']), sub: rptPick_(x.row,['Sub Category'])};
    ITEMS[x.seg][ik].v+=x.v; ITEMS[x.seg][ik].q+=x.q; ITEMS[x.seg][ik].n++;

    RPT_DIMS.forEach(function(dd){
      var cols = present[dd.title]; if(!cols.length) return;
      var parts = cols.map(function(c){ return String(x.row[c]==null?'':x.row[c]).trim(); })
                      .filter(function(t){ return t!==''; });
      bump(DIMDATA[dd.title], parts.length?parts.join(' / '):'N/A', x.v, x.q);
    });
  });

  var segBD={}, segTam={}, qBD={}, G_BD=0, G_TAM=0, GQ=0;
  SEG_ALL.forEach(function(s){
    segBD[s]=0; segTam[s]=0; qBD[s]=0;
    for(var i=0;i<SEQ.length;i++){ segBD[s]+=M[s][i]; qBD[s]+=Q[s][i]; if(isTamer(i)) segTam[s]+=M[s][i]; }
    G_BD+=segBD[s]; G_TAM+=segTam[s]; GQ+=qBD[s];
  });
  var mTotal = SEQ.map(function(_,i){ var t=0; SEG_ALL.forEach(function(s){ t+=M[s][i]; }); return t; });
  function mLabel(i){ return RPT_ML[SEQ[i].m]+' '+SEQ[i].y + ((SEQ[i].m===curM&&SEQ[i].y===curY)?'*':''); }

  // ── HTML ──────────────────────────────────────────────────────────────────
  var CARD_O=function(a){ return '<tr><td style="padding:0 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)'+(a?';border-left:4px solid '+a:'')+'">'; };
  var CARD_C='</table></td></tr><tr><td style="height:18px"></td></tr>';
  var HEAD=function(t,sub,col){ return '<tr><td style="padding:18px 20px 4px"><div style="font-size:15px;font-weight:800;color:'+(col||'#1E293B')+'">'+t+'</div><div style="font-size:11px;color:#94A3B8;margin-top:2px">'+sub+'</div></td></tr>'; };
  var TH=function(t,al,col){ return '<th style="padding:7px 8px;text-align:'+(al||'left')+';font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:'+(col||'#64748B')+';border-bottom:2px solid #E2E8F0">'+t+'</th>'; };
  var TD=function(t,al,ex){ return '<td style="padding:6px 8px;border-bottom:1px solid #F1F5F9;text-align:'+(al||'left')+';font-size:11px;color:#1E293B;'+(ex||'')+'">'+t+'</td>'; };

  var today = Utilities.formatDate(now, 'Asia/Riyadh', 'EEEE, d MMMM yyyy');
  var subjDate = Utilities.formatDate(new Date(now.getTime()-86400000), 'Asia/Riyadh', 'dd MMM yyyy');

  var h = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'
    + '<title>'+TITLE+'</title><style>'
    + '@media only screen and (max-width:620px){.wrapper{width:100% !important}.kpi-cell{display:block !important;width:100% !important;padding:6px 0 !important}'
    + '.responsive-table{font-size:10px !important}.responsive-table td,.responsive-table th{padding:4px 5px !important}.hide-mobile{display:none !important}}'
    + '</style></head>'
    + '<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;color:#1E293B">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8FAFC"><tr><td align="center" style="padding:0">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="wrapper" style="max-width:900px;width:100%;margin:0 auto">';

  h += '<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E40AF 100%);padding:30px 30px 26px;border-radius:0 0 16px 16px">'
    + '<div style="font-size:24px;font-weight:800;color:#FFFFFF;line-height:1.2">Tamer Group</div>'
    + '<div style="font-size:14px;font-weight:600;margin-top:4px;color:#93C5FD">'+TITLE+'</div>'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px"><tr>'
    + '<td style="padding:8px 14px;background:rgba(255,255,255,0.12);border-radius:8px"><span style="font-size:11px;color:#BFDBFE">Tamer year&nbsp;</span><span style="font-size:12px;font-weight:700;color:#FFFFFF">1 Jan '+curY+' &ndash; '+curD+' '+RPT_ML[curM]+' '+curY+'</span></td>'
    + '<td style="width:8px"></td>'
    + '<td style="padding:8px 14px;background:rgba(255,255,255,0.12);border-radius:8px"><span style="font-size:11px;color:#FDE68A">BD year&nbsp;</span><span style="font-size:12px;font-weight:700;color:#FFFFFF">1 Oct '+bdStartYear+' &ndash; '+curD+' '+RPT_ML[curM]+' '+curY+'</span></td>'
    + '</tr></table>'
    + '<div style="margin-top:8px;font-size:11px;color:#93C5FD">'+today+' &bull; all values SAR &bull; source: TamerSC BD-Saudi Private Sales + 2039 (MMS) + Tender sales &mdash; same feeds as the dashboards</div>'
    + '</td></tr><tr><td style="height:20px"></td></tr>';

  if(FAIL){
    h += '<tr><td style="padding:0 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#7F1D1D;border-radius:12px"><tr><td style="padding:22px 24px">'
      + '<div style="font-size:18px;font-weight:800;color:#FFFFFF">🔴 REPORT NOT SENT TO RECIPIENTS</div>'
      + '<div style="font-size:13px;color:#FECACA;margin-top:10px;line-height:1.6">'+rptEsc_(FAIL)+'</div>'
      + '<div style="font-size:11px;color:#FCA5A5;margin-top:12px">Fetched: '+D.total+' &bull; bad date: '+D.noDate+' &bull; other division: '+D.otherDiv+' &bull; outside window: '+D.outWindow+' &bull; zero value: '+D.zero+' &bull; used: '+D.used+'</div>'
      + '<div style="font-size:11px;color:#FCA5A5;margin-top:8px">The distribution list was suppressed for this run so nobody receives a zero-filled report.</div>'
      + '</td></tr></table></td></tr><tr><td style="height:18px"></td></tr></table></td></tr></table></body></html>';
    return { html:h, ok:false, to:RPT_ALERT_TO,
             subject:'🔴 ALERT '+subjDate+' | '+TITLE+' — NOT SENT ('+FAIL.slice(0,90)+')',
             senderName:cfg.senderName, stats:D };
  }

  if(RPT_DRY_RUN){
    h += '<tr><td style="padding:0 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#78350F;border-radius:12px"><tr><td style="padding:16px 22px">'
      + '<div style="font-size:14px;font-weight:800;color:#FDE68A">PREVIEW RUN &mdash; not delivered to the distribution list</div>'
      + '<div style="font-size:11px;color:#FCD34D;margin-top:6px">This copy went to '+RPT_ALERT_TO+' only. Real recipients ('+rptEsc_(cfg.to)+') received nothing. Set RPT_DRY_RUN = false in Report.gs to go live.</div>'
      + '</td></tr></table></td></tr><tr><td style="height:18px"></td></tr>';
  }

  // data coverage
  var cov = [
    ['Rows fetched from the official reports', D.total, '#1E293B'],
    ['Rows included in this report', D.used, '#059669'],
    [(DIV==='ALL' ? 'Unclassified rows (no division)' : 'Other divisions (not '+DIV+')'), D.otherDiv, '#94A3B8'],
    ['Dated before 1 Oct '+bdStartYear+' — outside the report window', D.outWindow, D.outWindow?'#D97706':'#94A3B8'],
    ['Unreadable invoice date', D.noDate, D.noDate?'#DC2626':'#94A3B8'],
    ['Future-dated in current month', D.future, D.future?'#D97706':'#94A3B8'],
    ['Zero-value lines', D.zero, '#94A3B8']
  ];
  h += CARD_O('#059669') + HEAD('Data Coverage','every fetched row is accounted for — nothing is dropped silently','#059669')
    + '<tr><td style="padding:6px 12px 16px"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">';
  cov.forEach(function(c){ h += '<tr>'+TD(c[0])+'<td style="padding:6px 8px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:12px;font-weight:700;color:'+c[2]+'">'+rptFmt_(c[1])+'</td></tr>'; });
  if(D.outWindow) h += '<tr>'+TD('<i>Value of the out-of-window rows (not counted in any total below)</i>')+TD('<b>'+rptFmt_(D.outWindowVal)+'</b> SAR','right','color:#D97706')+'</tr>';
  if(missing.length) h += '<tr>'+TD('<i>Sections not shown — the official feed does not carry these columns</i>')+TD(rptEsc_(missing.join('; ')),'right','color:#94A3B8;font-size:10px')+'</tr>';
  h += '</table></td></tr>' + CARD_C;

  // KPIs
  var kpis = [
    { l:'TAMER YEAR YTD (JAN '+curY+')', v:rptFmtK_(G_TAM), s:'SAR', c:'#2563EB' },
    { l:'BD YEAR YTD (OCT '+bdStartYear+')', v:rptFmtK_(G_BD), s:'SAR', c:'#D97706' },
    { l:'ACTIVE ACCOUNTS', v:rptFmt_(nAcct), s:'customers', c:'#059669' }
  ];
  if(hasInv) kpis.push({ l:'INVOICES', v:rptFmt_(nInv), s:'documents', c:'#7C3AED' });
  if(hasQty) kpis.push({ l:'QUANTITY', v:rptFmtK_(GQ), s:'units (BD year)', c:'#0891B2' });
  h += '<tr><td style="padding:0 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>';
  kpis.forEach(function(k){
    h += '<td class="kpi-cell" width="'+Math.floor(100/kpis.length)+'%" style="padding:0 4px;vertical-align:top"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">'
      + '<tr><td style="height:4px;background:'+k.c+'"></td></tr>'
      + '<tr><td style="padding:14px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;margin-bottom:7px">'+k.l+'</div><div style="font-size:21px;font-weight:800;color:'+k.c+';line-height:1">'+k.v+'</div><div style="font-size:10px;color:#94A3B8;margin-top:4px">'+k.s+'</div></td></tr></table></td>';
  });
  h += '</tr></table></td></tr><tr><td style="height:20px"></td></tr>';

  // year totals by line
  h += CARD_O() + HEAD('Year Totals by Line','Tamer year (1 Jan '+curY+') and BD year (1 Oct '+bdStartYear+') reported separately (SAR)')
    + '<tr><td style="padding:8px 16px 20px"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'
    + '<tr style="background:#F8FAFC">'+TH('Line')+TH('Tamer Year (Jan '+curY+')','right','#2563EB')+TH('BD Year (Oct '+bdStartYear+')','right','#D97706')+TH('BD-Year Share','right')+(hasQty?TH('Qty (BD Year)','right'):'')+'</tr>';
  SEG_ALL.forEach(function(s){
    if(!segBD[s] && !segTam[s] && !qBD[s]) return;
    var share = G_BD>0 ? (segBD[s]/G_BD*100).toFixed(1) : '0.0';
    h += '<tr>'+TD(SEGL(s),'left','font-weight:600;color:'+RPT_SEG_C[s]+';font-size:12px')
      + TD('<b>'+rptFmt_(segTam[s])+'</b>','right')+TD('<b>'+rptFmt_(segBD[s])+'</b>','right')
      + TD(share+'%','right','color:#64748B') + (hasQty?TD(qBD[s]?rptFmt_(qBD[s]):'-','right'):'') + '</tr>';
  });
  h += '<tr style="background:#0F172A"><td style="padding:9px 10px;font-size:12px;font-weight:800;color:#FFFFFF">TOTAL</td>'
    + '<td style="padding:9px 10px;text-align:right;font-size:12px;font-weight:800;color:#93C5FD">'+rptFmt_(G_TAM)+'</td>'
    + '<td style="padding:9px 10px;text-align:right;font-size:12px;font-weight:800;color:#FDE68A">'+rptFmt_(G_BD)+'</td>'
    + '<td style="padding:9px 10px;text-align:right;font-size:10px;color:#94A3B8">100%</td>'
    + (hasQty?'<td style="padding:9px 10px;text-align:right;font-size:11px;font-weight:700;color:#FFFFFF">'+rptFmt_(GQ)+'</td>':'')
    + '</tr></table></td></tr>' + CARD_C;

  // monthly x line
  h += CARD_O() + HEAD('Monthly Sales by Line','<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#FEF3C7;border:1px solid #F59E0B;vertical-align:middle"></span> Oct&ndash;Dec '+bdStartYear+' count in the BD year only &bull; Tamer year starts 1 Jan '+curY)
    + '<tr><td style="padding:8px 12px 20px"><div style="overflow-x:auto"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'
    + '<tr style="background:#F8FAFC">'+TH('Month');
  SEG_ALL.forEach(function(s){ h += TH(SEGL(s),'right',RPT_SEG_C[s]); });
  h += '<th style="padding:8px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;color:#1E293B;border-bottom:2px solid #E2E8F0;border-left:2px solid #E2E8F0">Total</th></tr>';
  for(var mi2=0; mi2<SEQ.length; mi2++){
    var bdOnly = !isTamer(mi2), partial = (SEQ[mi2].m===curM && SEQ[mi2].y===curY);
    h += '<tr style="background:'+(bdOnly?'#FFFBEB':(partial?'#FEFCE8':'#FFFFFF'))+'"><td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;font-size:11px;font-weight:600;color:#1E293B">'+mLabel(mi2)
      + (bdOnly?' <span style="font-size:8px;color:#B45309;font-weight:700">BD YR</span>':'')
      + (partial?' <span style="font-size:8px;color:#D97706;font-weight:700">PARTIAL</span>':'')+'</td>';
    for(var si=0; si<SEG_ALL.length; si++){ var sv=M[SEG_ALL[si]][mi2];
      h += '<td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:11px;color:'+(sv?'#1E293B':'#CBD5E1')+'">'+(sv?rptFmt_(sv):'-')+'</td>'; }
    h += '<td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:11px;font-weight:700;color:#1E293B;border-left:2px solid #F1F5F9">'+rptFmt_(mTotal[mi2])+'</td></tr>';
  }
  h += '<tr style="background:#1E3A8A"><td style="padding:8px;font-size:10px;font-weight:800;color:#93C5FD">TAMER YEAR TOTAL (JAN '+curY+')</td>';
  SEG_ALL.forEach(function(s){ h += '<td style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:#FFFFFF">'+rptFmt_(segTam[s])+'</td>'; });
  h += '<td style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:#FFFFFF;border-left:2px solid #334155">'+rptFmt_(G_TAM)+'</td></tr>'
    + '<tr style="background:#0F172A"><td style="padding:8px;font-size:10px;font-weight:800;color:#FDE68A">BD YEAR TOTAL (OCT '+bdStartYear+')</td>';
  SEG_ALL.forEach(function(s){ h += '<td style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:#FFFFFF">'+rptFmt_(segBD[s])+'</td>'; });
  h += '<td style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:#FFFFFF;border-left:2px solid #334155">'+rptFmt_(G_BD)+'</td></tr>'
    + '</table></div></td></tr>' + CARD_C;

  // account performance — every segment
  // cfg._slim is set only when the full report blew Gmail's body-size limit and
  // the complete version travels as an attachment instead.
  if(cfg._slim){
    h += CARD_O('#B45309')
      + '<tr><td style="padding:14px 16px;font-size:12px;color:#92400E;background:#FFFBEB">'
      + '<b>Detail tables are attached, not inline.</b><br>This report is too large for an email body, '
      + 'so the per-segment <i>Account Performance</i> and <i>Product Detail</i> tables are in the attached '
      + 'HTML file &mdash; open it in any browser. Nothing has been dropped.'
      + '</td></tr>' + CARD_C;
  }
  if(!cfg._slim) SEG_ALL.forEach(function(s){
    var arr=[]; for(var k in AD[s]){ if(AD[s][k].t!==0 || AD[s][k].q!==0) arr.push([k, AD[s][k]]); }
    if(!arr.length) return;
    arr.sort(function(a,b){ return b[1].t-a[1].t; });
    h += CARD_O(RPT_SEG_C[s]) + HEAD(SEGL(s)+' &mdash; Account Performance', arr.length+' accounts &bull; BD year (1 Oct '+bdStartYear+' &ndash; today) &bull; SAR', RPT_SEG_C[s])
      + '<tr><td style="padding:6px 12px 16px"><div style="overflow-x:auto"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'
      + '<tr style="background:#F8FAFC">'+TH('Account')+TH('Total','right','#1E293B')+(hasQty?TH('Qty','right'):'');
    for(var i2=0;i2<SEQ.length;i2++) h += '<th style="padding:7px 6px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;color:'+(isTamer(i2)?'#64748B':'#B45309')+';border-bottom:2px solid #E2E8F0" class="hide-mobile">'+RPT_ML[SEQ[i2].m]+'</th>';
    h += '</tr>';
    var top = arr[0][1].t || 1;
    arr.forEach(function(e){
      var a=e[0], v=e[1];
      h += '<tr>'+TD('<div style="font-weight:600">'+rptEsc_(a)+'</div><div style="margin-top:3px;height:3px;border-radius:2px;background:#F1F5F9;overflow:hidden"><div style="height:100%;width:'+Math.max(2,Math.round(v.t/top*100))+'%;background:'+RPT_SEG_C[s]+';border-radius:2px"></div></div>')
        + TD('<b>'+rptFmt_(v.t)+'</b>','right') + (hasQty?TD(v.q?rptFmt_(v.q):'-','right'):'');
      for(var i3=0;i3<SEQ.length;i3++) h += '<td style="padding:6px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:10px;color:'+(v.m[i3]?'#1E293B':'#CBD5E1')+'" class="hide-mobile">'+(v.m[i3]?rptFmtK_(v.m[i3]):'-')+'</td>';
      h += '</tr>';
    });
    h += '<tr style="background:#0F172A"><td style="padding:8px;font-size:11px;font-weight:800;color:#FFF">TOTAL</td><td style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:#FFF">'+rptFmt_(segBD[s])+'</td>'
      + (hasQty?'<td style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:#E2E8F0">'+rptFmt_(qBD[s])+'</td>':'');
    for(var i4=0;i4<SEQ.length;i4++) h += '<td style="padding:8px 6px;text-align:right;font-size:10px;font-weight:700;color:#E2E8F0" class="hide-mobile">'+rptFmtK_(M[s][i4])+'</td>';
    h += '</tr></table></div></td></tr>' + CARD_C;
  });

  // product detail — every segment
  if(!cfg._slim) SEG_ALL.forEach(function(s){
    var arr=[]; for(var k in ITEMS[s]){ if(ITEMS[s][k].v!==0 || ITEMS[s][k].q!==0) arr.push([k, ITEMS[s][k]]); }
    if(!arr.length) return;
    arr.sort(function(a,b){ return b[1].v-a[1].v; });
    var shown = arr.slice(0, RPT_ITEM_CAP), hiddenV=0, hiddenN=0;
    arr.slice(RPT_ITEM_CAP).forEach(function(e){ hiddenV+=e[1].v; hiddenN++; });
    var sub = arr.length+' items &bull; BD year &bull; SAR';
    if(hiddenN) sub += ' &bull; <span style="color:#DC2626;font-weight:700">showing top '+RPT_ITEM_CAP+' of '+arr.length+' — the remaining '+hiddenN+' items total '+rptFmt_(hiddenV)+' SAR</span>';
    h += CARD_O(RPT_SEG_C[s]) + HEAD(SEGL(s)+' &mdash; Product Detail', sub, RPT_SEG_C[s])
      + '<tr><td style="padding:6px 12px 16px"><div style="overflow-x:auto"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'
      + '<tr style="background:#F8FAFC">'+TH('Vndr Catalog')+TH('Item Description')+TH('Category')+(hasQty?TH('Qty','right'):'')+TH('Value','right','#1E293B')+TH('Lines','right')+'</tr>';
    shown.forEach(function(e){
      var p = e[0].split('␟'), v=e[1];
      h += '<tr>'+TD('<span style="font-family:monospace;font-size:10px">'+rptEsc_(p[0])+'</span>')
        + TD(rptEsc_(p[1])) + TD(rptEsc_(v.cat + (v.sub?' / '+v.sub:'')),'left','color:#64748B;font-size:10px')
        + (hasQty?TD(v.q?rptFmt_(v.q):'-','right'):'') + TD('<b>'+rptFmt_(v.v)+'</b>','right') + TD(rptFmt_(v.n),'right','color:#64748B') + '</tr>';
    });
    h += '<tr style="background:#0F172A"><td colspan="3" style="padding:8px;font-size:11px;font-weight:800;color:#FFF">TOTAL (all '+arr.length+' items)</td>'
      + (hasQty?'<td style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:#E2E8F0">'+rptFmt_(qBD[s])+'</td>':'')
      + '<td style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:#FFF">'+rptFmt_(segBD[s])+'</td><td></td></tr>'
      + '</table></div></td></tr>' + CARD_C;
  });

  // adaptive dimension cards
  RPT_DIMS.forEach(function(dd){
    if(!present[dd.title].length) return;
    var obj = DIMDATA[dd.title], arr=[];
    for(var k in obj) arr.push([k, obj[k]]);
    if(!arr.length) return;
    arr.sort(function(a,b){ return b[1].v-a[1].v; });
    var top = arr[0][1].v || 1, tv=0, tq=0, tn=0;
    arr.forEach(function(e){ tv+=e[1].v; tq+=e[1].q; tn+=e[1].n; });
    h += CARD_O(dd.color) + HEAD(dd.title, arr.length+' '+dd.unit+' &bull; BD year &bull; from '+rptEsc_(present[dd.title].join(' / ')), dd.color)
      + '<tr><td style="padding:6px 12px 16px"><div style="overflow-x:auto"><table role="presentation" class="responsive-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'
      + '<tr style="background:#F8FAFC">'+TH('Name')+TH('Value','right','#1E293B')+TH('Share','right')+(hasQty?TH('Qty','right'):'')+TH('Lines','right')+'</tr>';
    arr.forEach(function(e){
      var pct = G_BD>0 ? (e[1].v/G_BD*100) : 0;
      h += '<tr>'+TD('<div style="font-weight:600">'+rptEsc_(e[0])+'</div><div style="margin-top:3px;height:3px;border-radius:2px;background:#F1F5F9;overflow:hidden"><div style="height:100%;width:'+Math.max(2,Math.round(e[1].v/top*100))+'%;background:'+dd.color+';border-radius:2px"></div></div>')
        + TD('<b>'+rptFmt_(e[1].v)+'</b>','right') + TD(pct.toFixed(1)+'%','right','color:#64748B')
        + (hasQty?TD(e[1].q?rptFmt_(e[1].q):'-','right'):'') + TD(rptFmt_(e[1].n),'right','color:#64748B') + '</tr>';
    });
    h += '<tr style="background:#0F172A"><td style="padding:8px;font-size:11px;font-weight:800;color:#FFF">TOTAL</td><td style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:#FFF">'+rptFmt_(tv)+'</td><td style="padding:8px;text-align:right;font-size:10px;color:#94A3B8">100%</td>'
      + (hasQty?'<td style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:#E2E8F0">'+rptFmt_(tq)+'</td>':'')
      + '<td style="padding:8px;text-align:right;font-size:10px;color:#94A3B8">'+rptFmt_(tn)+'</td></tr>'
      + '</table></div></td></tr>' + CARD_C;
  });

  // footer
  h += '<tr><td style="padding:0 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0F172A;border-radius:12px;overflow:hidden"><tr><td style="padding:18px 24px;text-align:center">'
    + '<div style="font-size:13px;font-weight:700;color:#FFFFFF">Tamer Group &mdash; '+TITLE+'</div>'
    + '<div style="font-size:11px;color:#94A3B8;margin-top:6px"><span style="color:#93C5FD;font-weight:700">Tamer year</span>: 1 Jan '+curY+' &ndash; today ('+rptFmt_(G_TAM)+' SAR) &nbsp;&bull;&nbsp; <span style="color:#FDE68A;font-weight:700">BD year</span>: 1 Oct '+bdStartYear+' &ndash; today ('+rptFmt_(G_BD)+' SAR)</div>'
    + '<div style="font-size:10px;color:#64748B;margin-top:8px">* Current month is partial (up to '+curD+' '+RPT_ML[curM]+'). '+rptFmt_(D.used)+' of '+rptFmt_(D.total)+' fetched rows are included &mdash; see Data Coverage above.</div>'
    + '</td></tr></table></td></tr><tr><td style="height:16px"></td></tr>'
    + '</table></td></tr></table></body></html>';

  return { html:h, ok:true,
           to: RPT_DRY_RUN ? RPT_ALERT_TO : cfg.to,
           subject: (RPT_DRY_RUN?'[PREVIEW] ':'') + subjDate + ' | ' + cfg.subject,
           senderName: cfg.senderName, stats: D,
           totals: { tamer:G_TAM, bd:G_BD, accounts:nAcct, invoices:nInv, qty:GQ } };
}

// ── entry points ────────────────────────────────────────────────────────────

/** Daily trigger: build and send every configured division report. */
function sendDailyReports(){
  ensureReportTrigger_();          // self-healing: the daily 07:00 trigger always exists
  var now = new Date();
  var rows = gatherSalesRows_(now);
  RPT_DIVISIONS.forEach(function(cfg){
    var out = buildDivisionReport_(rows, cfg, now);
    var how = 'inline';
    try {
      MailApp.sendEmail({ to: out.to, subject: out.subject, htmlBody: out.html, name: out.senderName });
    } catch(err) {
      // Gmail refuses bodies past its size limit ("Limit Exceeded: Email Body Size").
      // Send the summary inline and carry the complete report as an attachment
      // rather than silently truncating the division's data.
      if(!/body size/i.test(String(err && err.message))) throw err;
      var slimCfg = {}; for(var k in cfg) slimCfg[k]=cfg[k]; slimCfg._slim = true;
      var slim = buildDivisionReport_(rows, slimCfg, now);
      MailApp.sendEmail({ to: out.to, subject: out.subject, htmlBody: slim.html, name: out.senderName,
        attachments: [ Utilities.newBlob(out.html, 'text/html',
                       'TAMER-'+cfg.div+'-full-report-'+Utilities.formatDate(now,'Asia/Riyadh','yyyy-MM-dd')+'.html') ] });
      how = 'slim+attachment ('+slim.html.length+' inline)';
    }
    Logger.log(cfg.div+': ok='+out.ok+' to='+out.to+' bytes='+out.html.length+' sent='+how
      +' tamer='+(out.totals?out.totals.tamer:'-')+' bd='+(out.totals?out.totals.bd:'-')
      +' used='+out.stats.used+'/'+out.stats.total);
  });
}

/** Verification helper: write both reports to Drive instead of emailing them. */
function previewReportsToDrive(){
  var now = new Date();
  var rows = gatherSalesRows_(now);
  var log = [];
  if(rows.length){
    var cols = {}; rows.forEach(function(r){ for(var k in r) cols[k]=1; });
    log.push('COLUMNS: ' + Object.keys(cols).sort().join(' | '));
  }
  RPT_DIVISIONS.forEach(function(cfg){
    var out = buildDivisionReport_(rows, cfg, now);
    var name = 'report-preview-' + cfg.div + '.html';
    var it = DriveApp.getFilesByName(name); while(it.hasNext()) it.next().setTrashed(true);
    DriveApp.createFile(name, out.html, 'text/html');
    log.push(cfg.div+': ok='+out.ok+' bytes='+out.html.length+' used='+out.stats.used+'/'+out.stats.total
      +' tamer='+(out.totals?out.totals.tamer:'-')+' bd='+(out.totals?out.totals.bd:'-')
      +' accounts='+(out.totals?out.totals.accounts:'-'));
  });
  var txt = log.join('\n');
  var it2 = DriveApp.getFilesByName('report-preview-log.txt'); while(it2.hasNext()) it2.next().setTrashed(true);
  DriveApp.createFile('report-preview-log.txt', txt, 'text/plain');
  Logger.log(txt);
  return txt;
}

/**
 * Idempotent: make sure exactly one daily 07:00 (Asia/Riyadh) trigger exists.
 * Called from sendDailyReports so the schedule cannot silently go missing.
 */
function ensureReportTrigger_(){
  var found = ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction() === 'sendDailyReports'; });
  if(found.length === 1){ Logger.log('trigger: ok (1 daily trigger)'); return; }
  found.forEach(function(t){ ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendDailyReports').timeBased().atHour(7).everyDays(1).create();
  Logger.log('trigger: installed daily 07:00 Asia/Riyadh (was ' + found.length + ')');
}

function installReportTrigger(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='sendDailyReports') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendDailyReports').timeBased().atHour(7).everyDays(1).create();
}
