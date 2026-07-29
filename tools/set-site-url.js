/* 公開URLを埋め込みます。GitHub Pages を有効にしたあと一度だけ実行してください。

     node tools/set-site-url.js https://akushu50.github.io/sidework-diagnosis

   OGP画像はクローラーが読むため絶対URLが必要です。 */

const fs = require("fs");
const path = require("path");
const url = (process.argv[2] || "").replace(/\/+$/, "");
if (!url) {
  console.error("使い方: node tools/set-site-url.js https://example.github.io/repo");
  process.exit(1);
}
const root = path.join(__dirname, "..");
const files = [path.join(root, "index.html")].concat(
  fs.readdirSync(path.join(root, "r")).map((f) => path.join(root, "r", f))
);
let n = 0;
files.forEach((f) => {
  const s = fs.readFileSync(f, "utf8");
  if (s.includes("__SITE_URL__")) {
    fs.writeFileSync(f, s.split("__SITE_URL__").join(url));
    n++;
  }
});
console.log(`${n} ファイルに ${url} を設定しました。`);
