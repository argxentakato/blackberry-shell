// 通知の状態管理。
// Notifd が保持するのは「未解決の通知」だけで、タイムアウトや閉じる操作で消えてしまう。
// そこでポップアップ (一時表示) と履歴 (通知センター) をシェル側で別々に持つ。
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import { createState } from "ags"
import { config } from "../config"

type Notification = AstalNotifd.Notification

const { defaultTimeout, maxHistory } = config.notifications

const [history, setHistory] = createState<Notification[]>([])
const [popups, setPopups] = createState<Notification[]>([])

const without = (list: Notification[], id: number) =>
  list.filter((n) => n.id !== id)

// 未解決のときだけ Notifd 側にも閉じたことを伝える (解決済みは null が返る)
function resolveInDaemon(id: number) {
  AstalNotifd.get_default().get_notification(id)?.dismiss()
}

export { history, popups }

export function initNotificationStore() {
  const notifd = AstalNotifd.get_default()
  notifd.defaultTimeout = defaultTimeout

  notifd.connect("notified", (_, id) => {
    const n = notifd.get_notification(id)
    if (!n) return
    // 同じ id の再通知 (置き換え) は古い方を除いて先頭に入れ直す
    setHistory((prev) => [n, ...without(prev, id)].slice(0, maxHistory))
    // サイレントモード中はポップアップを出さず履歴にだけ残す
    if (notifd.dontDisturb) return
    setPopups((prev) => [n, ...without(prev, id)])
  })

  // タイムアウトや送信元からのクローズ。ポップアップだけ消し、履歴には残す
  notifd.connect("resolved", (_, id) => {
    setPopups((prev) => without(prev, id))
  })
}

// ポップアップだけ閉じる (履歴には残る)
export function hidePopup(id: number) {
  setPopups((prev) => without(prev, id))
  resolveInDaemon(id)
}

// 履歴から削除する (ポップアップも同時に消える)
export function removeFromHistory(id: number) {
  setHistory((prev) => without(prev, id))
  setPopups((prev) => without(prev, id))
  resolveInDaemon(id)
}

export function clearHistory() {
  history.peek().forEach((n) => resolveInDaemon(n.id))
  setHistory([])
  setPopups([])
}
