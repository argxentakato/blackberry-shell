// ステータスバー本体。
// 左→右の順に: スタートボタン / ワークスペース / タスクトレイ /
// 時計 / システムトレイ / コントロールセンター (クイックセッティング + 通知) を配置する。
import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { onCleanup } from "ags"
import Workspaces from "./bar/Workspaces"
import TaskTray from "./bar/TaskTray"
import Clock from "./bar/Clock"
import SystemTray from "./bar/SystemTray"
import ControlCenter from "./bar/ControlCenter"
import { LAUNCHER_NAME } from "./Launcher"

// JSX から <Bar gdkmonitor={...} /> の形で呼ばれるため、
// 引数は props オブジェクトとして受け取る (Gnim の関数コンポーネント規約)
export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  let win: Astal.Window

  // For 経由で Bar が破棄された (モニター外れなど) ときにウィンドウも破棄する。
  // ルート (ウィンドウ) は自動では破棄されないため明示的に destroy する
  onCleanup(() => win.destroy())

  return (
    <window
      // JSX 式自体の型は GObject.Object になるので、$ 経由で実体を保持する
      $={(self) => (win = self)}
      visible
      class="Bar"
      gdkmonitor={gdkmonitor}
      // application を設定すると Gtk がこのウィンドウをアプリに登録してくれる。
      // これにより app.toggle_window("launcher") が機能するようになる
      application={app}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
    >
      <centerbox cssName="centerbox">
        {/* 左側: スタートボタン・ワークスペース・タスクトレイ */}
        <box $type="start" spacing={4}>
          {/* ランチャー起動ボタン。Launcher ウィンドウ (name="launcher") を開閉する */}
          <button
            class="launcher-button"
            tooltipText="アプリランチャー"
            onClicked={() => app.toggle_window(LAUNCHER_NAME)}
          >
            <image iconName="view-app-grid-symbolic" />
          </button>
          <Workspaces />
          <TaskTray />
        </box>

        {/* 中央: 時計 (カレンダー popover 付き) */}
        <box $type="center">
          <Clock />
        </box>

        {/* 右側: システムトレイ・コントロールセンター */}
        <box $type="end" spacing={4} halign={Gtk.Align.END}>
          <SystemTray />
          <ControlCenter />
        </box>
      </centerbox>
    </window>
  )
}
