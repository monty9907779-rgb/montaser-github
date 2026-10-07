// aaaRunNow: FIRST function in the file on purpose - the Apps Script editor resets the
// function picker to the first entry on every load and its Run button executes the
// PREVIOUSLY committed selection, so making the entry point first is the only reliable
// way to run the engine by hand. Do not move it.
function aaaRunNow(){ return runDaily(); }

// ==== TAMER Dashboards Engine (Apps Script) — 100% Tamer official sources, replaces n8n ingest+aggregate ====
var CATMAP={"1000SP01791": "MMS|", "1000SP01798": "MMS|", "1000SP01801": "MMS|", "1000SP01925": "MMS|", "1000SP01950": "MMS|", "1000SP02115": "MMS|", "104662-01": "MMS|", "111-215": "MMS|", "111-215/F": "MMS|", "122275-01": "MMS|", "122463-01": "MMS|", "133456-03": "MMS|", "136276-02": "MMS|", "136276-02/F": "MMS|", "137204-05": "MMS|", "137562-01": "MMS|", "137670-02": "MMS|", "137673-02": "MMS|", "137982-01": "MMS|", "138423-01": "MMS|", "138425-01": "MMS|", "138433-01": "MMS|", "138464-01": "MMS|", "138485-01": "MMS|", "138642-01/F": "MMS|", "138698-05": "MMS|", "151022-11": "MMS|", "151230-11": "MMS|", "1839298": "DS|Goods", "1890111": "DS|Goods", "211124": "DS|Goods", "211768": "DS|Goods", "211780": "DS|Goods", "212515": "DS|Goods", "212516": "DS|Goods", "212517": "DS|Goods", "212520": "DS|Goods", "212521": "DS|Goods", "212522": "DS|Goods", "212539": "DS|Goods", "218263": "DS|Goods", "220215": "DS|Goods", "220216": "DS|Goods", "220217": "DS|Goods", "220245": "DS|Goods", "2203-0006": "MMS|", "2206-0007": "MMS|", "222281": "DS|Goods", "222291": "DS|Goods", "222301": "DS|Goods", "222641": "DS|Goods", "2260-0006": "MMS|", "228191": "DS|Goods", "228801": "DS|Goods", "228811": "DS|Goods", "229511": "DS|Goods", "231391": "DS|Goods", "231539": "DS|Goods", "231593": "DS|Goods", "231650": "DS|Goods", "231727": "DS|Goods", "231741": "DS|Goods", "240862": "DS|Goods", "2420-0007": "MMS|", "2441-0007": "MMS|", "245115": "DS|Goods", "245122": "DS|Goods", "245123": "DS|Goods", "245124": "DS|Goods", "245125": "DS|Goods", "245126": "DS|Goods", "245127": "DS|Goods", "245128": "DS|Goods", "246001": "DS|Goods", "246003": "DS|Goods", "246004": "DS|Goods", "246006": "DS|Goods", "246007": "DS|Goods", "246009": "DS|Goods", "246011": "DS|Goods", "246100": "DS|Goods", "246102": "DS|Goods", "246103": "DS|Goods", "246104": "DS|Goods", "246105": "DS|Goods", "2477-0007": "MMS|", "247940": "DS|Goods", "256042": "DS|Goods", "257687": "DS|Goods", "257687/F": "DS|Goods", "257688": "DS|Goods", "257688/F": "DS|Goods", "257710": "DS|Goods", "257710/F": "DS|Goods", "257819": "DS|Goods", "257819/F": "DS|Goods", "260678": "DS|Goods", "260680": "DS|Goods", "260683": "DS|Goods", "260685": "DS|Goods", "261181": "DS|Goods", "261185": "DS|Goods", "261187": "DS|Goods", "261188": "DS|Goods", "261194": "DS|Goods", "261203": "DS|Goods", "263810": "DS|Goods", "271051": "DS|Goods", "278850": "DS|Goods", "279100": "DS|Goods", "289410": "DS|Goods", "298410": "DS|Goods", "305892": "SM|Goods", "30852": "MMS|", "320383-01": "MMS|", "330188-01": "MMS|", "350993-01": "MMS|", "354672-01": "MMS|", "354683-01": "MMS|", "354684-02": "MMS|", "354685-01": "MMS|", "354686-01": "MMS|", "354770-01": "MMS|", "356497-01": "MMS|", "356548-01/F": "MMS|", "360210": "SM|Goods", "360212": "SM|Goods", "360213": "SM|Goods", "362725": "SM|Goods", "362799": "SM|Goods", "363047": "SM|Goods", "363048": "SM|Goods", "363705": "SM|Goods", "364356": "SM|Goods", "364378": "SM|Goods", "364391": "SM|Goods", "364413": "SM|Goods", "36481000": "SM|Goods", "364815": "SM|Goods", "36490200": "SM|Goods", "364915": "SM|Goods", "364941": "SM|Goods", "364959": "SM|Goods", "364984": "SM|Goods", "365000": "SM|Goods", "365017": "SM|Goods", "365056": "SM|Goods", "365964": "SM|Goods", "365966": "SM|Goods", "365968": "SM|Goods", "365975": "SM|Goods", "365979": "SM|Goods", "365986": "SM|Goods", "365993": "SM|Goods", "366592": "SM|Goods", "366594": "SM|Goods", "366645": "SM|Goods", "366882": "SM|Goods", "367198": "SM|Goods", "367282": "SM|Goods", "367284": "SM|Goods", "367295": "SM|Goods", "367300": "SM|Goods", "367342": "SM|Goods", "367363": "SM|Goods", "367364": "SM|Goods", "367365": "SM|Goods", "367374": "SM|Goods", "367376": "SM|Goods", "367391": "SM|Goods", "367392": "SM|Goods", "367393": "SM|Goods", "367756": "SM|Goods", "367864": "SM|Goods", "367869": "SM|Goods", "367896": "SM|Goods", "367953": "SM|Goods", "367955": "SM|Goods", "367957": "SM|Goods", "368102": "SM|Goods", "368103": "SM|Goods", "368380": "SM|Goods", "368381": "SM|Goods", "368501": "SM|Goods", "368520": "SM|Goods", "368521": "SM|Goods", "368609": "SM|Goods", "368610": "SM|Goods", "368774": "SM|Goods", "368815": "SM|Goods", "368841": "SM|Goods", "368856": "SM|Goods", "368861": "SM|Goods", "368884": "SM|Goods", "368886": "SM|Goods", "368920": "SM|Goods", "368921": "SM|Goods", "369032": "SM|Goods", "369528": "SM|Goods", "4111584201501": "DS|GPPRR", "4111584201601": "DS|GPPRR", "4111584201701": "DS|GPPRR", "4111584201801": "DS|GPPRR", "4111584202101": "DS|GPPRR", "4111584202301": "DS|GPPRR", "4111612326701": "DS|GPPRR", "4111612328401": "DS|GPPRR", "4111612336201": "DS|GPPRR", "4111612915001": "DS|GPPRR", "4111612917700": "DS|GPPRR", "4111612943801": "DS|GPPRR", "4111612943901": "DS|GPPRR", "4111612945201": "DS|GPPRR", "4111612945500": "DS|Kiestra", "4111612945800": "DS|Kiestra", "4111612946000": "DS|Kiestra", "4111612946200": "DS|Kiestra", "4111612946300": "DS|Kiestra", "4111612946401": "DS|GPPRR", "4111612946600": "DS|Kiestra", "4111612946700": "DS|Kiestra", "4111612946901": "DS|GPPRR", "4111612947001": "DS|GPPRR", "4111612947201": "DS|GPPRR", "4111612947301": "DS|GPPRR", "4111612947400": "DS|Kiestra", "4111612947800": "DS|Kiestra", "4111612947900": "DS|Kiestra", "4111612948200": "DS|Kiestra", "4111612948400": "DS|Kiestra", "4111612948600": "DS|Kiestra", "4111612948800": "DS|Kiestra", "4111612948900": "DS|Kiestra", "4111612949200": "DS|Kiestra", "4111612949500": "DS|Kiestra", "4111612949600": "DS|Kiestra", "4111612949700": "DS|Kiestra", "4111612950500": "DS|GPPRR", "4111612951401": "DS|GPPRR", "435117": "DS|Goods", "435119": "DS|Goods", "435120": "DS|Goods", "437519": "DS|Goods", "437519/F": "DS|Goods", "440021": "DS|Service", "440028": "DS|Service", "440034": "DS|Service", "440038": "DS|Service", "440047": "DS|Service", "440048": "DS|Service", "440049": "DS|Service", "440050": "DS|Service", "440054": "DS|Service", "440107": "DS|Goods", "440774": "DS|Service", "440825": "DS|Goods", "440825/F": "DS|Goods", "440849": "DS|Goods", "440910": "DS|Goods", "440910/F": "DS|Goods", "440945": "DS|Service", "441054": "DS|Service", "441304": "DS|Service", "441307": "DS|Service", "441365": "DS|Service", "441370": "DS|Service", "441370/F": "DS|Goods", "441385": "DS|Goods", "441385/F": "DS|Goods", "441386": "DS|Goods", "441386/F": "DS|Goods", "441387": "DS|Goods", "441387/F": "DS|Goods", "441388": "DS|Goods", "441397": "DS|Service", "441450": "DS|Service", "441452": "DS|Service", "441453": "DS|Service", "441458": "DS|Service", "441461": "DS|Service", "441463": "DS|Service", "441464": "DS|Service", "441465": "DS|Service", "441466": "DS|Service", "441468": "DS|Service", "441470": "DS|Service", "441472": "DS|Service", "441473": "DS|Service", "441478": "DS|Goods", "441478/F": "DS|Goods", "441480": "DS|Service", "441668": "DS|Service", "441674": "DS|Service", "441732": "DS|Service", "441735": "DS|Service", "441743": "DS|Goods", "441772": "DS|Goods", "441916": "DS|Goods", "441916/F": "DS|Goods", "441951": "DS|Goods", "441951/F": "DS|Goods", "441984": "DS|Service", "442017": "DS|Goods", "442020": "DS|Goods", "442021": "DS|Goods", "442023": "DS|Goods", "442024": "DS|Goods", "442027": "DS|Goods", "442296": "DS|Goods", "442299": "DS|Goods", "442391": "DS|Goods", "442555": "DS|Goods", "442950": "DS|Goods", "442960": "DS|Goods", "442963": "DS|Goods", "443283": "DS|Service", "443362": "DS|Goods", "443384": "DS|Service", "443386": "DS|Service", "443388": "DS|Service", "443391": "DS|Service", "443393": "DS|Service", "443403": "DS|Service", "443461": "DS|Goods", "443503": "DS|Service", "443624": "DS|Goods", "443624/F": "DS|Goods", "443625": "DS|Goods", "443625/F": "DS|Goods", "443686": "DS|Goods", "443712": "DS|Goods", "443806": "DS|Goods", "443809": "DS|Goods", "443842": "DS|Service", "443848": "DS|Service", "443866": "DS|Goods", "443878": "DS|Goods", "443894": "DS|Goods", "443894/F": "DS|Goods", "443925": "DS|Goods", "443996": "DS|Goods", "443998": "DS|Goods", "444060": "DS|Goods", "444063": "DS|Goods", "444064": "DS|Goods", "444199": "DS|Goods", "444374": "DS|Service", "444531": "DS|Service", "444808/F": "DS|Goods", "445262": "DS|Goods", "445284": "DS|Goods", "445398": "DS|Goods", "445411": "DS|Goods", "445515": "DS|Service", "445518": "DS|Goods", "445518/F": "DS|Goods", "445810": "DS|Service", "445870": "DS|Goods", "445871": "DS|Service", "445872": "DS|Goods", "445888": "DS|Service", "445941": "DS|Goods", "445999": "DS|Goods", "446080": "DS|Goods", "446081": "DS|Goods", "446093": "DS|Goods", "446094": "DS|Goods", "446096": "DS|Goods", "446211": "DS|Goods", "446238": "DS|Goods", "446941": "DS|Goods", "446943": "DS|Goods", "446944": "DS|Goods", "446945": "DS|Goods", "446946": "DS|Goods", "446947": "DS|Goods", "446948": "DS|Goods", "446950": "DS|Goods", "446955": "DS|Goods", "446956": "DS|Goods", "446958": "DS|Goods", "446972": "DS|Goods", "447100": "DS|Service", "447119": "DS|Service", "447157": "DS|Service", "447265": "DS|Goods", "447266": "DS|Goods", "447268": "DS|Goods", "447270": "DS|Goods", "447270/F": "DS|Goods", "447271": "DS|Goods", "447271/F": "DS|Goods", "447272": "DS|Goods", "447274": "DS|Goods", "447274/F": "DS|Goods", "447297": "DS|Goods", "447333": "DS|Goods", "448012": "DS|Goods", "448014": "DS|Goods", "448015": "DS|Goods", "448025": "DS|Goods", "448037": "DS|Goods", "448037/F": "DS|Goods", "448038": "DS|Goods", "448316": "DS|Goods", "448785": "DS|Goods", "448984": "DS|Goods", "448984/F": "DS|Goods", "449038": "DS|Goods", "449040": "DS|Goods", "449041": "DS|Goods", "449524": "DS|Goods", "449527": "DS|Goods", "496018": "DS|Goods", "496020": "DS|Goods", "496021": "DS|Goods", "496027": "DS|Goods", "496034": "DS|Goods", "496036": "DS|Goods", "496040": "DS|Goods", "496041": "DS|Goods", "496042": "DS|Goods", "496044": "DS|Goods", "496048": "DS|Goods", "496049": "DS|Goods", "496050": "DS|Goods", "496051": "DS|Goods", "496053": "DS|Goods", "496054": "DS|Goods", "496059": "DS|Goods", "496060": "DS|Goods", "496061": "DS|Goods", "496063": "DS|Goods", "496071": "DS|Goods", "496072": "DS|Goods", "496077": "DS|Goods", "496078": "DS|Goods", "496079": "DS|Goods", "496080": "DS|Goods", "496083": "DS|Goods", "496086": "DS|Goods", "496087": "DS|Goods", "496109": "DS|Goods", "496173": "DS|Service", "496174": "DS|Service", "60393E": "MMS|", "60643": "MMS|", "60693E": "MMS|", "761165": "DS|Goods", "762165": "SM|Goods", "8004586": "MMS|", "8007ENT01": "MMS|", "800TIG2RWN1": "MMS|", "8015": "MMS|", "80300UNS02-3(CFN##13D156)": "MMS|", "8100": "MMS|", "8110": "MMS|", "8120": "MMS|", "8270170": "DS|Goods", "8290190": "DS|Goods", "8290200": "DS|Goods", "9002TIG03-G": "MMS|", "924-048-1": "DS|Service", "99025499": "DS|Kiestra", "99025506": "DS|Kiestra", "99025507": "DS|Kiestra", "99025511": "DS|Kiestra", "99025520": "DS|Kiestra", "A7DES0M2U3FEN": "MMS|", "A7DES0M3U3FEN-A": "MMS|", "A7DES1M4U1FEN": "MMS|", "ADCES-A": "MMS|", "ADCES-B": "MMS|", "ASCES-A": "MMS|", "BD Max service": "DS|Service", "Bactec 9050 service": "DS|Service", "Bactec 9120 service": "DS|Service", "Bactec 9240 service": "DS|Service", "Bactec FX 40 service": "DS|Service", "Bactec FX Tob servic": "DS|Service", "Bactec Stack service": "DS|Service", "CCNEXUS1": "MMS|", "CFN##12D402": "MMS|", "CFN##13D109": "MMS|", "CFN##13D115": "MMS|", "CFN##13D156": "MMS|", "CFN##13D508": "MMS|", "CFN##13D509": "MMS|", "CFN##15D229": "MMS|", "CFN##15D315": "MMS|", "CFN##15D385": "MMS|", "CFN##15D386": "MMS|", "CFN##18D322": "MMS|", "CFN##18D397": "MMS|", "CFN##18D571": "MMS|", "CFN##18D572": "MMS|", "CFN##18D573": "MMS|", "CFN##18D574": "MMS|", "CFN##18D575": "MMS|", "DGS": "MMS|", "G30302V": "MMS|", "G30402M": "MMS|", "G30454V": "MMS|", "GPNEXUS1": "MMS|", "GPPRR Item": "DS|GPPRR", "M6DESRXS0M2UP3FENC": "MMS|", "M6DESRXS0M3UP2FENF": "MMS|", "M6DESRXS0M4UP1FENC": "MMS|", "M6DESRXS1M2UP2FENB": "MMS|", "M6DESRxS0M3UP2FENG": "MMS|", "MGIT 960 service": "DS|Service", "Mycobacterial-Media": "DS|GPPRR", "P-PM-0001": "MMS|", "PHOENIX M50": "DS|Service", "Phoenix 100 service": "DS|Service", /*OWNER-RULED 2026-08-01*/ "036490200": "DS|Goods", "0602680CE": "DS|Goods", "0607540CE": "DS|Goods", "2295108": "SM|Tender", "245125": "DS|Goods", "261185": "DS|Goods", "3173108D": "DS|Goods", "3385108QD": "DS|Tender", "4111612329601": "DS|Goods", "4111612950001": "SM|Goods", "4111612950700": "DS|Goods", "441344": "DS|Goods", "441345": "DS|Goods", "441346": "DS|Tender", "443399": "DS|Goods", "444202": "DS|Tender", "447269": "DS|Goods", "448039": "DS|Tender", "52608G": "DS|Goods", "6396355": "DS|Goods", "862017": "DS|Goods", "99025497": "DS|Goods", "99025501": "DS|Goods", "99025502": "DS|Goods", "99025503": "DS|Goods", "99025509": "DS|Goods", "99025510": "DS|Goods", "99025512": "DS|Tender", "99025514": "DS|Goods", "99025515": "SM|Tender", "99025516": "DS|Goods", "99025517": "DS|Goods", "99025519": "DS|Goods", "99025521": "DS|Goods", "99025522": "DS|Goods", "99025523": "DS|Goods", "99025524": "DS|Goods", "99025525": "DS|Goods", "A942214": "DS|Goods", "DS4001": "DS|Goods", "EV12": "DS|Goods", "EV14": "DS|Goods", "P-PM-0002": "MMS|Service", "SCCAN01": "SM|Tender", "SMEC10C": "DS|Tender"};
var TENDERMAP={"1839298": "DS", "211124": "DS", "211132": "DS", "211407": "DS", "211780": "DS", "212522": "DS", "226601": "DS", "227791": "DS", "228191": "DS", "231727": "DS", "231729": "DS", "231741": "DS", "240862": "DS", "245115": "DS", "245122": "DS", "245123": "DS", "245124": "DS", "245126": "DS", "245127": "DS", "245128": "DS", "246001": "DS", "246003": "DS", "246004": "DS", "246007": "DS", "246009": "DS", "254602": "DS", "254607": "DS", "254656": "DS", "254657": "DS", "260678": "DS", "260680": "DS", "260683": "DS", "261181": "DS", "261187": "DS", "271051": "DS", "278850": "DS", "305892": "SM", "364356": "SM", "364413": "SM", "364815": "SM", "364915": "SM", "365056": "SM", "365979": "SM", "365986": "SM", "366645": "SM", "366882": "SM", "367363": "SM", "367364": "SM", "367376": "SM", "368610": "SM", "368774": "SM", "437519": "DS", "441772": "DS", "442017": "DS", "442020": "DS", "442021": "DS", "442023": "DS", "442024": "DS", "442027": "DS", "442153": "DS", "442555": "DS", "442818": "DS", "442820": "DS", "442826": "DS", "442828": "DS", "442960": "DS", "442963": "DS", "443461": "DS", "443712": "DS", "443812": "DS", "448037": "DS", "448316": "DS", "448785": "DS", "449038": "DS", "449040": "DS", "449524": "DS"};

/**
 * TAMER Dashboards Engine — Apps Script (replaces the n8n ingest + aggregate).
 * 100% official Tamer sources, read from Gmail as the tamergroup account:
 *   - Sales (private, all divisions): TamerSC@  "BD-Saudi Private Sales Report"  (per-month end-of-month report)
 *   - Tender:                         muhannad.ghanaim@  "BD Saudi Tender Sales report"
 *   - Stock / GPPRR / Consignment:    TamerSC@ stock reports  (built separately)
 * CATMAP / TENDERMAP are embedded above this block (generated from the n8n maps).
 * Output object `bdDash` matches the n8n staticData exactly, so the existing render works unchanged.
 */

var monthNames = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
var SEG_META = { DS_GOODS:['DS','Goods'], DS_GPPRR:['DS','GPPRR'], DS_KIES:['DS','Kiestra'], DS_SVC:['DS','Service'],
  DS_TENDER:['DS','Tender'], MMS_GOODS:['MMS','Goods'], MMS_SVC:['MMS','Service'], MMS_TENDER:['MMS','Tender'], SM_GOODS:['SM','Goods'], SM_SVC:['SM','Service'], SM_TENDER:['SM','Tender'] };

// ---- robust division classifier: CATMAP first, then catalog-prefix/category fallback ----
// ---- Vendor Site -> business unit (from the reports themselves) ----------
// BD-Saudi Private July: BDI DX 6,787,792 · BDI PAS 4,188,684 · SERVICE CONTRAC
// 1,521,641 · BD-MMS Infusion 388,908 · BDI DX - Spare 58,832 · BD - Dispensing -4.
// BD Tender: BD DX-OASIS 1,493,234 · BD PAS 89,240.
var SITE_DIV = {
  'BDI DX':'DS', 'BDI-DX':'DS', 'BDI DX - SPARE':'DS', 'BD DX-OASIS':'DS', 'BD DX':'DS',
  'BDI PAS':'SM', 'BD PAS':'SM', 'BD - PAS':'SM',
  'BD-MMS INFUSION':'MMS', 'BD - DISPENSING':'MMS', 'BD-AMPC':'MMS', 'BD MMS':'MMS'
};
// Sites whose revenue is service/maintenance rather than product.
var SITE_SERVICE = { 'SERVICE CONTRAC':1, 'BDI DX - SPARE':1 };

function classifyDivFallback_(u, catg, sub, site){
  if (u.indexOf('99025')===0 || u.indexOf('41116')===0) return 'DS';
  if (u.indexOf('P-PM')===0 || u.indexOf('1000SP')===0 || u.indexOf('A7DES')===0 || u.indexOf('M6DES')===0 ||
      u.slice(0,3)==='CFN' || u.slice(0,3)==='G30' || u.slice(0,3)==='DGS' || u.slice(0,3)==='GPN' ||
      u.slice(0,3)==='CCN' || u.slice(0,3)==='ADC' || u.slice(0,3)==='ASC') return 'MMS';
  if (/^36\d{4}/.test(u)) return 'SM';
  if (/^(2|4)\d{5}$/.test(u) || /^44\d{4}/.test(u)) return 'DS';
  if (site==='BD PAS' || catg==='ABG' || catg==='ACQUI' || catg==='CNTMT' || catg==='PAS') return 'SM';
  if (catg==='SERVI' || catg==='MNTCE' || sub==='SERVC' || sub==='SERVI') return 'DS';
  return 'SM';
}

// ---- classifySeg (ported from n8n Aggregate; robust fallback instead of _code default) ----
function classifySeg_(r){
  var cat = r['Vndr Catalog']; cat = (cat==null) ? '' : String(cat).trim();
  if (cat.slice(-2)==='.0') cat = cat.slice(0,-2);
  var category = String(r['Category']||'').trim();
  var site = String(r['Vendor Site']||'').trim();
  var siteU = site.toUpperCase();
  var m = CATMAP[cat];                       // may still refine the LINE
  var mapDiv = m ? m.split('|')[0] : '';
  var mapLine = m ? m.split('|')[1] : '';

  var rel = String(r['Releated to'] || r['Related to'] || '').trim().toUpperCase().replace(/\s+/g, ' ');
  // Tender feed override: rows tagged Tender SM belong to SM Tender even when Vendor Site says BD DX-OASIS.
  if (r._code === 'Tender' && (rel === 'TENDER SM' || rel === 'SM TENDER')) return 'SM_TENDER';
  // ---- DIVISION comes from the report's own Vendor Site (the business unit) ----
  // 2033 = BD Diagnostics (DS) · 2039 = MMS/CareFusion · 2041 = BD-PAS (SM).
  // This is stated by the source, so it beats any catalog guess.
  var d2 = r._forceDiv || SITE_DIV[siteU] || mapDiv || classifyDivFallback_(cat.toUpperCase(), category,
             String(r['Sub Category']||'').trim(), site);

  // ---- LINE ----
  var l;
  if (r._code === 'Tender') l = 'Tender';
  // NOTE: do NOT force SERVICE CONTRAC / '- Spare' sites to the Service line. Checked
  // against the validated 2033 feed: its own Vendor Site mix is BDI DX 7551 /
  // SERVICE CONTRAC 964 / BDI DX - Spare 884, and the validated model books those rows
  // by CATALOG - only catalogs mapped '…|Service' count as Service, the rest are Goods.
  // Forcing the site to Service inflated DS Service to 4,962,480 vs the validated 1,932,286.
  else if (mapLine==='GPPRR' || mapLine==='Kiestra' || mapLine==='Service') l = mapLine;
  else if (d2==='MMS' && (category==='SERVI'||category==='SPARE')) l = 'Service';
  else l = 'Goods';

  var LKEY = {'Goods':'GOODS','GPPRR':'GPPRR','Kiestra':'KIES','Service':'SVC','Tender':'TENDER'};
  return d2 + '_' + (LKEY[l]||'GOODS');
}

function parseDate_(s){
  if(!s) return null; var p=String(s).split('-'); if(p.length!==3) return null;
  var d=parseInt(p[0],10), m=monthNames[p[1].toUpperCase()], y=parseInt(p[2],10);
  if(m===undefined||isNaN(d)||isNaN(y)) return null; if(y<100) y+=2000;
  return {day:d, month:m, year:y};
}

// ---- HTML-table parser: attachment bytes -> array of row objects keyed by header ----
function parseHtmlRows_(text){
  var tables = text.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
  if(!tables.length) return [];
  var best='', maxr=0;
  tables.forEach(function(t){ var n=(t.match(/<tr/gi)||[]).length; if(n>maxr){maxr=n;best=t;} });
  var trs = best.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  function cells(tr){ var out=[]; var cs=tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi)||[];
    cs.forEach(function(c){ out.push(c.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim()); }); return out; }
  var hi=-1;
  for(var i=0;i<Math.min(30,trs.length);i++){ if(cells(trs[i]).indexOf('Vndr Catalog')>-1){ hi=i; break; } }
  if(hi<0) return [];
  var H=cells(trs[hi]), rows=[];
  for(var j=hi+1;j<trs.length;j++){
    var c=cells(trs[j]); if(c.filter(function(x){return x!=='';}).length<2) continue;
    var o={}; for(var k=0;k<H.length&&k<c.length;k++){ if(H[k]) o[H[k]]=c[k]; }
    rows.push(o);
  }
  return rows;
}

// ---- Gmail: latest in-month report attachment as text ----
// These reports are cumulative month-to-date, so the LAST report of a month is that
// whole month. For a FINISHED month we look after the 25th (guaranteed end-of-month
// report). For the CURRENT month no such report exists yet, so we must take the newest
// report from day 1 onwards - otherwise the running month reads ZERO until the 25th.
function monthReportText_(query, y, mo, isCurrent){
  var nm = (mo===12)?[y+1,1]:[y,mo+1];
  var fromDay = isCurrent ? 1 : 25;
  var q = query + ' after:'+y+'/'+mo+'/'+fromDay+' before:'+nm[0]+'/'+nm[1]+'/1 has:attachment';
  var th = GmailApp.search(q, 0, 1); if(!th.length) return null;
  var msgs = th[0].getMessages(); var m = msgs[msgs.length-1];
  var atts = m.getAttachments();
  for(var i=0;i<atts.length;i++){ var n=atts[i].getName().toLowerCase(); if(n.indexOf('.xls')>-1||n.indexOf('.htm')>-1) return atts[i].getDataAsString('UTF-8'); }
  return null;
}

// ---- latest edition of a CUMULATIVE report ----
function latestReportText_(query){
  var th = GmailApp.search(query + ' has:attachment', 0, 1); if(!th.length) return null;
  var msgs = th[0].getMessages(); var m = msgs[msgs.length-1];
  var atts = m.getAttachments();
  for(var i=0;i<atts.length;i++){ var n=atts[i].getName().toLowerCase();
    if(n.indexOf('.xls')>-1||n.indexOf('.htm')>-1) return atts[i].getDataAsString('UTF-8'); }
  return null;
}

// ---- gather all sales rows ----
// These four reports are CUMULATIVE (each carries the whole period and reflects the FINAL
// restated value of every invoice). Read the latest edition of each - do NOT stitch together
// month-end snapshots of a month-to-date feed: a snapshot freezes a month as it stood that
// day, so later credit notes/adjustments are lost and the totals drift (proven: month diffs
// alternated sign and the year came out 6% low). These are the sources the numbers were
// validated against.
// ---- OFFICIAL DAILY SOURCES ONLY ----------------------------------------
// The owner is switching off the Oracle automation that mailed the cumulative
// 2041/2039/2033/"Tender sales" reports into HIS mailbox, so the engine must run
// purely on the reports that arrive daily from TamerSC and Muhannad.
// Each is CURRENT-MONTH-TO-DATE, so the year is rebuilt month by month: for a
// finished month take the last report of that month, for the running month take
// the newest one (see monthReportText_ / isCurrent).
var MONTH_FEEDS = [
  { code:'priv', q:'from:TamerSC@tamergroup.com subject:"BD-Saudi Private Sales Report"' }
];

// Two CUMULATIVE reports cover what the official daily feeds do not carry:
//   2039        -> MMS service billing (official BD-Saudi has 276,529 vs 3,554,009)
//   Tender sales-> tender with its later restatements (13.06M vs 21.89M official)
// DS and SM product sales stay on the official BD-Saudi feed, which matches the
// validated figures (SM Goods -0.3%, DS Service -9%).
var CUM_FEEDS = [
  { code:'2039',   div:'MMS', q:'from:mohamed.montaser@tamergroup.com subject:2039' },
  { code:'Tender', div:'',    q:'from:mohamed.montaser@tamergroup.com subject:"Tender sales"' }
];

function gatherSalesRows_(now){
  var curY=now.getFullYear(), curM=now.getMonth();
  var bdStart = curM>=9 ? curY : curY-1;
  /*CALYTD*/ var months=[]; if(bdStart<curY){ for(var m=9;m<12;m++) months.push([bdStart,m]); }
  /*CALYTD*/ for(var m2=0;m2<=curM;m2++) months.push([curY,m2]);
  var rows=[];
  months.forEach(function(ym){
    var isCur = (ym[0]===curY && ym[1]===curM);
    MONTH_FEEDS.forEach(function(f){
      var txt = monthReportText_(f.q, ym[0], ym[1]+1, isCur);   // gmail month is 1-based
      if(!txt) return;
      parseHtmlRows_(txt).forEach(function(r){
        // BARD is a separate business with its own dashboard - owner's instruction is to
        // exclude it from the BD numbers entirely, wherever it shows up.
        if(/bard/i.test(String(r['Vendor Site']||''))) return;
        if(f.code==='Tender') r._code='Tender';
        r._src=f.code; rows.push(r);
      });
    });
  });
  // MMS is owned end-to-end by 2039, so drop MMS rows from BD-Saudi first.
  rows = rows.filter(function(r){
    if(r._src!=='priv') return true;
    return String(classifySeg_(r)).slice(0,3)!=='MMS';
  });
  CUM_FEEDS.forEach(function(f){
    var txt = latestReportText_(f.q); if(!txt) return;
    parseHtmlRows_(txt).forEach(function(r){
      if(/bard/i.test(String(r['Vendor Site']||''))) return;
      r._code=f.code; r._src=f.code; r._cum=true;
      if(f.div) r._forceDiv=f.div;
      rows.push(r);
    });
  });
  rows.forEach(function(r){ var seg=classifySeg_(r); r._div = SEG_META[seg] ? SEG_META[seg][0] : null; });
  return rows;
}

// ---- aggregate: rows (monthly official reports) -> bdDash (same shape as n8n staticData) ----
// NOTE: each monthly report already IS that month's data, so value = Current Sales Value (SAR)
// for every row, bucketed by Invoice-Date month. (n8n's dual-year `d.year===curY?cur:LY` logic
// is NOT used here — LY/compare is loaded separately from prior-fiscal-year monthly reports.)
function buildAggregates_(rows, now){
  var curY=now.getFullYear(), curM=now.getMonth(), curD=now.getDate();
  var bdStartYear = curM>=9 ? curY : curY-1;
  /*CALYTD*/ var SEQ=[]; if(bdStartYear<curY){ for(var m=9;m<12;m++) SEQ.push({y:bdStartYear,m:m}); }
  /*CALYTD*/ for(var m2=0;m2<=curM;m2++) SEQ.push({y:curY,m:m2});
  var seqIdx={}; SEQ.forEach(function(s,i){ seqIdx[s.y+'-'+s.m]=i; });

  var a1={}, a2={}, ret1={}, retDet={}, retAcc={}, acm={}, l1={}, acctLY={}, acct={}, prodAgg={}, prodBranch={}, prodDetail={};
  function acctName(r){ var a=String(r['Bill To']||'').trim(); if(a.length<3||/^\d+$/.test(a)) a=String(r['Customer Name']||'N/A').trim()||'N/A'; return a; }
  function catNo(r){ var c=String(r['Vndr Catalog']||'').trim(); if(c.slice(-2)==='.0') c=c.slice(0,-2); return c; }

  rows.forEach(function(r){
    var d=parseDate_(r['Invoice Date']); if(!d) return;
    var mi=seqIdx[d.year+'-'+d.month];
    // LY same-period (from a 'LY. Sales Value (SAR)' column when present, e.g. tender report)
    if(mi===undefined){
      if(d.year===curY-1 && d.month<=curM && !(d.month===curM && d.day>curD)){
        var segL=classifySeg_(r), metaL=SEG_META[segL];
        if(metaL){ var vL=parseFloat(String(r['LY. Sales Value (SAR)']||'').replace(/,/g,''))||0;
          if(vL){ var dvL=metaL[0], lnL=metaL[1]; l1[dvL+'|'+lnL+'|'+d.month]=(l1[dvL+'|'+lnL+'|'+d.month]||0)+vL;
            var aL=acctName(r); if(!acctLY[dvL])acctLY[dvL]={}; if(!acctLY[dvL][aL])acctLY[dvL][aL]={};
            acctLY[dvL][aL][lnL+'|'+d.month]=(acctLY[dvL][aL][lnL+'|'+d.month]||0)+vL; } }
      }
      return;
    }
    if(d.year===curY && d.month===curM && d.day>curD) return;
    var seg=classifySeg_(r), meta=SEG_META[seg]; if(!meta) return;
    // DUAL-YEAR semantics of the cumulative reports: rows dated the CURRENT year carry the
    // figure in 'Current Sales Value (SAR)'; rows dated a PREVIOUS year carry it in
    // 'LY. Sales Value (SAR)' (their Current column is 0). Must switch column BY INVOICE YEAR.
    // CUMULATIVE reports use the dual-year convention: prior-year rows carry their
    // figure in the LY column (Current=0). MONTH-TO-DATE snapshots do not - every row
    // in them, whatever its year, carries the figure in Current.
    var v = (d.year===curY || !r._cum)
      ? (parseFloat(String(r['Current Sales Value (SAR)']||'').replace(/,/g,''))||0)
      : (parseFloat(String(r['LY. Sales Value (SAR)']||'').replace(/,/g,''))||0);
    if(!v) return;
    var dv=meta[0], ln=meta[1];
    if(v<0){
      ret1[dv+'|'+ln+'|'+mi]=(ret1[dv+'|'+ln+'|'+mi]||0)+v;
      var ra=acctName(r); retAcc[dv+'|'+ra+'|'+mi]=(retAcc[dv+'|'+ra+'|'+mi]||0)+v;
      var rin=String(r['Invoice #']||'').trim()||'-', rcat=catNo(r)||'-';
      var rk=dv+'|'+ln+'|'+ra+'|'+rin+'|'+rcat+'|'+mi, rb=String(r['Branch Name']||'N/A').trim()||'N/A';
      var it=String(r['Item Description']||'').trim().replace(/&quot;/g,'"').replace(/&amp;/g,'&').slice(0,60);
      var ex=retDet[rk]||(retDet[rk]={v:0,dy:d.day,it:it,br:rb,q:0,po:String(r['Customer Po']||'').trim().slice(0,24)});
      ex.v+=v; ex.q+=parseFloat(String(r['Current Sales Goods']||'').replace(/,/g,''))||0;
    }
    var b=String(r['Branch Name']||'N/A').trim()||'N/A', a=acctName(r);
    var cat5=String(r['Category']||'N/A').trim()||'N/A', catNo5=catNo(r)||'N/A';
    var prod5=String(r['Item Description']||'').trim().replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'); if(!prod5)prod5=catNo5;
    if(prod5.length>66) prod5=prod5.slice(0,63)+'…';
    var pk5=dv+'|'+ln+'|'+cat5+'|'+catNo5, slot5=prodAgg[pk5]||(prodAgg[pk5]={v0:0,v1:0,d:prod5}); slot5.v1+=v;
    var pbk5=dv+'|'+b+'|'+catNo5, slotB5=prodBranch[pbk5]||(prodBranch[pbk5]={v0:0,v1:0,d:prod5}); slotB5.v1+=v;
    var pdk=dv+'|'+catNo5, pd=prodDetail[pdk]||(prodDetail[pdk]={d:prod5,acc:{},mon:{},br:{}});
    (pd.acc[a]=pd.acc[a]||[0,0])[1]+=v; pd.mon[mi]=(pd.mon[mi]||0)+v; (pd.br[b]=pd.br[b]||[0,0])[1]+=v;
    var nk=dv+''+a+''+(catNo(r)||'-')+''+mi; acm[nk]=(acm[nk]||0)+v;
    a1[dv+'|'+ln+'|'+mi]=(a1[dv+'|'+ln+'|'+mi]||0)+v;
    a2[dv+'|'+b+'|'+mi]=(a2[dv+'|'+b+'|'+mi]||0)+v;
    if(!acct[dv])acct[dv]={}; if(!acct[dv][a])acct[dv][a]={t:0,cells:{},br:{}};
    acct[dv][a].t+=v; acct[dv][a].cells[ln+'|'+mi]=(acct[dv][a].cells[ln+'|'+mi]||0)+v; acct[dv][a].br[b]=(acct[dv][a].br[b]||0)+v;
  });

  // a3 (top-60 accounts) + a4 + l3
  var a3=[], keepSets={}, otherLabels={}, l3=[], a4=[];
  Object.keys(acct).forEach(function(dv){
    var ranked=Object.keys(acct[dv]).map(function(a){return [a,acct[dv][a]];}).sort(function(x,y){return Math.abs(y[1].t)-Math.abs(x[1].t);});
    var keep=ranked.slice(0,60), rest=ranked.slice(60), ks={}; keepSets[dv]=ks;
    keep.forEach(function(e){ ks[e[0]]=1; var o=e[1];
      Object.keys(o.cells).forEach(function(k){var p=k.split('|'); a3.push([dv,e[0],p[0],+p[1],Math.round(o.cells[k])]);});
      Object.keys(o.br).forEach(function(bb){ a4.push([dv,e[0],bb,Math.round(o.br[bb])]);}); });
    var other={}, otherBr={};
    rest.forEach(function(e){ var o=e[1];
      Object.keys(o.cells).forEach(function(k){other[k]=(other[k]||0)+o.cells[k];});
      Object.keys(o.br).forEach(function(bb){otherBr[bb]=(otherBr[bb]||0)+o.br[bb];}); });
    var lbl='OTHER ACCOUNTS ('+rest.length+')'; otherLabels[dv]=lbl;
    Object.keys(other).forEach(function(k){var p=k.split('|'); a3.push([dv,lbl,p[0],+p[1],Math.round(other[k])]);});
    Object.keys(otherBr).forEach(function(bb){ a4.push([dv,lbl,bb,Math.round(otherBr[bb])]);});
  });
  Object.keys(acctLY).forEach(function(dv){
    var ks=keepSets[dv]||{}, otherL={};
    Object.keys(acctLY[dv]).forEach(function(a){ var cells=acctLY[dv][a];
      if(ks[a]){ Object.keys(cells).forEach(function(k){var p=k.split('|'); l3.push([dv,a,p[0],+p[1],Math.round(cells[k])]);}); }
      else { Object.keys(cells).forEach(function(k){otherL[k]=(otherL[k]||0)+cells[k];}); } });
    var lblL=otherLabels[dv]||'OTHER ACCOUNTS (LY)';
    Object.keys(otherL).forEach(function(k){var p=k.split('|'); l3.push([dv,lblL,p[0],+p[1],Math.round(otherL[k])]);});
  });

  // a5 / a6 / a7
  var a5=[]; (function(){ var byCat={}; Object.keys(prodAgg).forEach(function(k){var i=k.lastIndexOf('|'); (byCat[k.slice(0,i)]=byCat[k.slice(0,i)]||[]).push([k.slice(i+1),prodAgg[k]]);});
    Object.keys(byCat).forEach(function(gk){var list=byCat[gk]; list.sort(function(x,y){return Math.abs(y[1].v0+y[1].v1)-Math.abs(x[1].v0+x[1].v1);}); var p=gk.split('|');
      list.forEach(function(it){a5.push([p[0],p[1],p[2],it[0],it[1].d,Math.round(it[1].v0),Math.round(it[1].v1)]);});}); })();
  var a6=[]; (function(){ var byBr={}; Object.keys(prodBranch).forEach(function(k){var i=k.lastIndexOf('|'); (byBr[k.slice(0,i)]=byBr[k.slice(0,i)]||[]).push([k.slice(i+1),prodBranch[k]]);});
    Object.keys(byBr).forEach(function(gk){var list=byBr[gk]; list.sort(function(x,y){return Math.abs(y[1].v0+y[1].v1)-Math.abs(x[1].v0+x[1].v1);}); var p=gk.split('|');
      list.forEach(function(it){a6.push([p[0],p[1],it[0],it[1].d,Math.round(it[1].v0),Math.round(it[1].v1)]);});}); })();
  var a7={}; (function(){ var shown={}; a5.forEach(function(rr){if(rr[3]!=='—')shown[rr[0]+'|'+rr[3]]=1;}); a6.forEach(function(rr){shown[rr[0]+'|'+rr[2]]=1;});
    function rank(o){return Object.keys(o).map(function(n){return [n,o[n]];}).sort(function(x,y){return Math.abs(y[1][0]+y[1][1])-Math.abs(x[1][0]+x[1][1]);});}
    Object.keys(shown).forEach(function(key){ var pd=prodDetail[key]; if(!pd)return;
      a7[key]={d:pd.d, acc:rank(pd.acc).slice(0,15).map(function(e){return [e[0],Math.round(e[1][0]),Math.round(e[1][1])];}),
        br:rank(pd.br).slice(0,10).map(function(e){return [e[0],Math.round(e[1][0]),Math.round(e[1][1])];}),
        mon:Object.keys(pd.mon).map(function(mm){return [+mm,Math.round(pd.mon[mm])];})}; }); })();

  // source freshness: per division (from the private report) PLUS a 'Tender' key tracking
  // the tender report itself — tender rows classify to DS/SM by _div, so without this the
  // render's staleness banner would always claim "Tender no data".
  // Source freshness must be keyed by the REPORT a row came from (_code), never by the
  // division it classifies into. Tender rows classify into DS/SM, so keying by division
  // made a fresh tender feed mask a stale 2033/2041 feed and the "stale source" banner
  // silently disappeared while DS was genuinely 11 days behind.
  var FEED_OF={'priv':'BD-Saudi','2039':'MMS (2039)','Tender':'Tender'};
  var srcMax={}; rows.forEach(function(r){
    var k=FEED_OF[r._code]; if(!k) return;
    var d=parseDate_(r['Invoice Date']); if(!d)return; var t=Date.UTC(d.year,d.month,d.day);
    if(!srcMax[k]||t>srcMax[k])srcMax[k]=t;
  });
  Object.keys(srcMax).forEach(function(k){ srcMax[k]=new Date(srcMax[k]).toISOString().slice(0,10); });

  return {
    built:new Date().toISOString(), srcMax:srcMax, curY:curY, curM:curM, curD:curD, bdStartYear:bdStartYear, seq:SEQ,
    a1:Object.keys(a1).map(function(k){var p=k.split('|');return [p[0],p[1],+p[2],Math.round(a1[k])];}),
    a2:Object.keys(a2).map(function(k){var p=k.split('|');return [p[0],p[1],+p[2],Math.round(a2[k])];}),
    a3:a3, a4:a4, a5:a5, a6:a6, a7:a7,
    ret1:Object.keys(ret1).map(function(k){var p=k.split('|');return [p[0],p[1],+p[2],Math.round(ret1[k])];}),
    retDet:(function(){ var arr=Object.keys(retDet).map(function(k){var p=k.split('|'),o=retDet[k];return [p[0],p[1],p[2],p[3],p[4],+p[5],Math.round(o.v),o.dy,o.it,o.br,Math.round(o.q),o.po];});
      /*RDX2 2026-09-14: no per-line cap — the old top-120 slice made the Returns detail table (and its Excel export) sum below the TOTAL RETURNS card. */ arr.sort(function(a,b){return Math.abs(b[6])-Math.abs(a[6]);}); return arr; })(),
    retAcc:/*RDX3 2026-09-14: no per-division top-80 account cap — kept for parity with the uncapped retDet.*/Object.keys(retAcc).map(function(k){var p=k.split('|');return [p[0],p[1],+p[2],Math.round(retAcc[k])];}),
    l1:Object.keys(l1).map(function(k){var p=k.split('|');return [p[0],p[1],+p[2],Math.round(l1[k])];}),
    l3:l3
  };
}

// =====================================================================
// STOCK INGEST — official TamerSC daily stock reports (HTML tables)
//   bdStock      = GPPRR consignment (Whse MG*) by hospital
//   bdSCStock    = local division on-hand (Bus 2041/2033/2039) + aging + warehouses + item detail
//   bdConsign    = consignment cube (GPPRR=MG*, ADVDEL=MC*) by type/div/line/area/account
//   bdIntlStock  = international on-hand (BD-MMS Int + BD-IDS Int), same division shape
// =====================================================================
var BUSDIV = { '2041':'SM', '2033':'DS', '2039':'MMS', 'SM':'SM', 'DS':'DS', 'MMS':'MMS' };

function num_(v){ var n=parseFloat(String(v==null?'':v).replace(/,/g,'').trim()); return isNaN(n)?0:n; }

// latest TamerSC report with this subject -> {text, date}
// NOTE: these stock reports carry NO date header inside the HTML, so the email's
// own date is the authoritative snapshot ("as of"), not today's date.
function stockReportText_(subject){
  var th = GmailApp.search('from:TamerSC@tamergroup.com subject:"'+subject+'" has:attachment newer_than:10d', 0, 1);
  if(!th.length) return null;
  var msgs = th[0].getMessages(); var m = msgs[msgs.length-1];
  var when = m.getDate();
  var atts = m.getAttachments();
  for(var i=0;i<atts.length;i++){ var n=atts[i].getName().toLowerCase();
    if(n.indexOf('.xls')>-1||n.indexOf('.htm')>-1)
      return { text: atts[i].getDataAsString('UTF-8'),
               date: Utilities.formatDate(when, 'Etc/GMT', 'yyyy-MM-dd') }; }
  return null;
}

// stock HTML -> { H:lowercased header, rows:array-of-arrays, snapshot }
function stockTable_(text){
  var tables = text.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
  var best='', maxr=0;
  tables.forEach(function(t){ var n=(t.match(/<tr/gi)||[]).length; if(n>maxr){maxr=n;best=t;} });
  if(!best) return null;
  var trs = best.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  function cells(tr){ var out=[]; var cs=tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi)||[];
    cs.forEach(function(c){ out.push(c.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim()); }); return out; }
  var all=[]; trs.forEach(function(tr){ var c=cells(tr); if(c.length) all.push(c); });
  var hi=-1;
  for(var i=0;i<Math.min(all.length,8);i++){
    var low=all[i].map(function(c){return c.toLowerCase();});
    if(low.indexOf('value')>-1 && (low.indexOf('onhand qty')>-1 || low.indexOf('whse')>-1)){ hi=i; break; }
  }
  if(hi<0) return null;
  var snap=''; var dm=text.match(/Date\s*:\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i); if(dm) snap=dm[1];
  return { H: all[hi].map(function(c){return c.toLowerCase();}), rows: all.slice(hi+1), snapshot: snap };
}

function colFinder_(H){ return function(){ for(var i=0;i<arguments.length;i++){
  var j=H.indexOf(String(arguments[i]).toLowerCase()); if(j>=0) return j; } return -1; }; }

function hospOf_(s){
  s = String(s||'').toUpperCase();
  if(/PSMMC/.test(s)) return 'PSMMC';
  if(/MODA|MINISTRY OF DEF|DEFENSE/.test(s)) return 'MODA (Min. of Defense)';
  if(/KAAUH|PRINCESS NORA|PNU/.test(s)) return 'Princess Nora / KAAUH';
  if(/KFSH/.test(s)) return 'KFSH';
  if(/\bSFH\b|SECURITY FORCE/.test(s)) return 'SFH (Security Forces)';
  if(/JHAH/.test(s)) return 'JHAH';
  if(/KFMC/.test(s)) return 'KFMC';
  if(/STAGING|DOCK/.test(s)) return 'Staging / Dock';
  if(/\bNG\b|NGBD|NG-BD|NATIONAL GUARD|KING KHALID/.test(s)) return 'National Guard';
  return 'Other';
}
function areaOf_(w){ var c=String(w||'').charAt(2);
  return c==='R'?'Riyadh':c==='J'?'Jeddah':c==='K'?'Khobar':(w||'Other'); }


// ---- EXPIRY (shelf life) ------------------------------------------------
// The stock reports are LOT level and carry an "expiry" column, so the same
// item code appears once per lot. Aging (how long WE have held it) and expiry
// (when it stops being sellable) are different things: a lot can arrive today
// and expire in six weeks. Buckets are measured from the report's own snapshot
// date, not from today, so a stale report cannot quietly age its own stock.
// Buckets are DISJOINT: expired | <=90d | 91-180d. "within 6 months" is the
// sum of the last two and is added up at display time.
function expMs_(v){
  var s=String(v==null?'':v).trim(); if(!s) return null;
  var M={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
  var m=s.match(/^(\d{1,2})[-\/\s]([A-Za-z]{3})[-\/\s](\d{2,4})$/);      // 15-JAN-2027
  if(m){ var y=+m[3]; if(y<100)y+=2000; var mo=M[m[2].toUpperCase()];
         if(mo==null) return null; return Date.UTC(y,mo,+m[1]); }
  m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);                                // 2027-01-15
  if(m) return Date.UTC(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);                            // 1/15/2027 (US)
  if(m) return Date.UTC(+m[3],+m[1]-1,+m[2]);
  var t=Date.parse(s); return isNaN(t)?null:t;
}
// snapshot string -> ms; falls back to today when the report carries no date
function asOfMs_(snap){
  var t=expMs_(snap); if(t!=null) return t;
  var n=new Date(); return Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate());
}
var DAY_=86400000;
// 3 and 6 CALENDAR months, not 90/180 days — "expires within three months" is
// how a buyer reads it, and the two differ by a couple of days every quarter.
function addMonths_(ms,n){ var d=new Date(ms);
  var y=d.getUTCFullYear(), m=d.getUTCMonth()+n, day=d.getUTCDate();
  var last=new Date(Date.UTC(y,m+1,0)).getUTCDate();   // clamp Jan 31 + 1m -> Feb 28
  return Date.UTC(y,m,Math.min(day,last)); }
// returns 'expired' | 'e90' (<=3 months) | 'e180' (3-6 months) | '' (none / further out)
function expBucket_(v, asOf){
  var t=expMs_(v); if(t==null) return '';
  if(t<asOf) return 'expired';
  if(t<=addMonths_(asOf,3)) return 'e90';
  if(t<=addMonths_(asOf,6)) return 'e180';
  return '';
}

// accumulate one stock report into a division map (shared by local + international)
function accStockDivs_(T, DV, itemLevel, asOf){
  var H=T.H, C=colFinder_(H);
  var cWh=C('Whse'), cBus=C('Bus'), cAg=C('Aging'), cVal=C('Value'), cQty=C('Onhand Qty'),
      cSub=C('Subinv'), cSn=C('Subinv Name'), cCat=C('Categ'), cScat=C('Subcateg'),
      cCode=C('Item Code'), cDesc=C('Item Desc'), cCatal=C('Item Catalog'),
      cExp=C('Expiry','Expiry Date','Exp Date','Expiration Date'), cLot=C('Lot');
  if(asOf==null) asOf=asOfMs_(T.snapshot);
  function dvo(d){ if(!DV[d]) DV[d]={div:d,onhand:0,fresh:0,d91_180:0,d181_360:0,over360:0,qty:0,
                    expired:0,e90:0,e180:0,expQ:0,e90Q:0,e180Q:0,noExp:0,wh:{},sub:{}}; return DV[d]; }
  T.rows.forEach(function(r){
    if(r.length<=Math.max(cVal,cAg)) return;
    // Round at the source, not per level. finishDivs_ used to round the
    // division total and each item separately, so the item rows added to a
    // riyal or two less than the division headline they belong to and a
    // drill-down could never tie back exactly. Rounding here makes every
    // level sum the same integers.
    var val=Math.round(num_(r[cVal])), ag=num_(r[cAg]), qty=Math.round(cQty>=0?num_(r[cQty]):0);
    if(!val && !qty) return;
    var dv=BUSDIV[String(cBus>=0?(r[cBus]||''):'').trim()]; if(!dv) return;
    var wh=cWh>=0?(r[cWh]||''):'';
    var fresh=ag<=90?val:0, d91=(ag>90&&ag<=180)?val:0, d181=(ag>180&&ag<=360)?val:0, over=ag>360?val:0;
    var ebk=cExp>=0?expBucket_(r[cExp], asOf):'';
    var eMs=cExp>=0?expMs_(r[cExp]):null;
    var d=dvo(dv);
    if(cExp>=0&&eMs==null) d.noExp+=val;
    if(ebk==='expired'){d.expired+=val;d.expQ+=qty;}
    else if(ebk==='e90'){d.e90+=val;d.e90Q+=qty;}
    else if(ebk==='e180'){d.e180+=val;d.e180Q+=qty;}
    d.onhand+=val; d.fresh+=fresh; d.d91_180+=d91; d.d181_360+=d181; d.over360+=over; d.qty+=qty;
    if(!d.wh[wh]) d.wh[wh]={whse:wh,value:0,fresh:0,d181_360:0,over360:0};
    var w=d.wh[wh]; w.value+=val; w.fresh+=fresh; w.d181_360+=d181; w.over360+=over;
    if(itemLevel){
      var sc=String((cScat>=0?r[cScat]:'')||(cCat>=0?r[cCat]:'')||'OTHER').trim()||'OTHER';
      var code=String((cCode>=0?r[cCode]:'')||'-').trim()||'-';
      if(!d.sub[sc]) d.sub[sc]={sub:sc,value:0,qty:0,over360:0,expired:0,e90:0,e180:0,items:{}};
      var S=d.sub[sc]; S.value+=val; S.qty+=qty; S.over360+=over;
      if(ebk==='expired')S.expired+=val; else if(ebk==='e90')S.e90+=val; else if(ebk==='e180')S.e180+=val;
      if(!S.items[code]) S.items[code]={code:code,desc:'',cat:'',value:0,qty:0,fresh:0,d91_180:0,d181_360:0,over360:0,
                                        expired:0,e90:0,e180:0,expQ:0,e90Q:0,e180Q:0,expNext:null,lots:0};
      var I=S.items[code]; I.value+=val; I.qty+=qty; I.over360+=over;
      if(ebk==='expired'){I.expired+=val;I.expQ+=qty;}
      else if(ebk==='e90'){I.e90+=val;I.e90Q+=qty;}
      else if(ebk==='e180'){I.e180+=val;I.e180Q+=qty;}
      // nearest expiry that still has stock on it — what a buyer actually needs
      if(eMs!=null&&(val>0||qty>0)&&(I.expNext==null||eMs<I.expNext)) I.expNext=eMs;
      if(cLot>=0&&String(r[cLot]||'').trim()) I.lots++;
      I.fresh+=fresh; I.d91_180+=d91; I.d181_360+=d181;
      if(!I.desc && cDesc>=0) I.desc=String(r[cDesc]||'').slice(0,50);
      if(!I.cat && cCatal>=0) I.cat=String(r[cCatal]||'').trim().toUpperCase().slice(0,24);
    }
  });
}

function ymd_(ms){ if(ms==null) return ''; var d=new Date(ms);
  return d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2); }
function finishDivs_(DV, itemLevel){
  var R=Math.round;
  return Object.keys(DV).map(function(k){ var d=DV[k];
    var o={ div:d.div, onhand:R(d.onhand), fresh:R(d.fresh), d91_180:R(d.d91_180),
      d181_360:R(d.d181_360), over360:R(d.over360), qty:R(d.qty),
      expired:R(d.expired||0), e90:R(d.e90||0), e180:R(d.e180||0),
      expQ:R(d.expQ||0), e90Q:R(d.e90Q||0), e180Q:R(d.e180Q||0), noExp:R(d.noExp||0),
      warehouses:Object.keys(d.wh).map(function(wk){ var w=d.wh[wk];
        return {whse:w.whse, value:R(w.value), fresh:R(w.fresh), d181_360:R(w.d181_360), over360:R(w.over360)};
      }).sort(function(a,b){return b.value-a.value;}) };
    if(itemLevel){
      o.subcats = Object.keys(d.sub).map(function(sk){ var s=d.sub[sk];
        return { sub:s.sub, value:R(s.value), qty:R(s.qty), over360:R(s.over360),
          expired:R(s.expired||0), e90:R(s.e90||0), e180:R(s.e180||0),
          items:Object.keys(s.items).map(function(ik){ var it=s.items[ik];
            return {code:it.code, desc:it.desc, cat:it.cat||'', value:R(it.value), qty:R(it.qty), fresh:R(it.fresh||0), d91_180:R(it.d91_180||0), d181_360:R(it.d181_360||0), over360:R(it.over360),
              expired:R(it.expired||0), e90:R(it.e90||0), e180:R(it.e180||0),
              expQ:R(it.expQ||0), e90Q:R(it.e90Q||0), e180Q:R(it.e180Q||0),
              expNext:ymd_(it.expNext), lots:it.lots||0};
          }).sort(function(a,b){return b.value-a.value;}) };
      }).sort(function(a,b){return b.value-a.value;});
    }
    return o;
  }).sort(function(a,b){return b.onhand-a.onhand;});
}

// GPPRR-by-hospital + consignment cube, from the LOCAL private stock report
function buildGpprrAndConsign_(T){
  var H=T.H, C=colFinder_(H);
  var cWh=C('Whse'), cBus=C('Bus'), cAg=C('Aging'), cVal=C('Value'), cQty=C('Onhand Qty'),
      cSub=C('Subinv'), cSn=C('Subinv Name'), cCat=C('Categ');
  var HM={}, gtot=0, CN={};
  T.rows.forEach(function(r){
    if(r.length<=Math.max(cVal,cAg)) return;
    var wh=String(cWh>=0?(r[cWh]||''):''), val=num_(r[cVal]), ag=num_(r[cAg]), qty=cQty>=0?num_(r[cQty]):0;
    var fresh=ag<=90?val:0, d91=(ag>90&&ag<=180)?val:0, d181=(ag>180&&ag<=360)?val:0, over=ag>360?val:0;
    // --- GPPRR consignment by hospital (MG* warehouses only) ---
    if(/^MG[RJK]$/.test(wh) && (val||qty)){
      var sub=cSub>=0?(r[cSub]||''):'', nm=cSn>=0?(r[cSn]||''):'';
      var h=hospOf_(sub+' '+nm);
      if(!HM[h]) HM[h]={name:h,stock:0,fresh:0,d91_180:0,d181_360:0,over360:0,subs:{}};
      var o=HM[h];
      o.stock+=val; o.fresh+=fresh; o.d91_180+=d91; o.d181_360+=d181; o.over360+=over; gtot+=val;
      if(!o.subs[sub]) o.subs[sub]={subinv:sub,loc:nm,whse:wh,qty:0,value:0,d181_360:0,over360:0};
      var ss=o.subs[sub]; ss.qty+=qty; ss.value+=val; ss.d181_360+=d181; ss.over360+=over;
    }
    // --- consignment cube (GPPRR = MG*, ADVDEL = MC*) ---
    var type = /^MG[A-Z]?/.test(wh) ? 'GPPRR' : (/^MC[A-Z]?/.test(wh) ? 'ADVDEL' : '');
    if(type && val){
      var div=BUSDIV[String(cBus>=0?(r[cBus]||''):'').trim()]||'?';
      var line=String(cCat>=0?(r[cCat]||''):'')||'Other';
      var acct=String((cSn>=0?r[cSn]:'')||(cSub>=0?r[cSub]:'')||'Unknown');
      var key=[type,div,line,areaOf_(wh),acct].join('|');
      if(!CN[key]) CN[key]={type:type,div:div,line:line,area:areaOf_(wh),acct:acct,value:0,fresh:0,d91_180:0,d181_360:0,over360:0};
      var cc=CN[key]; cc.value+=val;
      if(ag<=90) cc.fresh+=val; else if(ag<=180) cc.d91_180+=val; else if(ag<=360) cc.d181_360+=val; else cc.over360+=val;
    }
  });
  var R=Math.round;
  var hospitals=Object.keys(HM).map(function(k){ var o=HM[k]; return {
    name:o.name, stock:R(o.stock), fresh:R(o.fresh), d91_180:R(o.d91_180), d181_360:R(o.d181_360), over360:R(o.over360),
    subinvs:Object.keys(o.subs).map(function(sk){ var s=o.subs[sk];
      return {subinv:s.subinv, loc:s.loc, whse:s.whse, qty:R(s.qty), value:R(s.value), d181_360:R(s.d181_360), over360:R(s.over360)};
    }).sort(function(a,b){return b.value-a.value;})
  }; }).sort(function(a,b){return b.stock-a.stock;});
  var crows=Object.keys(CN).map(function(k){ var o=CN[k];
    return [o.type,o.div,o.line,o.area,o.acct,R(o.value),R(o.fresh),R(o.d91_180),R(o.d181_360),R(o.over360)];
  }).sort(function(a,b){return b[5]-a[5];});
  return { gpprrTotal:R(gtot), hospitals:hospitals, crows:crows };
}

// main stock entry: returns {bdStock, bdSCStock, bdConsign, bdIntlStock}
function buildStock_(now){
  var today=(now||new Date()).toISOString().slice(0,10);
  var out={ bdStock:null, bdSCStock:null, bdConsign:null, bdIntlStock:null };
  var built=new Date().toISOString();

  // ---- local: BD Saudi Private Stock report ----
  var lt=stockReportText_('BD Saudi Private Stock report');
  if(lt){
    var T=stockTable_(lt.text);
    if(T){
      var snap=T.snapshot||lt.date||today;
      var DV={}; accStockDivs_(T, DV, true, asOfMs_(snap));
      var divs=finishDivs_(DV, true);
      out.bdSCStock={ built:built, snapshot:snap, src:'TamerSC daily',
        total:divs.reduce(function(s,d){return s+d.onhand;},0), divisions:divs };
      var g=buildGpprrAndConsign_(T);
      out.bdStock={ built:built, snapshot:snap, src:'TamerSC daily',
        total:g.gpprrTotal, hospitals:g.hospitals };
      out.bdConsign={ built:built, snapshot:snap, src:'TamerSC daily',
        total:g.crows.reduce(function(s,r){return s+r[5];},0), rows:g.crows };
    }
  }

  // ---- international: BD-MMS Int + BD-IDS Int ----
  var IDV={}, isnap='';
  ['BD-MMS Int','BD-IDS Int'].forEach(function(subj){
    var t=stockReportText_(subj); if(!t) return;
    var TI=stockTable_(t.text); if(!TI) return;
    if(!isnap) isnap=TI.snapshot||t.date;
    accStockDivs_(TI, IDV, true, asOfMs_(TI.snapshot||t.date));
  });
  if(Object.keys(IDV).length){
    var idivs=finishDivs_(IDV, true);
    out.bdIntlStock={ built:built, snapshot:isnap||today, src:'TamerSC Int reports',
      total:idivs.reduce(function(s,d){return s+d.onhand;},0), divisions:idivs };
  }
  return out;
}

// ---- storage: JSON blob in a private Drive file (no 50K cell limit) ----
var ENGINE_FILE = 'TAMER-Engine-Data.json';
function writeStore_(o){ var s=JSON.stringify(o); var it=DriveApp.getFilesByName(ENGINE_FILE);
  while(it.hasNext()) it.next().setTrashed(true); DriveApp.createFile(ENGINE_FILE, s, 'application/json'); }
function getAggregates(){ var it=DriveApp.getFilesByName(ENGINE_FILE);
  return it.hasNext() ? JSON.parse(it.next().getBlob().getDataAsString()) : null; }

// ---- entry point (daily trigger) ----
function runDaily(){
  var now=new Date();
  var rows=gatherSalesRows_(now); var bd=buildAggregates_(rows, now);
  var st={};
  try { st=buildStock_(now)||{}; } catch(err){ Logger.log('buildStock_ FAILED (sales kept): '+err); }
  var store={ global:{ bdDash:bd,
    bdStock:st.bdStock||null, bdSCStock:st.bdSCStock||null,
    bdConsign:st.bdConsign||null, bdIntlStock:st.bdIntlStock||null } };
  writeStore_(store);
  Logger.log('runDaily: rows='+rows.length+' a1='+bd.a1.length+' built='+bd.built
    +' | scStock='+(st.bdSCStock?st.bdSCStock.total:'none')
    +' gpprr='+(st.bdStock?st.bdStock.total:'none')
    +' consign='+(st.bdConsign?st.bdConsign.rows.length+'rows':'none')
    +' intl='+(st.bdIntlStock?st.bdIntlStock.total:'none'));
  return store;
}

function installTrigger(){ ScriptApp.getProjectTriggers().forEach(function(t){ if(t.getHandlerFunction()==='runDaily') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runDaily').timeBased().atHour(4).everyDays(1).create(); }
