// `ags request` 経由の CLI コマンドハンドラ
import app from "ags/gtk4/app"
import { LAUNCHER_NAME } from "../widget/Launcher"

// Hyprland のキーバインド用: `ags request launcher [toggle|show|hide]`
export function requestHandler(argv: string[], res: (response: any) => void) {
  const [cmd, action = "toggle"] = argv
  if (cmd !== "launcher") return res(`unknown request: ${argv.join(" ")}`)

  const win = app.get_window(LAUNCHER_NAME)
  if (!win) return res("launcher is not ready")

  switch (action) {
    case "toggle":
      win.visible = !win.visible
      break
    case "show":
      win.visible = true
      break
    case "hide":
      win.visible = false
      break
    default:
      return res(`unknown action: ${action}`)
  }
  res("ok")
}
