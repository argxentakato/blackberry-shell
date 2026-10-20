// Hyprland 0.55 以降は dispatch の引数が Lua 式になった。
// AstalHyprland の dispatch() / Client.focus() は旧構文を送るため、直接 IPC に Lua を渡す。
import AstalHyprland from "gi://AstalHyprland?version=0.1"

function dispatch(luaExpr: string) {
  AstalHyprland.get_default().message_async(`dispatch ${luaExpr}`, null)
}

export function focusWorkspace(id: number) {
  dispatch(`hl.dsp.focus({ workspace = ${id} })`)
}

export function focusWindow(address: string) {
  // address プロパティは 0x 付きのことも無いこともある
  const addr = address.startsWith("0x") ? address : `0x${address}`
  dispatch(`hl.dsp.focus({ window = "address:${addr}" })`)
}
