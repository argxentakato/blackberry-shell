// 通知ポップアップ (画面右上に一時表示。タイムアウトで消えても履歴には残る)
import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { For, onCleanup } from "ags"
import NotificationCard from "./NotificationCard"
import { popups, hidePopup } from "../../services/notifd"

// JSX から <NotificationPopups gdkmonitor={...} /> の形で呼ばれるため、
// 引数は props オブジェクトとして受け取る (Gnim の関数コンポーネント規約)
export default function NotificationPopups({
  gdkmonitor,
}: {
  gdkmonitor: Gdk.Monitor
}) {
  const { TOP, RIGHT } = Astal.WindowAnchor

  let win: Astal.Window

  // For 経由で破棄された (モニター外れなど) ときにウィンドウも破棄する。
  // ルート (ウィンドウ) は自動では破棄されないため明示的に destroy する
  onCleanup(() => win.destroy())

  return (
    <window
      // JSX 式自体の型は GObject.Object になるので、$ 経由で実体を保持する
      $={(self) => (win = self)}
      // 通知が 1 件以上あるときだけ表示する
      visible={popups((list) => list.length > 0)}
      class="NotificationPopups"
      gdkmonitor={gdkmonitor}
      // バーの領域を押しのけないようにする
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | RIGHT}
      application={app}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
        <For each={popups}>
          {(n) => (
            <NotificationCard
              notification={n}
              onClose={() => hidePopup(n.id)}
            />
          )}
        </For>
      </box>
    </window>
  )
}
