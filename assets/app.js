/* おすすめ副業診断テスト / 本体ロジック
   データは assets/data.js（SHT_DATA）を参照します。 */
(function () {
  "use strict";

  var AXES = SHT_DATA.axes;
  var TYPES = SHT_DATA.types;
  var QUESTIONS = SHT_DATA.questions;
  var HASHTAG = SHT_DATA.hashtag;
  var KEYS = ["A", "B", "C", "D", "E"];
  var AXIS_IDS = AXES.map(function (a) { return a.id; });

  /* ---------- スコア計算 ---------- */

  // 各軸で到達できる正側・負側の最大値（設問を増減しても自動追従）
  function maxima() {
    var p = {}, n = {};
    AXIS_IDS.forEach(function (id) { p[id] = 0; n[id] = 0; });
    QUESTIONS.forEach(function (q) {
      AXIS_IDS.forEach(function (id) {
        var vals = q.opts.map(function (o) { return o.d[id] || 0; }).concat([0]);
        p[id] += Math.max.apply(null, vals);
        n[id] += Math.min.apply(null, vals);
      });
    });
    return { p: p, n: n };
  }

  function scoreOf(answers) {
    var raw = {};
    AXIS_IDS.forEach(function (id) { raw[id] = 0; });
    answers.forEach(function (oi, i) {
      if (oi === null || oi === undefined) return;
      var d = QUESTIONS[i].opts[oi].d;
      AXIS_IDS.forEach(function (id) { raw[id] += d[id] || 0; });
    });
    var m = maxima(), out = {};
    AXIS_IDS.forEach(function (id) {
      var lim = raw[id] >= 0 ? m.p[id] : Math.abs(m.n[id]);
      out[id] = lim ? Math.round((raw[id] / lim) * 100) : 0;
    });
    return out;
  }

  function ranked(user) {
    var totalW = AXES.reduce(function (s, a) { return s + a.weight; }, 0);
    return TYPES.map(function (t) {
      var s = 0;
      AXES.forEach(function (a) {
        s += (100 - Math.abs(user[a.id] - t.axes[a.id]) / 2) * a.weight;
      });
      var o = Object.assign({}, t);
      o.fit = Math.round(s / totalW);
      return o;
    }).sort(function (x, y) { return y.fit - x.fit; });
  }

  function barStyle(v) {
    var w = Math.abs(v) / 2;
    return v >= 0
      ? "left:50%;width:" + w + "%"
      : "left:" + (50 - w) + "%;width:" + w + "%";
  }

  /* ---------- 表示ヘルパー ---------- */

  var app = document.getElementById("app");
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var charSrc = function (key) { return "assets/char/" + key + ".webp"; };

  /* ---------- 状態 ---------- */

  var stage = "intro";
  var idx = 0;
  var answers = new Array(QUESTIONS.length).fill(null);
  var chosen = null;
  var timer = null;

  function reset() {
    clearTimeout(timer);
    chosen = null;
    answers = new Array(QUESTIONS.length).fill(null);
    idx = 0;
    stage = "intro";
    if (location.hash) history.replaceState(null, "", location.pathname);
    render();
  }

  function pick(oi, el) {
    if (chosen !== null) return;
    if (el && el.blur) el.blur();
    document.body.classList.remove("sht-live");
    chosen = oi;
    render();
    timer = setTimeout(function () {
      answers[idx] = oi;
      chosen = null;
      if (idx + 1 < QUESTIONS.length) idx++;
      else stage = "result";
      render();
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }, 420);
  }

  function goBack() {
    clearTimeout(timer);
    chosen = null;
    idx = Math.max(0, idx - 1);
    render();
  }

  // マウスが動いたらhoverを復帰（選択直後のハイライト残りを防ぐ）
  document.addEventListener("pointermove", function () {
    if (!document.body.classList.contains("sht-live")) {
      document.body.classList.add("sht-live");
    }
  });

  /* ---------- 画面 ---------- */

  function viewIntro() {
    return '<div class="sht-fade">' +
      '<div class="sht-rule"></div>' +
      '<p class="sht-eyebrow sht-en">' + QUESTIONS.length + ' questions / ' + TYPES.length + ' types</p>' +
      '<h1 class="sht-jptitle">おすすめ<br>副業<b>診断</b>テスト</h1>' +
      '<p class="sht-sub">副業が続くかどうかは、稼げる額より「性格に合っているか」で決まります。' +
      QUESTIONS.length + '問に答えると、' + TYPES.length + 'つの副業タイプからあなたに近い順に並べ替えます。所要 約2分。</p>' +
      '<ul class="sht-chips">' +
      TYPES.map(function (t) { return '<li class="sht-chip">' + esc(t.name) + "</li>"; }).join("") +
      "</ul>" +
      '<button class="sht-btn" data-act="start">診断をはじめる</button>' +
      "</div>";
  }

  function viewQuiz() {
    var q = QUESTIONS[idx];
    var ticks = QUESTIONS.map(function (_, i) {
      return '<span class="sht-tick' + (i < idx ? " on" : i === idx ? " now" : "") + '"></span>';
    }).join("");
    var opts = q.opts.map(function (o, oi) {
      var cls = "sht-opt" + (chosen === oi ? " chosen" : chosen !== null ? " dimmed" : "");
      return '<button class="' + cls + '" data-act="pick" data-i="' + oi + '">' +
        '<span class="sht-key sht-en">' + KEYS[oi] + "</span>" +
        '<span class="sht-optlabel">' + esc(o.label) + "</span></button>";
    }).join("");
    return "<div>" +
      '<div class="sht-meta"><div class="sht-count sht-en"><b>' +
      String(idx + 1).padStart(2, "0") + "</b><i> / " +
      String(QUESTIONS.length).padStart(2, "0") + "</i></div>" +
      '<div class="sht-eyebrow sht-en" style="margin:0">Question</div></div>' +
      '<div class="sht-track">' + ticks + "</div>" +
      '<div class="sht-fade">' +
      '<h2 class="sht-q">' + esc(q.q) + "</h2>" + opts + "</div>" +
      (idx > 0 ? '<button class="sht-back" data-act="back">← ひとつ前に戻る</button>' : "") +
      "</div>";
  }

  function shareLink(t) {
    var url = new URL("r/" + t.key + ".html", location.href).href;
    var text = "私は【" + t.name + "タイプ】でした\n" + t.catch + "／適合度 " + t.fit + "%\n\n#" + HASHTAG;
    return "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
  }

  function viewResult() {
    var user = scoreOf(answers);
    var list = ranked(user);
    var top = list[0];

    var meters = AXES.map(function (a) {
      return '<div class="sht-axis"><div class="sht-axislabels"><span>' + esc(a.left) +
        "</span><span>" + esc(a.right) + "</span></div>" +
        '<div class="sht-meter">' +
        '<div class="sht-fill type" style="' + barStyle(top.axes[a.id]) + '"></div>' +
        '<div class="sht-fill you" style="' + barStyle(user[a.id]) + '"></div>' +
        "</div></div>";
    }).join("");

    var alts = list.slice(1, 4).map(function (t) {
      return '<a class="sht-alt" href="r/' + t.key + '.html">' +
        '<span class="sht-altchar"><img class="sht-char" src="' + charSrc(t.key) + '" alt="" loading="lazy"></span>' +
        '<span><span class="sht-altno sht-en">' + t.no + '</span>' +
        '<span class="sht-altname" style="display:block">' + esc(t.name) + "</span></span>" +
        '<span class="sht-altfit sht-en">' + t.fit + "%</span></a>";
    }).join("");

    return '<div class="sht-fade">' +
      '<div class="sht-rule"></div>' +
      '<p class="sht-eyebrow sht-en" style="text-align:center">Your type</p>' +
      '<img class="sht-char" src="' + charSrc(top.key) + '" alt="' + esc(top.name) + 'タイプのイラスト">' +
      '<div class="sht-catch">' + esc(top.catch) + "</div>" +
      '<div class="sht-no sht-en">' + top.no + "</div>" +
      '<h1 class="sht-tname">' + esc(top.name) + "</h1>" +
      '<div class="sht-ten sht-en">' + esc(top.en) + "</div>" +
      '<span class="sht-ramp">' + esc(top.ramp) + "</span>" +
      '<p class="sht-lead">' + esc(top.lead) + "</p>" +
      '<div class="sht-fit"><span class="sht-fitnum sht-en">' + top.fit +
      '%</span><span class="sht-fitlabel">適合度</span></div>' +

      '<section class="sht-sec"><h2 class="sht-h sht-en">TENDENCY / 傾向の重なり</h2>' + meters +
      '<div class="sht-legend">' +
      '<span><span class="sht-dot" style="background:#FF4B8B"></span>あなた</span>' +
      '<span><span class="sht-dot" style="background:#2B3AA8"></span>' + esc(top.name) + "</span>" +
      '<span style="opacity:.55">重なった部分が紫</span></div></section>' +

      '<section class="sht-sec"><h2 class="sht-h sht-en">WHY / 向いている理由</h2>' +
      top.why.map(function (w) { return '<p class="sht-li"><em>—</em><span>' + esc(w) + "</span></p>"; }).join("") +
      "</section>" +

      '<section class="sht-sec"><h2 class="sht-h sht-en">CAUTION / つまずきやすい点</h2>' +
      '<p class="sht-note">' + esc(top.caution) + "</p></section>" +

      '<section class="sht-sec"><h2 class="sht-h sht-en">FIRST STEPS / 最初の3手</h2>' +
      top.steps.map(function (s, i) {
        return '<div class="sht-step"><span class="sht-stepno sht-en">' + (i + 1) +
          '</span><span class="sht-steptext">' + esc(s) + "</span></div>";
      }).join("") + "</section>" +

      '<section class="sht-sec"><h2 class="sht-h sht-en">NEXT / 次に近いタイプ</h2>' + alts + "</section>" +

      '<a class="sht-share" href="' + shareLink(top) + '" target="_blank" rel="noopener noreferrer">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.5h7.6l5.24 6.93L18.9 1.5Zm-1.29 18.8h2.04L6.49 3.6H4.3l13.31 16.7Z"/></svg>' +
      "結果をXでシェアする</a>" +
      '<button class="sht-btn" data-act="reset">もう一度診断する</button>' +
      "</div>";
  }

  function render() {
    app.innerHTML = stage === "intro" ? viewIntro() : stage === "quiz" ? viewQuiz() : viewResult();
  }

  app.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    if (act === "start") { stage = "quiz"; render(); }
    else if (act === "pick") pick(Number(el.getAttribute("data-i")), el);
    else if (act === "back") goBack();
    else if (act === "reset") reset();
  });

  document.body.classList.add("sht-live");
  render();
})();
