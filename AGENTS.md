# AGENT.md

Wayland 向けデスクトップシェル (AGS / Astal, GTK4, TypeScript + JSX)。

## 開発環境 (重要)

- 開発 OS は **NixOS**。ツール (`ags`, `gjs` など) はグローバルに入っていない前提。
- コマンド実行は必ず `nix develop` の環境内で行うこと。
  - 対話シェル: `nix develop`
  - 単発実行: `nix develop -c <command>`
- `npm install` / `apt` / `pip` などでグローバルに何かをインストールしない。依存の追加は `flake.nix` で行う。
- `flake.nix` を変更したら `nix develop` を入り直す。`flake.lock` は意図なく更新しない。

## よく使うコマンド

```sh
nix develop -c ags run app.ts          # 開発実行
nix develop -c ags bundle app.ts out   # バンドル
nix build                              # パッケージビルド (flake の default)
```

## 構成

- [app.ts](app.ts): エントリポイント。`app.start` でモニターごとに `Bar` を生成
- [widget/](widget/): ウィジェット (`Bar.tsx` など)
- [style.scss](style.scss): スタイル
- [flake.nix](flake.nix): パッケージと devShell の定義 (`astal4` / `io` / `libadwaita` / `libsoup_3`)
- [env.d.ts](env.d.ts): 型宣言
- `@girs/`: GObject Introspection の型定義。**自動生成物のため編集しない**

## 規約

- GTK4 を使用 (`ags/gtk4`)。GTK3 向けの API は使わない。
- TypeScript は `strict`。JSX は `jsxImportSource: "ags/gtk4"`。
- Prettier 設定: セミコロンなし、インデント 2 スペース。
- 状態管理は `gnim` を使用。
- Astal ライブラリ (`notifd`, `tray`, `wireplumber` など) を追加する場合は、`flake.nix` の `astalPackages` に追加する。
