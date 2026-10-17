// アプリランチャー (全画面オーバーレイ。検索バーで絞り込み、アイコンクリックで起動)
import Gio from "gi://Gio?version=2.0"
import GioUnix from "gi://GioUnix?version=2.0"
import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createState, createMemo, For, onCleanup } from "ags"
import Pango from "gi://Pango?version=1.0"

// Bar のスタートボタンが app.toggle_window で開閉するときのウィンドウ名
export const LAUNCHER_NAME = "launcher"

// 表示対象のアプリ一覧 (メニューに現れるもののみ。名前でソート)
function getApps(): Gio.AppInfo[] {
  return Gio.AppInfo.get_all()
    .filter((a) => a.should_show())
    .sort((a, b) => a.get_display_name().localeCompare(b.get_display_name()))
}

// アプリ検索用キーワード (Keywords キーや Exec 名も対象にする)
function keywords(appInfo: Gio.AppInfo): string[] {
  // get_all() が返す実体は DesktopAppInfo なので、キーワード取得用にキャストする
  const desktop = appInfo as unknown as GioUnix.DesktopAppInfo
  const extra = desktop.get_keywords?.() ?? []
  const exec = appInfo.get_executable()?.split("/").pop() ?? ""
  return [appInfo.get_name(), appInfo.get_display_name(), exec, ...extra]
}

// クエリに一致するか (部分一致・大小無視)
function matches(appInfo: Gio.AppInfo, query: string): boolean {
  return keywords(appInfo).some((k) => k.toLowerCase().includes(query))
}

// アプリのアイコン。ファイルパス指定のアイコンもあるので iconName ではなく gicon で渡す
function AppIcon({ appInfo }: { appInfo: Gio.AppInfo }) {
  const icon = appInfo.get_icon()
  return icon ? (
    <image pixelSize={48} gicon={icon} />
  ) : (
    <image pixelSize={48} iconName="application-x-executable" />
  )
}

// アプリを起動する。files は GList 引数なので null ではなく空配列を渡す
function launchApp(appInfo: Gio.AppInfo) {
  try {
    appInfo.launch([], null)
  } catch (e) {
    console.error(`起動に失敗: ${appInfo.get_display_name()}`, e)
  }
}

// アプリ 1 件分のボタン (アイコン + 名前)
function AppButton({
  appInfo,
  onLaunch,
}: {
  appInfo: Gio.AppInfo
  onLaunch: () => void
}) {
  return (
    <button
      class="app-button"
      tooltipText={appInfo.get_display_name()}
      onClicked={() => {
        launchApp(appInfo)
        onLaunch()
      }}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        <AppIcon appInfo={appInfo} />
        <label
          label={appInfo.get_display_name()}
          wrap
          justify={Gtk.Justification.CENTER}
          ellipsize={Pango.EllipsizeMode.END}
          maxWidthChars={14}
          lines={2}
        />
      </box>
    </button>
  )
}

export default function Launcher() {
  const { TOP, RIGHT, BOTTOM, LEFT } = Astal.WindowAnchor

  // 検索クエリと結果 (createMemo で query 変更時に再計算)
  const [query, setQuery] = createState("")
  const apps = createMemo(getApps)
  const results = createMemo(() => {
    const q = query().toLowerCase().trim()
    if (!q) return apps()
    return apps().filter((a) => matches(a, q))
  })

  // 検索ボックス (window の $ から参照するため先に宣言する)
  let entry: Gtk.Entry

  let win: Astal.Window

  const close = () => (win.visible = false)

  // For 経由ではなく setup で一度だけ生成されるが、アプリ終了時などに
  // 明示的に破棄できるよう cleanup を張っておく。
  // JSX 式自体の型は GObject.Object になるので、$ 経由で実体を保持する
  onCleanup(() => win.destroy())

  return (
    <window
      // 非表示で生成し、バーのスタートボタン (app.toggle_window) で開閉する
      name={LAUNCHER_NAME}
      namespace="launcher"
      class="Launcher"
      application={app}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      anchor={TOP | RIGHT | BOTTOM | LEFT}
      $={(self) => {
        // JSX 式自体の型は GObject.Object になるので、$ 経由で実体を保持する
        win = self

        // ESC で閉じる
        const keyController = new Gtk.EventControllerKey()
        keyController.connect("key-pressed", (_, keyval) => {
          if (keyval === Gdk.KEY_Escape) close()
        })
        self.add_controller(keyController)

        // 表示されたときは検索をリセットしてフォーカスする
        self.connect("notify::visible", () => {
          if (!self.visible) return
          setQuery("")
          entry.text = ""
          entry.grab_focus()
        })
      }}
    >
      <overlay>
        {/* 背景 (コンテンツ外をクリックしたら閉じる) */}
        <box
          class="launcher-backdrop"
          $={(self) => {
            const gesture = new Gtk.GestureClick()
            gesture.connect("pressed", () => close())
            self.add_controller(gesture)
          }}
        />
        {/* 前景: 検索バーとアプリグリッド */}
        <box
          vexpand
          valign={Gtk.Align.START}
          halign={Gtk.Align.CENTER}
          marginTop={128}
          class="launcher-content"
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
        >
          <entry
            $={(self) => {
              entry = self
              self.placeholderText = "アプリを検索"
            }}
            onNotifyText={(self) => setQuery(self.text)}
            // Enter で最初の候補を起動する
            onActivate={() => {
              const first = results.peek()[0]
              if (!first) return
              launchApp(first)
              close()
            }}
          />
          <scrolledwindow
            vexpand
            hscrollbarPolicy={Gtk.PolicyType.NEVER}
            minContentHeight={360}
          >
            {/* 検索結果グリッド (FlowBox が子を自動で FlowBoxChild に包む) */}
            <Gtk.FlowBox
              selectionMode={Gtk.SelectionMode.NONE}
              maxChildrenPerLine={6}
              homogeneous
              valign={Gtk.Align.START}
              class="app-grid"
            >
              <For each={results}>
                {(a) => <AppButton appInfo={a} onLaunch={close} />}
              </For>
            </Gtk.FlowBox>
          </scrolledwindow>
          {/* ScrolledWindow の子は 1 つだけなので、プレースホルダは外に置く */}
          <label
            class="placeholder"
            visible={results((list) => list.length === 0)}
            label="該当するアプリがありません"
          />
        </box>
      </overlay>
    </window>
  )
}
