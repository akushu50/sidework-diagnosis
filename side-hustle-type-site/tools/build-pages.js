/* タイプ別の結果ページ（r/*.html）を生成します。
   assets/data.js を編集したら、リポジトリのルートで次を実行してください。

     node tools/build-pages.js

   Node.js があれば追加のインストールは不要です。 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = require(path.join(root, "assets", "data.js"));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const page = (t) => `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.name)}タイプ｜おすすめ副業診断テスト</title>
<meta name="description" content="${esc(t.catch)}。${esc(t.lead)}">

<meta property="og:type" content="article">
<meta property="og:title" content="私は【${esc(t.name)}タイプ】でした｜おすすめ副業診断テスト">
<meta property="og:description" content="${esc(t.catch)}／${esc(t.ramp)}">
<meta property="og:url" content="__SITE_URL__/r/${t.key}.html">
<meta property="og:image" content="__SITE_URL__/assets/ogp/${t.key}.png">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body class="sht-live">
<main class="sht-wrap">
  <div class="sht-rule"></div>
  <p class="sht-eyebrow sht-en" style="text-align:center">Type ${t.no}</p>
  <img class="sht-char" src="../assets/char/${t.key}.webp" alt="${esc(t.name)}タイプのイラスト">
  <div class="sht-catch">${esc(t.catch)}</div>
  <div class="sht-no sht-en">${t.no}</div>
  <h1 class="sht-tname">${esc(t.name)}</h1>
  <div class="sht-ten sht-en">${esc(t.en)}</div>
  <span class="sht-ramp">${esc(t.ramp)}</span>
  <p class="sht-lead">${esc(t.lead)}</p>

  <section class="sht-sec">
    <h2 class="sht-h sht-en">WHY / 向いている理由</h2>
    ${t.why.map((w) => `<p class="sht-li"><em>—</em><span>${esc(w)}</span></p>`).join("\n    ")}
  </section>

  <section class="sht-sec">
    <h2 class="sht-h sht-en">CAUTION / つまずきやすい点</h2>
    <p class="sht-note">${esc(t.caution)}</p>
  </section>

  <section class="sht-sec">
    <h2 class="sht-h sht-en">FIRST STEPS / 最初の3手</h2>
    ${t.steps
      .map(
        (s, i) =>
          `<div class="sht-step"><span class="sht-stepno sht-en">${i + 1}</span><span class="sht-steptext">${esc(s)}</span></div>`
      )
      .join("\n    ")}
  </section>

  <section class="sht-sec">
    <h2 class="sht-h sht-en">OTHER TYPES / ほかのタイプ</h2>
    ${data.types
      .filter((o) => o.key !== t.key)
      .map(
        (o) =>
          `<a class="sht-alt" href="${o.key}.html"><span class="sht-altchar"><img class="sht-char" src="../assets/char/${o.key}.webp" alt="" loading="lazy"></span><span><span class="sht-altno sht-en">${o.no}</span><span class="sht-altname" style="display:block">${esc(o.name)}</span></span></a>`
      )
      .join("\n    ")}
  </section>

  <a class="sht-btn" href="../">自分のタイプを診断する（約2分）</a>
  <p class="sht-foot">おすすめ副業診断テスト</p>
</main>
</body>
</html>
`;

const outDir = path.join(root, "r");
fs.mkdirSync(outDir, { recursive: true });
data.types.forEach((t) => {
  fs.writeFileSync(path.join(outDir, `${t.key}.html`), page(t));
  console.log(`  r/${t.key}.html`);
});
console.log(`${data.types.length} 件の結果ページを生成しました。`);
