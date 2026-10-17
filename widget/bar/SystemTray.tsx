// システムトレイ (StatusNotifierItem を menubutton として表示する)
import AstalTray from "gi://AstalTray?version=0.1"
import { Gtk } from "ags/gtk4"
import { createBinding, For } from "ags"

export default function SystemTray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  // TrayItem の D-Bus メニュー (Gio.MenuModel) とアクショングループを
  // MenuButton に接続する。action-group は再生成されうるので再取得する
  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box spacing={2} class="system-tray">
      <For each={items}>
        {(item) => (
          <menubutton $={(self) => init(self, item)} tooltipText={item.tooltipMarkup}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}
