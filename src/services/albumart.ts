// アルバムアート。Mopidy の core.library.get_images で画像 URL を得て、ダウンロードする。
// Spotify などの画像は https なので、実行環境に GIO の TLS バックエンド (glib-networking) が必要。
import Gdk from "gi://Gdk?version=4.0"
import { createState } from "ags"
import { fetch } from "ags/fetch"
import { MOPIDY_URL, music, rpc } from "./mopidy"

// 表示サイズ (64px) の 2 倍を目安に、これ以上で最小の画像を選ぶ
const WANTED_WIDTH = 128

interface MopidyImage {
  uri: string
  width?: number
}

// null は「画像なし」を意味し、通信エラー (キャッシュしない) とは区別する
const cache = new Map<string, Gdk.Texture | null>()

function pickImage(images: MopidyImage[]): MopidyImage | null {
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  return sorted.find((i) => (i.width ?? 0) >= WANTED_WIDTH) ?? sorted.at(-1) ?? null
}

async function loadArt(trackUri: string): Promise<Gdk.Texture | null> {
  const [images] = (await rpc([
    { method: "core.library.get_images", params: { uris: [trackUri] } },
  ])) as [Record<string, MopidyImage[]> | null]

  const image = pickImage(images?.[trackUri] ?? [])
  if (!image) return null

  // ローカル由来の画像は Mopidy 配信の相対パスで返る
  const url = image.uri.startsWith("/") ? `${MOPIDY_URL}${image.uri}` : image.uri
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)

  const bytes = await res.bytes()
  return bytes ? Gdk.Texture.new_from_bytes(bytes) : null
}

const [albumArt, setAlbumArt] = createState<Gdk.Texture | null>(null)
let current = ""

// 曲が変わったときだけ取得する (music は 1 秒ごとに通知してくる)
music.subscribe(() => {
  const uri = music.peek().uri
  if (uri === current) return
  current = uri

  // 取得を待つあいだ前の曲の画像を残さない
  setAlbumArt(cache.get(uri) ?? null)
  if (!uri || cache.has(uri)) return

  loadArt(uri)
    .then((texture) => {
      cache.set(uri, texture)
      if (current === uri) setAlbumArt(texture)
    })
    .catch((e) => console.error("アルバムアートの取得に失敗:", e))
})

export { albumArt }
