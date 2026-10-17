// コントロールセンターの通知セクション (通知センター)。
// 履歴は notifd/store.ts が保持しており、ここで手動で消すまで残る。
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import { Gtk } from "ags/gtk4"
import { createBinding, For } from "ags"
import NotificationCard from "../../notifd/NotificationCard"
import { history, removeFromHistory, clearHistory } from "../../notifd/store"

export default function Notifications() {
  const notifd = AstalNotifd.get_default()
  const dnd = createBinding(notifd, "dontDisturb")

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={4} vexpand class="cc-notifications">
      <box class="cc-notifications-header" spacing={4}>
        <label hexpand halign={Gtk.Align.START} xalign={0} label="通知" />
        {/* ONのあいだはポップアップを出さず履歴にだけ溜める */}
        <togglebutton
          class="flat"
          tooltipText="サイレントモード"
          active={dnd}
          onToggled={(self) => {
            if (self.active !== notifd.dontDisturb) notifd.dontDisturb = self.active
          }}
        >
          <image iconName="notifications-disabled-symbolic" />
        </togglebutton>
        <button
          class="flat"
          tooltipText="すべて消去"
          visible={history((list) => list.length > 0)}
          onClicked={clearHistory}
        >
          <image iconName="user-trash-symbolic" />
        </button>
      </box>
      {/* popover の高さは固定なので、余った高さをこの一覧が吸収する */}
      <scrolledwindow
        vexpand
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        minContentWidth={400}
        minContentHeight={80}
      >
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
          <label
            class="placeholder"
            visible={history((list) => list.length === 0)}
            label="通知はありません"
          />
          <For each={history}>
            {(n) => (
              <NotificationCard
                notification={n}
                onClose={() => removeFromHistory(n.id)}
              />
            )}
          </For>
        </box>
      </scrolledwindow>
    </box>
  )
}
