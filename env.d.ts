declare const SRC: string

declare module "inline:*" {
  const content: string
  export default content
}

declare module "*.scss" {
  const content: string
  export default content
}

declare module "*.blp" {
  const content: string
  export default content
}

declare module "*.css" {
  const content: string
  export default content
}

// ags の lib/overrides.ts が内部的に import しているが、このプロジェクトでは
// 使わない (flake.nix にも入れていない) Astal モジュールのスタブ宣言。
// 実行時は overrides.ts 側で import 失敗を握りつぶすため動作には影響しないが、
// tsc がモジュール解決に失敗してノイズを出すため、型だけ用意する。
declare module "gi://AstalApps" {
  const mod: any
  export default mod
}

declare module "gi://AstalBattery" {
  const mod: any
  export default mod
}

declare module "gi://AstalMpris" {
  const mod: any
  export default mod
}

declare module "gi://AstalPowerProfiles" {
  const mod: any
  export default mod
}
