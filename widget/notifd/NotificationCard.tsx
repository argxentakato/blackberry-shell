// 通知 1 件分のカード表示 (ポップアップと通知トレイで共有)
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import { Gtk } from "ags/gtk4"
import { createConnection } from "ags"
import GLib from "gi://GLib?version=2.0"
import Pango from "gi://Pango?version=1.0"

interface NotificationCardProps {
  notification: AstalNotifd.Notification
  // ×ボタンの動作 (ポップアップは非表示、履歴は削除と使い分ける)
  onClose: () => void
}

// 緊急性に応じた CSS クラス名を返す
function urgency(n: AstalNotifd.Notification) {
  const { LOW, NORMAL, CRITICAL } = AstalNotifd.Urgency
  switch (n.urgency) {
    case LOW:
      return "low"
    case CRITICAL:
      return "critical"
    case NORMAL:
    default:
      return "normal"
  }
}

// 通知のタイムスタンプを HH:MM に整形する
function time(t: number, format = "%H:%M") {
  return GLib.DateTime.new_from_unix_local(t).format(format)!
}

export default function NotificationCard({
  notification: n,
  onClose,
}: NotificationCardProps) {
  // 解決済み (タイムアウト等) の通知はアクションを実行できないので隠す
  const live = createConnection(
    AstalNotifd.get_default().get_notification(n.id) !== null,
    [n, "resolved", () => false],
  )

  return (
    <box
      class={`notification-card ${urgency(n)}`}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
      widthRequest={380}
    >
      <box class="header" spacing={4}>
        {n.appIcon && <image class="app-icon" iconName={n.appIcon} />}
        <label
          class="app-name"
          halign={Gtk.Align.START}
          ellipsize={Pango.EllipsizeMode.END}
          label={n.appName || "不明なアプリ"}
        />
        <label
          class="time"
          hexpand
          halign={Gtk.Align.END}
          label={time(n.time)}
        />
        <button onClicked={onClose}>
          <image iconName="window-close-symbolic" />
        </button>
      </box>
      <box class="content" spacing={4}>
        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <label
            class="summary"
            halign={Gtk.Align.START}
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            label={n.summary}
          />
          {n.body && (
            <label
              class="body"
              wrap
              useMarkup
              hexpand
              xalign={0}
              maxWidthChars={48}
              label={n.body}
            />
          )}
        </box>
      </box>
      {n.actions.length > 0 && (
        <box class="actions" visible={live}>
          {n.actions.map(({ label, id }) => (
            <button hexpand onClicked={() => n.invoke(id)}>
              <label label={label} halign={Gtk.Align.CENTER} hexpand />
            </button>
          ))}
        </box>
      )}
    </box>
  )
}
