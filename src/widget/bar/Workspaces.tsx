// ワークスペース切り替え (小さなドットのインジケーター。フォーカス中は横長のピルになる)
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { Gtk } from "ags/gtk4"
import { createBinding, createComputed, For } from "ags"
import { focusWorkspace } from "../../services/hyprland"

export default function Workspaces() {
  const hyprland = AstalHyprland.get_default()

  // 特殊ワークスペース (id < 0) を除いた全ワークスペースを id 昇順で並べる
  const workspaces = createBinding(hyprland, "workspaces")((list) =>
    [...list].filter((ws) => ws.id > 0).sort((a, b) => a.id - b.id),
  )

  // 現在フォーカス中のワークスペース (アクティブ表示用)
  const focused = createBinding(hyprland, "focusedWorkspace")

  return (
    <box spacing={6} class="workspaces" valign={Gtk.Align.CENTER}>
      <For each={workspaces}>
        {(ws) => {
          const clients = createBinding(ws, "clients")
          // 状態は 1 つの class 文字列にまとめる (setClass は丸ごと置き換えるため)
          const cls = createComputed(() => {
            if (focused()?.id === ws.id) return "workspace focused"
            return clients().length > 0 ? "workspace occupied" : "workspace"
          })

          return (
            <button
              class={cls}
              valign={Gtk.Align.CENTER}
              tooltipText={`ワークスペース ${ws.id}`}
              onClicked={() => focusWorkspace(ws.id)}
            />
          )
        }}
      </For>
    </box>
  )
}
