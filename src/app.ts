// エントリポイント。CSS を適用し、モニターごとにバー・通知ポップアップ・
// ランチャーを生成する (JSX を使う初期化処理は widget/Main.tsx に分離)
import app from "ags/gtk4/app"
import style from "./app.scss"
import { setup } from "./widget/Main"
import { requestHandler } from "./handlers/request"

app.start({
  // カラースキームやフォントは定義せず、GTK システムテーマ (@theme_*) を参照する
  css: style,
  main: setup,
  requestHandler,
})
