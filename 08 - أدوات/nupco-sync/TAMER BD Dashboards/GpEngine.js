/*** GP Analysis engine — reads the monthly P&L workbook DIRECTLY as the web-app
 *   identity (mohamed.montaser@tamergroup.com, which now has Viewer access to the
 *   sheet), parses it (faithful port of the source getSheetData → identical
 *   numbers), and caches it in Drive so the GP tab renders locally.
 *   No service account, no key, no Script Properties. gpData() self-refreshes on
 *   view when the cache is missing or stale, so no time trigger is needed either.
 *   Uses only SpreadsheetApp + DriveApp — both already consented scopes.  ***/
var GP_SHEET_ID  = '1TgsX-B9zYcq-Xpr-IL_OSUdeGGF5v4Pm';   // source workbook (shared to montaser, Viewer)
var GP_STORE     = 'TAMER-GP-Data.json';                  // Drive cache the dashboard reads
var GP_MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var GP_MAX_AGE_H = 8;                                      // refresh on view if the cache is older than this

var GP_LINES = [
  { key:'dsgoods',       cat:'DS Goods',              manager:'Montaser' },
  { key:'dsservice',     cat:'DS Services',           manager:'Montaser' },
  { key:'smgoods',       cat:'SM Goods',              manager:'Nabil'    },
  { key:'dsgpprr',       cat:'GPPRR',                 manager:'Montaser' },
  { key:'dskiestra',     cat:'Kiestra',               manager:'Montaser' },
  { key:'mmsgoodsryd',   cat:'MMS Goods - Riyadh',    manager:'Nabil'    },
  { key:'mmsserviceryd', cat:'MMS Services - Riyadh', manager:'Nabil'    },
  { key:'mmsgoodsjed',   cat:'MMS Goods - Jeddah',    manager:'Montaser' },
  { key:'mmsservicejed', cat:'MMS Services - Jeddah', manager:'Montaser' },
  { key:'extraprovision',cat:'Extra Provision',       manager:'Shared'   }
];

// ---- faithful port of the source getSheetData, operating on a 2-D values array ----
function gpParseData_(data){
  if (!data || !data.length) return [];
  var labelColIdx = 0, headerRowIdx = -1;
  for (var r = 0; r < Math.min(20, data.length); r++) {
    var rowText = (data[r]||[]).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rowText.indexOf('kiestra') !== -1 || rowText.indexOf('dsgoods') !== -1 || rowText.indexOf('smgoods') !== -1 || rowText.indexOf('gpprr') !== -1 || rowText.indexOf('mmsgoods') !== -1) { headerRowIdx = r; break; }
  }
  if (headerRowIdx === -1) headerRowIdx = 0;
  var headers = data[headerRowIdx] || [], colMap = {};
  for (var c = labelColIdx + 1; c < headers.length; c++) {
    var h = headers[c] ? headers[c].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    if (h) colMap[h] = c;
  }
  function parseNum(val) {
    if (val === undefined || val === null || val === '') return 0;
    var str = val.toString().trim();
    var isNeg = str.indexOf('(') !== -1 || str.indexOf('-') !== -1;
    var num = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
    return isNeg ? -num : num;
  }
  var rowMap = {}, passedNetSales = false;
  for (var r2 = headerRowIdx + 1; r2 < data.length; r2++) {
    var row = data[r2] || [];
    var label = row[labelColIdx] ? row[labelColIdx].toString().toLowerCase().replace(/[^a-z0-9%]/g, '') : '';
    if (!label) continue;
    if (!passedNetSales) {
      if (label === 'sales' || label === 'grosssales') rowMap['sales'] = r2;
      else if (label.indexOf('salesreturn') !== -1) rowMap['salesReturn'] = r2;
      else if (label.indexOf('discount') !== -1 && label.indexOf('serviceteam') === -1) rowMap['discount'] = r2;
      else if (label.indexOf('discount') !== -1 && label.indexOf('serviceteam') !== -1) rowMap['discountServiceTeam'] = r2;
      else if (label.indexOf('surcharge') !== -1) rowMap['surcharges'] = r2;
      else if (label.indexOf('undeliv') !== -1 && label.indexOf('dec') !== -1) rowMap['udSalesDec'] = r2;
      else if (label.indexOf('undeliv') !== -1) rowMap['udSalesCur'] = r2;
      else if (label.indexOf('netsales') !== -1) { rowMap['netSales'] = r2; passedNetSales = true; }
    } else {
      if (label === 'basecogs') rowMap['baseCogs'] = r2;
      else if (label === 'accruals' || label === 'accrual') rowMap['accruals'] = r2;
      else if (label === 'cogs' || label === 'totalcogs') rowMap['totalCogs'] = r2;
      else if (label.indexOf('servicefee') !== -1) rowMap['serviceFees'] = r2;
      else if (label.indexOf('consig') !== -1) rowMap['consignment'] = r2;
      else if (label.indexOf('gpprrwriteoff') !== -1) rowMap['gpprrWriteOff'] = r2;
      else if (label.indexOf('extendedwarranty') !== -1) rowMap['extendedWarranty'] = r2;
      else if (label.indexOf('shortage') !== -1) rowMap['shortage'] = r2;
      else if (label.indexOf('damage') !== -1) rowMap['damage'] = r2;
      else if (label.indexOf('expiries') !== -1) rowMap['expiries'] = r2;
      else if (label.indexOf('transportation') !== -1) rowMap['transportation'] = r2;
      else if (label.indexOf('landedcost') !== -1) rowMap['landedCost'] = r2;
      else if (label.indexOf('bard') !== -1) rowMap['bardGm'] = r2;
      else if (label.indexOf('pricecorrection') !== -1) rowMap['priceCorrection'] = r2;
      else if (label.indexOf('destruction') !== -1) rowMap['destructionCharges'] = r2;
      else if (label.indexOf('3rdparty') !== -1 || label.indexOf('thirdparty') !== -1) rowMap['thirdPartyCost'] = r2;
      else if (label.indexOf('undeliv') !== -1 && label.indexOf('dec') !== -1) rowMap['udCogsDec'] = r2;
      else if (label.indexOf('undeliv') !== -1) rowMap['udCogsCur'] = r2;
      else if (label.indexOf('otheradjustment') !== -1) rowMap['otherAdjustments'] = r2;
      else if ((label.indexOf('grossprofit') !== -1 || label === 'gp') && label.indexOf('%') === -1) rowMap['gp'] = r2;
    }
  }
  var out = [];
  GP_LINES.forEach(function(bl) {
    var col = colMap[bl.key];
    if (col === undefined) { for (var k in colMap) { if (k.indexOf(bl.key) !== -1 || bl.key.indexOf(k) !== -1) { col = colMap[k]; break; } } }
    if (col === undefined) return;
    function v(name){ if (!rowMap[name]) return 0; var row = data[rowMap[name]] || []; return parseNum(row[col]); }
    var othersCosts = v('extendedWarranty')+v('shortage')+v('damage')+v('expiries')+v('transportation')+v('landedCost')+v('bardGm')+v('priceCorrection')+v('destructionCharges')+v('thirdPartyCost')+v('otherAdjustments');
    out.push({ category: bl.cat, manager: bl.manager, details: {
      sales:v('sales'), salesReturn:v('salesReturn'), discount:v('discount'), surcharges:v('surcharges'),
      discountServiceTeam:v('discountServiceTeam'), udSalesDec:v('udSalesDec'), udSalesCur:v('udSalesCur'), netSales:v('netSales'),
      baseCogs:v('baseCogs'), accruals:v('accruals'), gpprrWriteOff:v('gpprrWriteOff'), serviceFees:v('serviceFees'),
      consignment:v('consignment'), othersCosts:othersCosts, udCogsDec:v('udCogsDec'), udCogsCur:v('udCogsCur'),
      totalCogs:v('totalCogs'), gp:v('gp') } });
  });
  return out;
}

// ---- faithful port of the source getDeferredCostsData: cell-by-cell scan of the
//      "Deferred Cost" tab (handles side-by-side tables; values forced positive) ----
var GP_DEFERRED_KEYS = ['serviceInvoices','gpprrDeferred','intlStock','newWarranty','netIncomeClosing','infusionDisp','kiestraSurcharge'];
function gpParseDeferred_(data){
  var result = {}; GP_DEFERRED_KEYS.forEach(function(k){ result[k] = 0; });
  if (!data || !data.length) return result;
  for (var r = 0; r < data.length; r++) {
    var row = data[r] || [];
    for (var c = 0; c < row.length - 1; c++) {
      var cellStr = (row[c] == null ? '' : row[c]).toString().toLowerCase().trim();
      if (!cellStr) continue;
      var val = 0;
      var nextCellStr = row[c+1] != null ? row[c+1].toString().replace(/,/g, '').trim() : '';
      var numMatch = nextCellStr.match(/-?[0-9]+(\.[0-9]+)?/);
      if (numMatch && !isNaN(parseFloat(numMatch[0]))) val = Math.abs(parseFloat(numMatch[0]));
      if (cellStr.indexOf('service invoices') !== -1) result.serviceInvoices = val;
      else if (cellStr === 'gpprr') result.gpprrDeferred = val;
      else if (cellStr.indexOf('international stock') !== -1) result.intlStock = val;
      else if (cellStr.indexOf('new warranty') !== -1) result.newWarranty = val;
      else if (cellStr.indexOf('net income closing') !== -1) result.netIncomeClosing = val;
      else if (cellStr.indexOf('infusion') !== -1) result.infusionDisp = val;
      else if (cellStr === 'kiestra') result.kiestraSurcharge = val;
    }
  }
  return result;
}

// ---- ingest: read every month tab directly, cache to Drive (runs as montaser) ----
function gpIngest(){
  var ss, sheets;
  try { ss = SpreadsheetApp.openById(GP_SHEET_ID); sheets = ss.getSheets(); }
  catch(e){ Logger.log('gpIngest: no access to source sheet — ' + e); return { error:'no-access', message:String(e) }; }
  var have = {}, deferredSheet = null;
  sheets.forEach(function(sh){
    var nm = sh.getName().trim(); have[nm] = sh;
    var lc = nm.toLowerCase();
    if (!deferredSheet && lc.indexOf('defer') !== -1 && lc.indexOf('cost') !== -1) deferredSheet = sh;
  });
  var months = {}, tabs = [];
  GP_MONTHS.forEach(function(m){
    var sh = have[m]; if (!sh) return;
    var rows = gpParseData_(sh.getDataRange().getDisplayValues());
    if (rows && rows.length){ months[m] = rows; tabs.push(m); }
  });
  var deferred = null;
  if (deferredSheet) { try { deferred = gpParseDeferred_(deferredSheet.getDataRange().getDisplayValues()); } catch(e){ Logger.log('gpIngest: deferred tab failed — ' + e); } }
  var store = { built: new Date().toISOString(), source:'GP Analysis Dashboard workbook (direct)', tabs: tabs, months: months, deferred: deferred };
  var it = DriveApp.getFilesByName(GP_STORE);
  if (it.hasNext()) it.next().setContent(JSON.stringify(store)); else DriveApp.createFile(GP_STORE, JSON.stringify(store), 'application/json');
  Logger.log('gpIngest: cached ' + tabs.length + ' months [' + tabs.join(',') + '] deferred=' + (deferred ? 'yes' : 'no'));
  return { ok:true, tabs:tabs, deferred:deferred };
}

// ---- client lazy-load endpoint: returns the cache, self-refreshing when stale/missing ----
function gpData(){
  var raw = '';
  try { var it = DriveApp.getFilesByName(GP_STORE); if (it.hasNext()) raw = it.next().getBlob().getDataAsString(); } catch(e){}
  var fresh = false;
  // a pinned store (built offline from the Finance workbook by gp_from_xlsx.py) is never auto-refreshed
  if (raw) { try { var s0 = JSON.parse(raw); fresh = !!s0.pinned || (s0.built && (Date.now() - new Date(s0.built).getTime()) < GP_MAX_AGE_H*3600*1000); } catch(e){} }
  if (!fresh) {
    // a failed refresh must never hide the last good cache
    var r = null; try { r = gpIngest(); } catch(e){ Logger.log('gpData: refresh failed — ' + e); }
    if (r && r.ok) { try { var it2 = DriveApp.getFilesByName(GP_STORE); if (it2.hasNext()) raw = it2.next().getBlob().getDataAsString(); } catch(e){} }
    else if (!raw) { throw new Error('GP source sheet not readable (' + ((r && r.message) || 'unknown') + ') and no cached copy exists'); }
  }
  return raw;
}

// ---- invoice-level recognized sales (built offline by gp_from_xlsx.py, lazily loaded by the Recognized tab) ----
var GP_INV_STORE = 'TAMER-GP-Invoices.json';
function gpInvoices(){
  try { var it = DriveApp.getFilesByName(GP_INV_STORE); return it.hasNext() ? it.next().getBlob().getDataAsString() : ''; }
  catch(e){ return ''; }
}

// ---- optional manual verification (run from the editor as montaser) ----
function gpVerify(){
  var raw = gpData(); if (!raw) return 'no data — is the sheet shared to this account?';
  var s = JSON.parse(raw);
  var DIV = { ALL:null, DS:['DS Goods','DS Services','GPPRR','Kiestra'], MMS:['MMS Goods - Riyadh','MMS Services - Riyadh','MMS Goods - Jeddah','MMS Services - Jeddah'], SM:['SM Goods'] };
  var out = [];
  s.tabs.forEach(function(m){ ['ALL','DS','MMS','SM'].forEach(function(d){
    var cats = DIV[d], ns=0, gp=0;
    (s.months[m]||[]).forEach(function(r){ if (cats && cats.indexOf(r.category)===-1) return; if (r.category==='Extra Provision' && cats) return; ns += r.details.netSales; gp += r.details.gp; });
    out.push(m+' '+d+': NetSales='+Math.round(ns).toLocaleString('en-US')+'  GP='+Math.round(gp).toLocaleString('en-US')+'  GP%='+(ns?(gp/ns*100).toFixed(2):'0')+'%');
  });});
  return out.join('\n');
}
