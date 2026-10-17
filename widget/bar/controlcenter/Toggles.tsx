// コントロールセンターのトグル。ON/OFF だけをここで扱い、
// ペアリングや接続先の選択などの詳細は外部の設定アプリに任せる。
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango?version=1.0"
import { execAsync } from "ags/process"
import { type Accessor, createBinding, createComputed, With } from "ags"
import { config } from "../../config"

const { bluetooth: BLUETOOTH_APP, network: NETWORK_APP } = config.apps

function launch(command: string, closePopover: () => void) {
  closePopover()
  execAsync([command]).catch((e) => console.error(`${command} の起動に失敗:`, e))
}

interface TileProps {
  icon: Accessor<string> | string
  title: string
  subtitle: Accessor<string> | string
  active: Accessor<boolean> | boolean
  sensitive?: Accessor<boolean> | boolean
  onToggled: (active: boolean) => void
  onOpenSettings: () => void
}

// 左: ON/OFF を切り替えるタイル、右: 設定アプリを開くボタン
function Tile({
  icon,
  title,
  subtitle,
  active,
  sensitive = true,
  onToggled,
  onOpenSettings,
}: TileProps) {
  return (
    <box class="linked cc-tile" hexpand>
      <togglebutton
        hexpand
        sensitive={sensitive}
        active={active}
        onToggled={(self) => onToggled(self.active)}
      >
        <box spacing={8}>
          <image iconName={icon} pixelSize={20} />
          <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
            <label class="tile-title" halign={Gtk.Align.START} xalign={0} label={title} />
            <label
              class="tile-subtitle"
              halign={Gtk.Align.START}
              xalign={0}
              ellipsize={Pango.EllipsizeMode.END}
              maxWidthChars={14}
              label={subtitle}
            />
          </box>
        </box>
      </togglebutton>
      <button tooltipText="詳細設定を開く" onClicked={onOpenSettings}>
        <image iconName="emblem-system-symbolic" />
      </button>
    </box>
  )
}

function BluetoothTile({ closePopover }: { closePopover: () => void }) {
  const bt = AstalBluetooth.get_default()
  const powered = createBinding(bt, "isPowered")
  // 接続状態の変化は isConnected の notify で拾う
  const connected = createBinding(bt, "isConnected")

  const subtitle = createComputed(() => {
    if (!powered()) return "オフ"
    connected()
    const names = bt.devices.filter((d) => d.connected).map((d) => d.alias)
    return names.length > 0 ? names.join(", ") : "オン"
  })

  return (
    <Tile
      icon={powered((p) => (p ? "bluetooth-active-symbolic" : "bluetooth-disabled-symbolic"))}
      title="Bluetooth"
      subtitle={subtitle}
      active={powered}
      // 実際の状態と食い違うときだけ切り替える (バインディング更新による再入を避ける)
      onToggled={(on) => {
        if (on !== bt.isPowered) bt.toggle()
      }}
      onOpenSettings={() => launch(BLUETOOTH_APP, closePopover)}
    />
  )
}

function WifiTile({ closePopover }: { closePopover: () => void }) {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")
  const openSettings = () => launch(NETWORK_APP, closePopover)

  return (
    <With value={wifi}>
      {(w) => {
        // Wi-Fi デバイスが無い環境では操作不可にする
        if (!w) {
          return (
            <Tile
              icon="network-wireless-offline-symbolic"
              title="Wi-Fi"
              subtitle="利用不可"
              active={false}
              sensitive={false}
              onToggled={() => {}}
              onOpenSettings={openSettings}
            />
          )
        }

        const enabled = createBinding(w, "enabled")
        const ssid = createBinding(w, "ssid")
        return (
          <Tile
            icon={createBinding(w, "iconName")}
            title="Wi-Fi"
            subtitle={createComputed(() => (enabled() ? ssid() || "オン" : "オフ"))}
            active={enabled}
            onToggled={(on) => {
              if (on !== w.enabled) w.enabled = on
            }}
            onOpenSettings={openSettings}
          />
        )
      }}
    </With>
  )
}

export default function Toggles({ closePopover }: { closePopover: () => void }) {
  return (
    <box spacing={8} homogeneous class="cc-toggles">
      <BluetoothTile closePopover={closePopover} />
      <WifiTile closePopover={closePopover} />
    </box>
  )
}
