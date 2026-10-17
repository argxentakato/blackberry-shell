// app.ts から呼ばれる初期化処理。JSX を使うため .tsx 側に分離している。
import app from "ags/gtk4/app"
import { createBinding, For, This } from "ags"
import Bar from "./Bar"
import NotificationPopups from "./notifd/Popup"
import { initNotificationStore } from "./notifd/store"
import Launcher from "./Launcher"

export function setup() {
  // Notifd をこのプロセスの通知デーモンとして起動し、履歴ストアを購読させる
  initNotificationStore()

  // モニター増減に追従してバーと通知ポップアップを作り直す。
  // This(app) を介して生成するとウィンドウがアプリに登録されるため、
  // app.toggle_window("launcher") などが機能するようになる。
  // createBinding は変数に束縛してから For に渡す (インラインだと
  // For の型推論が効かず item が unknown になるため)
  const monitors = createBinding(app, "monitors")
  const barWindows = (
    <For each={monitors}>
      {(monitor) => (
        <This this={app}>
          <Bar gdkmonitor={monitor} />
          <NotificationPopups gdkmonitor={monitor} />
        </This>
      )}
    </For>
  )

  // ランチャーは全画面オーバーレイなのでモニター数にかかわらず 1 つだけ生成する。
  // This(app) を経由することでアプリにウィンドウが登録される
  const launcherWindow = (
    <This this={app}>
      <Launcher />
    </This>
  )

  void barWindows
  void launcherWindow
}
