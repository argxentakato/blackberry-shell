// 時計 (毎秒更新。クリックでカレンダーを開く)
import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import { createPoll } from "ags/time"
import { config } from "../config"

export default function Clock({ format = config.clock.format }) {
  // 表示中の文字列を定期的に再計算して更新する
  const time = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format(format)!,
  )

  // menubutton に popover を添えることで、クリックでカレンダーを開閉できる
  return (
    <menubutton class="clock">
      <label label={time} />
      <popover class="clock-popover">
        <box>
          <Gtk.Calendar />
        </box>
      </popover>
    </menubutton>
  )
}
