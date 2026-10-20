// コントロールセンターの音量スライダー (出力 / 入力)。
// 既定デバイスの音量とミュートをここで扱い、複数あるときは展開して切り替える。
import AstalWp from "gi://AstalWp?version=0.1"
import Pango from "gi://Pango?version=1.0"
import { Gtk } from "ags/gtk4"
import { type Accessor, createBinding, createState, For, With } from "ags"

function EndpointRow({
  endpoint,
  endpoints,
  muteTooltip,
}: {
  endpoint: Accessor<AstalWp.Endpoint>
  endpoints: Accessor<AstalWp.Endpoint[]>
  muteTooltip: string
}) {
  const [expanded, setExpanded] = createState(false)

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={4} visible={endpoints((l) => l.length > 0)}>
      <With value={endpoint}>
        {(current) =>
          current && (
            <box spacing={8}>
              <button
                class="flat"
                tooltipText={muteTooltip}
                onClicked={() => (current.mute = !current.mute)}
              >
                <image iconName={createBinding(current, "volumeIcon")} />
              </button>
              <slider
                hexpand
                valign={Gtk.Align.CENTER}
                value={createBinding(current, "volume")}
                onChangeValue={({ value }) => current.set_volume(value)}
              />
              {/* デバイスが 2 台以上のときだけ切り替え一覧の開閉ボタンを出す */}
              <button
                class="flat"
                visible={endpoints((l) => l.length > 1)}
                onClicked={() => setExpanded((e) => !e)}
              >
                <image
                  iconName={expanded((e) => (e ? "pan-up-symbolic" : "pan-down-symbolic"))}
                />
              </button>
            </box>
          )
        }
      </With>
      <revealer revealChild={expanded}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="endpoint-list">
          <For each={endpoints}>
            {(dev) => (
              <button class="flat endpoint-row" onClicked={() => (dev.isDefault = true)}>
                <box spacing={8}>
                  <label
                    hexpand
                    halign={Gtk.Align.START}
                    xalign={0}
                    ellipsize={Pango.EllipsizeMode.END}
                    // 長いデバイス名で popover の自然幅が広がり、位置がずれるのを防ぐ
                    maxWidthChars={32}
                    label={createBinding(dev, "description")((d) => d || dev.name || "")}
                  />
                  <image
                    iconName="object-select-symbolic"
                    visible={createBinding(dev, "isDefault")}
                  />
                </box>
              </button>
            )}
          </For>
        </box>
      </revealer>
    </box>
  )
}

export default function Sliders() {
  const audio = AstalWp.get_default()!.audio

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8} class="cc-sliders">
      <EndpointRow
        muteTooltip="出力のミュート切り替え"
        endpoint={createBinding(audio, "defaultSpeaker")}
        endpoints={createBinding(audio, "speakers")((l) => l ?? [])}
      />
      <EndpointRow
        muteTooltip="マイクのミュート切り替え"
        endpoint={createBinding(audio, "defaultMicrophone")}
        endpoints={createBinding(audio, "microphones")((l) => l ?? [])}
      />
    </box>
  )
}
