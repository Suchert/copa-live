(function () {
  "use strict";
  var EV = window.__copaEV || 1012;
  var EVENT_URL = "https://martialmatch.com/pl/events/1012-xxii-mistrzostwa-polski-bjj/current-matches";
  var OV = "copa-live-ov";
  var mp = location.pathname.match(/\/[a-z]{2}\/events\/(\d+)[^/]*/);
  var EVPATH = mp && +mp[1] === EV ? mp[0] : (EV === 1012 ? "/pl/events/1012-xxii-mistrzostwa-polski-bjj" : "/pl/events/" + EV);
  var SK = "copa-mp-bjj-2026-stars";

  // Skrypt musi działać na stronie martialmatch.com – tylko tam przeglądarka pozwala czytać dane.
  if (!/(^|\.)martialmatch\.com$/.test(location.hostname)) { location.href = EVENT_URL; return; }

  // Drugie kliknięcie zakładki zamyka nakładkę.
  var old = document.getElementById(OV);
  if (old) { old.remove(); clearInterval(window.__copaTimer); clearInterval(window.__copaTick); clearTimeout(window.__copaMore); return; }

  // ---------- pomocnicze ----------
  var UNITS = [[/unity/, "Unity Team – Copacabana (Warszawa)"], [/ursyn/, "Warszawa – Ursynów"], [/suwalk/, "Suwałki"], [/lubart/, "Lubartów (MKS)"], [/ostrowiec/, "Ostrowiec Świętokrzyski"], [/swiecie/, "Świecie"], [/inowroc/, "Inowrocław"], [/bydgoszcz/, "Bydgoszcz"], [/torun/, "Toruń"], [/kielce/, "Kielce"], [/lublin/, "Lublin"], [/czestoch/, "Częstochowa"], [/konin/, "Konin"], [/tarnow/, "Tarnów"], [/poznan|wielkopol/, "Poznań"], [/lodz/, "Łódź"], [/bialystok/, "Białystok"], [/pruszk/, "Pruszków"], [/warszaw|warsaw/, "Warszawa (Mokotów)"]];
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l"); }
  function unitOf(a, b) { var t = norm(a + " " + b); for (var i = 0; i < UNITS.length; i++) if (UNITS[i][0].test(t)) return UNITS[i][1]; return String(a || "").trim(); }
  var CLUB = window.__copaClub ? new RegExp(window.__copaClub, "i") : /copacabana/i;
  function isCopa(p) { return p && CLUB.test((p.academy || "") + " " + (p.branch || "")); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // Kategoria w tej samej postaci co w pliku HTML (żeby kody ★ były zgodne).
  function ourCat(c) {
    c = String(c).replace("(14-15lat)", "(14-15 lat)").replace("(11 - 12 lat)", "(11-12 lat)").replace("(8 - 9 lat)", "(8-9 lat)")
      .replace("; boys;", "; chłopcy;").replace("; girls;", "; dziewczęta;").replace("brązowy/czarny", "brown/black");
    if (c === "Master Absoluto Niebieskie Pasy") c = "Master Absoluto; blue";
    if (c === "Master Absoluto Purpurowe Pasy") c = "Master Absoluto; purple";
    return c;
  }
  var PL = { white: "biały", blue: "niebieski", purple: "purpurowy", brown: "brązowy", black: "czarny", "brown/black": "brązowy/czarny" };
  function catPl(c) { return c.split(";").map(function (p, i) { p = p.trim(); return i === 1 && PL[p] ? PL[p] : p; }).join(" · "); }
  function hash5(s) { var h = 0x811c9dc5; for (var ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36).padStart(7, "0").slice(-5); }
  // Czas w systemie jest w UTC – pokazujemy go w czasie polskim.
  function toDate(s) { return new Date(String(s).replace(" ", "T") + "Z"); }
  function hm(d) { return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }); }
  function dayName(d) { var n = d.toLocaleDateString("pl-PL", { weekday: "short", timeZone: "Europe/Warsaw" }); return n.charAt(0).toUpperCase() + n.slice(1); }
  var ROUND = { final: "finał", semi_final: "półfinał", quarter_final: "ćwierćfinał", repechage: "repasaż", third_place: "o 3. miejsce" };
  var DONE = { out: 1, g1: 1, g2: 1, g3: 1, past: 1, fin: 1 };
  function score(h) {
    if (/submission/i.test(h.finish)) return " (poddanie)";
    var a = String(h.myPts).split(":"), b = String(h.opPts).split(":");
    if (a[0] === "" || b[0] === "" || a[0] == null) return "";
    return " (" + a[0] + ":" + b[0] + (a[0] === b[0] && a[1] != null ? ", przew. " + a[1] + ":" + b[1] : "") + ")";
  }
  function roundPl(r) { return ROUND[r] || r || ""; }
  function pname(c) { return c && c.firstName && c.firstName.indexOf("-- awaiting") !== 0 ? (c.firstName.trim() + " " + (c.lastName || "").trim()) : ""; }
  function sameComp(c, p) { return c && ((c.publicId && c.publicId === p.publicId)); }
  function getJSON(u) { return fetch(u, { cache: "no-store", credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error(u + " → " + r.status); return r.json(); }); }

  var stars = new Set();
  try { stars = new Set(JSON.parse(localStorage.getItem(SK) || "[]")); } catch (e) {}
  function saveStars() { try { localStorage.setItem(SK, JSON.stringify(Array.from(stars))); } catch (e) {} }

  // ---------- interfejs ----------
  var css = "#OV{position:fixed;inset:0;z-index:2147483647;background:#f6f7f9;color:#14181f;font:14px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}" +
    "#OV *{box-sizing:border-box}#OV .hd{position:sticky;top:0;z-index:2;background:#0b7a5a;color:#fff;padding:10px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
    "#OV .hd b{font-size:16px;flex:1;min-width:150px}#OV .hd small{opacity:.85;width:100%;font-size:12px}#OV button{font:inherit;font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid #d0d5dd;background:#fff;color:#14181f;cursor:pointer}" +
    "#OV .hd button{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.15);color:#fff}#OV .ctl{display:flex;gap:8px;flex-wrap:wrap;padding:10px 12px;background:#fff;border-bottom:1px solid #e4e7ec}" +
    "#OV input[type=search],#OV select{font:inherit;padding:7px 8px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#14181f;min-width:0;flex:1 1 140px}#OV label.ck{display:flex;align-items:center;gap:5px;font-size:13px}" +
    "#OV .seg{display:flex;border:1px solid #0b7a5a;border-radius:8px;overflow:hidden}#OV .seg button{border:0;border-radius:0;background:#fff;color:#0b7a5a}#OV .seg button.on{background:#0b7a5a;color:#fff}" +
    "#OV .wrap{padding:10px 12px 40px;max-width:900px;margin:0 auto}#OV .card{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:10px 12px;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:start}" +
    "#OV .card.now{border:2px solid #d92d20;background:#fff6f5}#OV .card.soon{border:2px solid #f79009}#OV .card.out{opacity:.55}#OV .st{border:0;background:none;font-size:22px;line-height:1;padding:0;color:#d0d5dd}#OV .st.on{color:#d99a00}" +
    "#OV .nm{font-weight:700}#OV .un{color:#667085;font-size:12px}#OV .tm{text-align:right;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}#OV .tm small{display:block;font-weight:400;color:#667085;font-size:12px}" +
    "#OV .mt{display:inline-block;padding:1px 8px;border-radius:999px;background:#e7f5ef;color:#0b7a5a;font-weight:700}#OV .ln{grid-column:2/4;font-size:13px;color:#344054}#OV .ln b{color:#14181f}" +
    "#OV .tag{display:inline-block;font-size:11px;padding:1px 6px;border-radius:6px;margin:2px 4px 0 0;background:#f2f4f7;color:#344054}#OV .tag.w{background:#e7f5ef;color:#0b5a42}#OV .tag.l{background:#fee4e2;color:#912018}#OV .tag.now{background:#d92d20;color:#fff;font-weight:700}" +
    "#OV h3{font-size:13px;color:#667085;text-transform:uppercase;letter-spacing:.04em;margin:14px 2px 6px}#OV .msg{padding:10px 12px;border-radius:10px;background:#fff;border:1px dashed #d0d5dd;color:#667085}#OV .err{background:#fee4e2;color:#912018;border-color:#fda29b}" +
    "#OV .code{display:none;padding:10px 12px;background:#fff;border-bottom:1px solid #e4e7ec}#OV .code textarea{width:100%;font:12px ui-monospace,Menlo,monospace;padding:6px;border:1px solid #d0d5dd;border-radius:8px}#OV .code.open{display:block}#OV a.bl{font-size:12px;color:#0b7a5a;white-space:nowrap}#OV .msg.warn{background:#fff4e5;border:2px solid #f79009;color:#7a2e0e;margin-bottom:10px;line-height:1.5}#OV .card.conf{box-shadow:inset 4px 0 0 #f79009}#OV .tag.cf{background:#fff4e5;color:#7a2e0e;font-weight:700}";
  var ov = document.createElement("div"); ov.id = OV;
  ov.innerHTML = "<style>" + css.replace(/#OV/g, "#" + OV) + "</style>" +
    "<div class='hd'><b>Copacabana · na żywo</b><button data-a='ref'>Odśwież</button><button data-a='code'>★ kod</button><button data-a='close'>Zamknij ✕</button><small id='cl-status'>Ładowanie…</small></div>" +
    "<div class='ctl'><div class='seg'><button data-v='mine'>Moi ★</button><button data-v='all' class='on'>Wszyscy</button></div>" +
    "<input type='search' id='cl-q' placeholder='Szukaj: nazwisko, mata, kategoria…'><select id='cl-unit'><option value=''>Wszystkie jednostki</option></select>" +
    "<label class='ck'><input type='checkbox' id='cl-hide' checked> ukryj zakończone (wyniki)</label><label class='ck'><input type='checkbox' id='cl-auto' checked> auto co 60 s</label></div>" +
    "<div class='code' id='cl-code'><div style='font-size:13px;color:#667085;margin-bottom:6px'>Kod ★ jest zgodny z plikiem HTML. Wklej kod, żeby wczytać gwiazdki, albo skopiuj swój.</div><textarea id='cl-codetxt' rows='3'></textarea>" +
    "<div style='display:flex;gap:6px;margin-top:6px;flex-wrap:wrap'><button data-a='cin'>Wczytaj (zastąp)</button><button data-a='cadd'>Dodaj do obecnych</button><button data-a='cout'>Pokaż mój kod</button><span id='cl-cmsg' style='font-size:13px;color:#0b7a5a;align-self:center'></span></div></div>" +
    "<div class='wrap' id='cl-list'><div class='msg'>Pobieram dane z MartialMatch…</div></div>";
  document.body.appendChild(ov);
  function $(id) { return ov.querySelector("#" + id); }

  var view = "all", D = null, loading = false, lastOk = null, RAW = null;
  var MORE = false;
  var BR = {}; // pamięć drabinek: cid -> {b: dane, t: czas pobrania, fin: kategoria zakończona}

  // ---------- dane ----------
  function load() {
    if (loading) return; loading = true;
    $("cl-status").textContent = "Pobieram dane…";
    var S, L;
    Promise.all([getJSON("/api/events/" + EV + "/schedules?sharing=%7B%7D"), getJSON("/api/events/" + EV + "/starting-lists/public")])
      .then(function (r) {
        S = r[0]; L = r[1];
        var act = (S.schedules || []).find(function (s) { return s.id === S.activeScheduleId; }) || S.schedules[0];
        var ids = act.mats.map(function (m) { return m.id; }).join(",");
        return getJSON("/api/public/events/" + EV + "/fights?matIds=" + ids).then(function (F) { return { S: S, L: L, F: F, act: act }; });
      })
      .then(function (d) { RAW = d; return loadBrackets(d); })
      .then(function () { D = build(RAW); lastOk = new Date(); render(); })
      .catch(function (e) { $("cl-status").textContent = "Błąd pobierania – spróbuję ponownie. (" + e.message + ")"; if (!D) $("cl-list").innerHTML = "<div class='msg err'>Nie udało się pobrać danych: " + esc(e.message) + "</div>"; })
      .then(function () { loading = false; });
  }

  // Wyniki rozegranych walk są tylko w drabinkach – lista walk zawiera wyłącznie walki nierozegrane.
  // Pobieramy drabinki kategorii Copacabany, które już się zaczęły (dzień aktywny) albo są z poprzedniego dnia (tylko ★).
  function loadBrackets(d) {
    var now = Date.now(), info = catInfo(d), pend = pendingPids(d), need = [], hide = $("cl-hide").checked;
    d.L.categories.forEach(function (c) {
      var copa = c.competitors.filter(function (p) { return isCopa(p) && !p.isDisqualifiedForNoPayment; });
      if (!copa.length) return;
      var ci = info[c.parameterId]; if (!ci) return;
      var cache = BR[c.parameterId];
      // pobieramy ponownie tylko, gdy w kategorii przybyło rozegranych walk (albo dawno nie sprawdzaliśmy)
      if (cache && (cache.fin || (cache.done === ci.done && now - cache.t < 180000))) return;
      var anyStar = copa.some(function (p) { return stars.has(keyOf(p, c.category)); });
      var noPending = copa.some(function (p) { return !pend[p.publicId]; });
      if (ci.active) {
        if (!(ci.done > 0 || now >= ci.start)) return;
        if (noPending || (anyStar && ci.done > 0)) need.push({ cid: c.parameterId, pri: anyStar ? 0 : 1 });
      } else if (ci.end < now && (anyStar || (view === "all" && !hide))) need.push({ cid: c.parameterId, pri: anyStar ? 0 : 2 });
    });
    need.sort(function (x, y) { return x.pri - y.pri; });
    var todo = need.slice(0, 25), backlog = need.length - todo.length, stop = false;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function one(cid, retry) {
      return fetch("/api/events/" + EV + "/results/public/bracket/" + cid, { cache: "no-store", credentials: "same-origin" }).then(function (r) {
        if (r.status === 429) { if (retry) return wait(1500).then(function () { return one(cid, false); }); stop = true; return; }
        if (!r.ok) return;
        return r.json().then(function (b) { var ci = info[cid]; BR[cid] = { b: b, t: Date.now(), done: ci ? ci.done : 0, fin: !ci || !ci.active || (ci.total > 0 && ci.done >= ci.total) }; });
      }).catch(function () {});
    }
    var chain = Promise.resolve();
    todo.forEach(function (x) { chain = chain.then(function () { if (!stop) return one(x.cid, true).then(function () { return wait(250); }); }); });
    return chain.then(function () {
      MORE = backlog > 0 || stop;
      // zaległe drabinki: dociągnij za chwilę, nie czekając pełnej minuty
      if (MORE) { clearTimeout(window.__copaMore); window.__copaMore = setTimeout(function () { if (document.getElementById(OV)) load(); }, 8000); }
    });
  }
  function catInfo(d) {
    var info = {};
    d.S.schedules.forEach(function (s) {
      s.mats.forEach(function (m) {
        m.categories.forEach(function (c) {
          var x = info[c.id] || (info[c.id] = { active: s.id === d.act.id, done: 0, total: 0, start: Infinity, end: 0 });
          x.done += c.doneFights || 0; x.total += c.totalFights || 0;
          x.start = Math.min(x.start, toDate(c.scheduledCategoryTime.start).getTime()); x.end = Math.max(x.end, toDate(c.scheduledCategoryTime.end).getTime());
        });
      });
    });
    return info;
  }
  function pendingPids(d) {
    var m = {};
    (d.F.result || []).forEach(function (x) { var f = x.publicFight; [f.firstCompetitor, f.secondCompetitor].forEach(function (c) { if (c && c.publicId) m[c.publicId] = 1; }); });
    return m;
  }
  function keyOf(p, cat) { return p.firstName.trim() + "|" + p.lastName.trim() + "|" + ourCat(cat); }
  function roundKey(n) { return n ? (n.translationKey || n.label || "") : ""; }
  // Walki zawodnika w drabince (w kolejności rund).
  function bracketGames(b, pid) {
    var out = [];
    (b.results || []).forEach(function (grp) {
      (grp || []).forEach(function (rd) {
        (rd.games || []).forEach(function (g) {
          var me = g.player1 && g.player1.data && g.player1.data.publicId === pid ? g.player1 : g.player2 && g.player2.data && g.player2.data.publicId === pid ? g.player2 : null;
          if (!me) return;
          var op = me === g.player1 ? g.player2 : g.player1;
          var res = me.winner === true ? "w" : me.winner === false ? "l" : "";
          var bye = !op || op.id === 0 || (op.data && /BYE/.test(op.data.firstName || ""));
          out.push({ round: roundKey(rd.name), res: res, bye: bye, opName: op && op.data ? pname(op.data) : "", myPts: me.points || "", opPts: op ? op.points || "" : "", finish: g.result && g.result.fightFinishType || "" });
        });
      });
    });
    return out;
  }

  function build(d) {
    var matName = {}, segs = {}, info = catInfo(d), now = Date.now();
    d.S.schedules.forEach(function (s) {
      s.mats.forEach(function (m) {
        matName[m.id] = m.name;
        m.categories.forEach(function (c) { (segs[c.id] = segs[c.id] || []).push({ day: s.name, mat: m.name.replace("mata ", ""), start: toDate(c.scheduledCategoryTime.start), end: toDate(c.scheduledCategoryTime.end) }); });
      });
    });
    var fights = (d.F.result || []).map(function (x) { var f = x.publicFight; f.t = toDate(x.startTime); return f; });
    var q = d.F.fightQueueStatuses || {};
    var byMat = {};
    fights.forEach(function (f) { (byMat[f.matId] = byMat[f.matId] || []).push(f); });
    var curNo = {};
    Object.keys(byMat).forEach(function (m) {
      byMat[m].sort(function (a, b) { return a.fightNumber - b.fightNumber; });
      var st = q[m], cur = st && st.fightId ? byMat[m].find(function (f) { return f.id === st.fightId; }) : null;
      curNo[m] = cur ? { no: cur.fightNumber, id: cur.id } : null;
    });
    var starts = [], unitSet = {};
    d.L.categories.forEach(function (c) {
      c.competitors.forEach(function (p) {
        if (!isCopa(p) || p.isDisqualifiedForNoPayment) return;
        var fn = p.firstName.trim(), ln = p.lastName.trim(), oc = ourCat(c.category), ci = info[c.parameterId];
        var mine = fights.filter(function (f) { return f.parameterId === c.parameterId && (sameComp(f.firstCompetitor, p) || sameComp(f.secondCompetitor, p)); });
        mine.sort(function (a, b) { return a.t - b.t || a.fightNumber - b.fightNumber; });
        var next = null;
        if (mine.length) { var f0 = mine[0]; next = { f: f0, op: sameComp(f0.firstCompetitor, p) ? f0.secondCompetitor : f0.firstCompetitor }; }
        var br = BR[c.parameterId], games = br ? bracketGames(br.b, p.publicId) : [];
        var played = games.filter(function (g) { return g.res && !g.bye; });
        var open = games.filter(function (g) { return !g.res; });
        var s = { key: fn + "|" + ln + "|" + oc, fn: fn, ln: ln, name: fn + " " + ln, unit: unitOf(p.academy, p.branch), cat: catPl(oc), cid: c.parameterId, hist: played, next: next, segs: segs[c.parameterId] || [], sort: Infinity, state: "plan" };
        if (next) {
          var f = next.f, cur = curNo[f.matId];
          s.mat = (matName[f.matId] || "").replace("mata ", "");
          s.ahead = cur ? f.fightNumber - cur.no : null;
          s.isNow = !!(cur && cur.id === f.id);
          s.state = s.isNow ? "now" : "next"; s.sort = f.t.getTime();
        } else if (br && played.length && !open.length) {
          var last = played[played.length - 1], type = br.b.type;
          var inFinal = played.filter(function (g) { return g.round === "final"; })[0];
          if (type !== 1 && type !== 2) s.state = "fin"; // np. „każdy z każdym” – miejsce sprawdza się w drabince
          else if (inFinal) s.state = inFinal.res === "w" ? "g1" : "g2";
          else if (last.res === "l" && (last.round === "semi_final" || (type !== 1 && (br.b.totalCompetitors || 0) <= 3))) s.state = "g3";
          else if (last.res === "l") s.state = "out";
          else s.state = "wait";
          s.sort = s.state === "wait" ? 2.5e12 : 9e15;
        } else if (br && (played.length || open.length) && ci && ci.active) { s.state = "wait"; s.sort = 2.5e12; }
        else if (ci && !ci.active && ci.end < now) { s.state = "past"; s.sort = 9.5e15; }
        else if (ci && ci.active && now >= ci.start && !br) { s.state = "check"; s.sort = 8.5e15; }
        else if (s.segs.length) { s.sort = s.segs[0].start.getTime() + 1e12; }
        unitSet[s.unit] = 1;
        starts.push(s);
      });
    });
    return { starts: starts, units: Object.keys(unitSet).sort(function (a, b) { return a.localeCompare(b, "pl"); }), actDay: d.act.name, nFights: fights.length };
  }

  // Konflikty mat: dwie najbliższe walki zawodników z ★ na różnych matach w odstępie < CONF_MIN minut.
  var CONF_MIN = 10;
  function conflicts() {
    var list = D.starts.filter(function (s) { return stars.has(s.key) && (s.state === "now" || s.state === "next"); });
    var map = {}, pairs = [];
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
      var a = list[i], b = list[j];
      if (a.mat === b.mat) continue;
      var dt = Math.abs(a.next.f.t - b.next.f.t) / 60000;
      if (dt < CONF_MIN || (a.isNow && b.isNow)) {
        pairs.push([a, b]);
        (map[a.key] = map[a.key] || []).push(b); (map[b.key] = map[b.key] || []).push(a);
      }
    }
    pairs.sort(function (x, y) { return Math.min(x[0].sort, x[1].sort) - Math.min(y[0].sort, y[1].sort); });
    return { map: map, pairs: pairs };
  }
  function confWho(s) { return esc(s.name) + " (mata " + esc(s.mat) + ", " + (s.isNow ? "teraz" : hm(s.next.f.t)) + ")"; }

  // ---------- widok ----------
  function render() {
    if (!D) return;
    var sel = $("cl-unit"), cur = sel.value;
    if (sel.options.length <= 1) D.units.forEach(function (u) { var o = document.createElement("option"); o.value = u; o.textContent = u; sel.appendChild(o); });
    sel.value = cur;
    var qv = norm($("cl-q").value.trim()), unit = sel.value, hide = $("cl-hide").checked, now = Date.now();
    var rows = D.starts.filter(function (s) {
      if (view === "mine" && !stars.has(s.key)) return false;
      if (unit && s.unit !== unit) return false;
      if (hide && DONE[s.state]) return false;
      if (qv && norm([s.name, s.unit, s.cat, s.mat ? "mata " + s.mat : "", s.next && pname(s.next.op)].join(" ")).indexOf(qv) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.sort - b.sort || a.ln.localeCompare(b.ln, "pl"); });
    var nStars = D.starts.filter(function (s) { return stars.has(s.key); }).length;
    $("cl-status").textContent = "Dane z " + hm(lastOk) + ":" + String(lastOk.getSeconds()).padStart(2, "0") + " · dzień w systemie: " + D.actDay + " · ★ " + nStars + " · godziny w czasie polskim" + (MORE ? " · wczytuję wyniki…" : "");
    var CF = conflicts();
    var banner = CF.pairs.length ? "<div class='msg warn'><b>⚠ Konflikt mat</b> – w tym samym czasie (różnica &lt; " + CONF_MIN + " min):" +
      CF.pairs.slice(0, 6).map(function (p) { return "<div>• " + confWho(p[0]) + " i " + confWho(p[1]) + "</div>"; }).join("") +
      (CF.pairs.length > 6 ? "<div>…i jeszcze " + (CF.pairs.length - 6) + "</div>" : "") + "</div>" : "";
    var html = rows.map(function (s) {
      var cls = s.state === "now" ? "now" : (s.state === "next" && s.ahead != null && s.ahead <= 2) ? "soon" : DONE[s.state] ? "out" : "";
      var tm = "", ln2 = "";
      if (s.state === "now" || s.state === "next") {
        var f = s.next.f, mins = Math.round((f.t - now) / 60000);
        var sameDay = f.t.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" }) === new Date(now).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
        var rel = s.isNow ? "TERAZ" : mins <= 0 ? "planowo już" : mins < 60 ? "za " + mins + " min" : mins < 600 ? "za " + Math.floor(mins / 60) + " h " + (mins % 60) + " min" : "";
        tm = (sameDay ? "" : dayName(f.t) + " ") + hm(f.t) + "<small>" + (rel || "planowo") + "</small>";
        var opn = pname(s.next.op);
        ln2 = "<span class='mt'>mata " + esc(s.mat) + "</span> " + (s.isNow ? "<span class='tag now'>walczy teraz</span>" : s.ahead != null ? "przed nim: <b>" + s.ahead + "</b> " + (s.ahead === 1 ? "walka" : (s.ahead % 10 >= 2 && s.ahead % 10 <= 4 && (s.ahead % 100 < 10 || s.ahead % 100 >= 20)) ? "walki" : "walk") : "kolejka jeszcze nie ruszyła") +
          " · " + esc(roundPl(f.roundName)) + " · vs <b>" + (opn ? esc(opn) + "</b> <span class='un'>(" + esc((s.next.op.academy || "").trim()) + ")</span>" : "zwycięzca wcześniejszej walki</b>");
      } else if (s.state === "out") { tm = "—<small>odpadł</small>"; }
      else if (s.state === "g1") { tm = "🥇<small>1. miejsce</small>"; }
      else if (s.state === "g2") { tm = "🥈<small>2. miejsce</small>"; }
      else if (s.state === "g3") { tm = "🥉<small>3. miejsce</small>"; }
      else if (s.state === "wait") { tm = "…<small>czeka na kolejną walkę</small>"; }
      else if (s.state === "fin") { tm = "✓<small>zakończył</small>"; ln2 = "Miejsce – zobacz drabinkę."; }
      else if (s.state === "past") { tm = "✓<small>kategoria zakończona</small>"; ln2 = "Wynik w drabince."; }
      else if (s.state === "check") { tm = "?<small>brak walki w kolejce</small>"; ln2 = "Kategoria już trwa – sprawdź drabinkę."; }
      else {
        var sg = s.segs;
        tm = sg.length ? dayName(sg[0].start) + " " + hm(sg[0].start) + "<small>plan bloku</small>" : "—";
        ln2 = sg.length ? "Plan: " + sg.map(function (x) { return "mata " + esc(x.mat) + " " + hm(x.start) + "–" + hm(x.end); }).join(", ") + " <span class='un'>(walki pojawią się, gdy ten dzień będzie aktywny)</span>" : "";
      }
      var hist = s.hist.map(function (h) { return "<span class='tag " + (h.res === "w" ? "w" : "l") + "'>" + esc(roundPl(h.round)) + " " + (h.res === "w" ? "✓ wygrał" : "✗ przegrał") + (h.opName ? " z " + esc(h.opName) : "") + score(h) + "</span>"; }).join("");
      hist += " <a class='bl' href='" + EVPATH + "/brackets/" + s.cid + "' target='_blank' rel='noopener'>drabinka ↗</a>";
      var cf = CF.map[s.key];
      if (cf) { cls += " conf"; hist = "<span class='tag cf'>⚠ w tym samym czasie: " + cf.map(confWho).join(", ") + "</span>" + hist; }
      return "<div class='card " + cls + "'><button class='st" + (stars.has(s.key) ? " on" : "") + "' data-k='" + esc(s.key) + "' aria-label='Moja lista'>★</button>" +
        "<div><div class='nm'>" + esc(s.name) + "</div><div class='un'>" + esc(s.unit) + " · " + esc(s.cat) + "</div></div><div class='tm'>" + tm + "</div>" +
        "<div class='ln'>" + ln2 + "<div>" + hist + "</div></div></div>";
    }).join("");
    $("cl-list").innerHTML = banner + html || "<div class='msg'>" + (view === "mine" ? "Brak zawodników na liście ★ (przy tych filtrach). Oznacz ich gwiazdką w widoku „Wszyscy” albo wczytaj kod ★." : "Brak startów dla tych filtrów.") + "</div>";
  }

  // ---------- obsługa ----------
  ov.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.k) { var k = b.dataset.k; stars.has(k) ? stars.delete(k) : stars.add(k); saveStars(); render(); return; }
    if (b.dataset.v) { view = b.dataset.v; ov.querySelectorAll(".seg button").forEach(function (x) { x.classList.toggle("on", x === b); }); render(); return; }
    var a = b.dataset.a;
    if (a === "close") { ov.remove(); clearInterval(window.__copaTimer); clearInterval(window.__copaTick); clearTimeout(window.__copaMore); }
    if (a === "ref") load();
    if (a === "code") $("cl-code").classList.toggle("open");
    if (a === "cout") { $("cl-codetxt").value = "COPA26:" + (D ? D.starts.filter(function (s) { return stars.has(s.key); }).map(function (s) { return hash5(s.key); }).join(".") : ""); $("cl-codetxt").select(); $("cl-cmsg").textContent = "Skopiuj zaznaczony kod."; }
    if (a === "cin" || a === "cadd") {
      var m = $("cl-codetxt").value.match(/COPA26:([0-9a-z.]*)/i);
      if (!m || !D) { $("cl-cmsg").textContent = "Nie znaleziono kodu COPA26:"; return; }
      var map = {}; D.starts.forEach(function (s) { map[hash5(s.key)] = s.key; });
      var hs = m[1].toLowerCase().split(".").filter(Boolean), ok = 0;
      if (a === "cin") stars.clear();
      hs.forEach(function (h) { if (map[h]) { stars.add(map[h]); ok++; } });
      saveStars(); view = "mine"; ov.querySelectorAll(".seg button").forEach(function (x) { x.classList.toggle("on", x.dataset.v === "mine"); });
      $("cl-cmsg").textContent = "Wczytano " + ok + " z " + hs.length + "."; render();
    }
  });
  ["cl-q", "cl-unit", "cl-hide"].forEach(function (id) { $(id).addEventListener("input", render); });
  $("cl-auto").addEventListener("change", function () { setTimer(); });
  function setTimer() { clearInterval(window.__copaTimer); if ($("cl-auto").checked) window.__copaTimer = setInterval(function () { if (!document.hidden) load(); }, 60000); }
  clearInterval(window.__copaTick); window.__copaTick = setInterval(function () { if (D && document.getElementById(OV)) render(); }, 30000); // przelicza „za X min”
  if (stars.size) { view = "mine"; ov.querySelectorAll(".seg button").forEach(function (x) { x.classList.toggle("on", x.dataset.v === "mine"); }); }
  setTimer();
  load();
})();
