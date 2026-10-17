// コントロールセンターの音楽プレイヤー (Mopidy)。繋がらないときは非表示にする。
import Pango from "gi://Pango?version=1.0"
import { Gtk } from "ags/gtk4"
import { With } from "ags"
import { music, next, previous, togglePlayback } from "../../mopidy"
import { albumArt } from "../../albumart"

function formatTime(seconds: number) {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export default function MusicPlayer() {
  const title = music((s) => s.title || (s.state === "stop" ? "停止中" : "不明な曲"))
  const subtitle = music((s) => [s.artist, s.album].filter(Boolean).join(" — "))
  const fraction = music((s) => (s.duration > 0 ? Math.min(s.elapsed / s.duration, 1) : 0))

  return (
    <box
      class="cc-music"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
      visible={music((s) => s.online)}
    >
      <box spacing={10}>
        {/* Overlay は主な子だけでサイズを決めるので、大きな画像でも popover の幅が広がらない */}
        <overlay
          class="music-art"
          widthRequest={64}
          heightRequest={64}
          overflow={Gtk.Overflow.HIDDEN}
          valign={Gtk.Align.CENTER}
        >
          <image iconName="audio-x-generic-symbolic" pixelSize={32} />
          <With value={albumArt}>
            {(texture) =>
              texture && (
                <Gtk.Picture
                  $type="overlay"
                  paintable={texture}
                  contentFit={Gtk.ContentFit.COVER}
                />
              )
            }
          </With>
        </overlay>
        <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER}>
          <label
            class="music-title"
            halign={Gtk.Align.START}
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            maxWidthChars={20}
            label={title}
          />
          <label
            class="music-subtitle"
            halign={Gtk.Align.START}
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            maxWidthChars={20}
            visible={subtitle((t) => t !== "")}
            label={subtitle}
          />
        </box>
        <box spacing={2}>
          <button class="flat" tooltipText="前の曲" onClicked={previous}>
            <image iconName="media-skip-backward-symbolic" />
          </button>
          <button class="flat" tooltipText="再生 / 一時停止" onClicked={togglePlayback}>
            <image
              iconName={music((s) =>
                s.state === "play" ? "media-playback-pause-symbolic" : "media-playback-start-symbolic",
              )}
            />
          </button>
          <button class="flat" tooltipText="次の曲" onClicked={next}>
            <image iconName="media-skip-forward-symbolic" />
          </button>
        </box>
      </box>
      <Gtk.ProgressBar fraction={fraction} />
      <box>
        <label class="music-time" hexpand halign={Gtk.Align.START} label={music((s) => formatTime(s.elapsed))} />
        <label class="music-time" label={music((s) => formatTime(s.duration))} />
      </box>
    </box>
  )
}
