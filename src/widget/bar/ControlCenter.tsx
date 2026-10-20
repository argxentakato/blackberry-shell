// コントロールセンター (Bluetooth / Wi-Fi / 音量 / 通知を 1 つの popover にまとめる)。
// バー上のボタンには各状態のインジケーターを並べる。
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import AstalWp from "gi://AstalWp?version=0.1"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"
import Toggles from "./controlcenter/Toggles"
import Sliders from "./controlcenter/Sliders"
import MusicPlayer from "./controlcenter/MusicPlayer"
import Notifications from "./controlcenter/Notifications"
import { history } from "../../services/notifd"

function Indicators() {
  const network = AstalNetwork.get_default()
  const bt = AstalBluetooth.get_default()
  const audio = AstalWp.get_default()!.audio
  const dnd = createBinding(AstalNotifd.get_default(), "dontDisturb")

  const btIconName = createBinding(bt, "isConnected")((connected) =>
    connected ? "bluetooth-active-symbolic" : "bluetooth-disconnected-symbolic",
  )

  return (
    <box spacing={8}>
      <image
        iconName={createBinding(network, "wifi", "iconName")(
          (name) => name ?? "network-wireless-offline-symbolic",
        )}
      />
      <image iconName={btIconName} />
      <image
        iconName={createBinding(audio, "defaultSpeaker", "volumeIcon")(
          (name) => name ?? "audio-volume-muted-symbolic",
        )}
      />
      <box spacing={4}>
        <image
          iconName={dnd((on) => (on ? "notifications-disabled-symbolic" : "preferences-system-notification-symbolic"))}
        />
        {/* 履歴が 0 件のときはバッジを隠す */}
        <label
          class="badge"
          visible={history((list) => list.length > 0)}
          label={history((list) => String(list.length))}
        />
      </box>
    </box>
  )
}

export default function ControlCenter() {
  let popover: Gtk.Popover

  return (
    <menubutton class="control-center">
      <Indicators />
      <popover class="control-center-popover" $={(self) => (popover = self)}>
        {/* 高さを固定する。内容の増減で popover がリサイズされると位置がずれるため */}
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
          widthRequest={420}
          heightRequest={620}
        >
          <Toggles closePopover={() => popover.popdown()} />
          <Sliders />
          <MusicPlayer />
          <Gtk.Separator visible />
          <Notifications />
        </box>
      </popover>
    </menubutton>
  )
}
