{
  description = "My Awesome Desktop Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    pname = "my-shell";
    entry = "app.ts";

    # シェルに注入する設定 (widget/config.ts の Config と同じ構造)。
    # 省略したキーは config.ts の既定値が使われる
    shellConfig = {
      mopidyUrl = "http://localhost:6680";
      apps = {
        bluetooth = "overskride";
        network = "nm-connection-editor";
      };
      notifications = {
        defaultTimeout = 5000;
        maxHistory = 100;
      };
      clock.format = "%H:%M";
    };
    configFile = pkgs.writeText "${pname}-config.json" (builtins.toJSON shellConfig);

    # シェルが使用する Astal ライブラリ群
    # - hyprland: Hyprland IPC (ワークスペース・ウィンドウ一覧)
    # - tray: StatusNotifierItem によるシステムトレイ
    # - notifd: 通知デーモン (org.freedesktop.Notifications) としての実装
    # - network: Wi-Fi 制御 (NetworkManager)
    # - bluetooth: Bluetooth 制御 (BlueZ)
    # - wireplumber: オーディオ出力/入力・音量制御
    astalPackages = with ags.packages.${system}; [
      io
      astal4 # or astal3 for gtk3
      hyprland
      tray
      notifd
      network
      bluetooth
      wireplumber
    ];

    extraPackages =
      astalPackages
      ++ [
        pkgs.libadwaita
        pkgs.libsoup_3
        # https (Spotify のアルバムアートなど) に必要な GIO の TLS バックエンド
        pkgs.glib-networking
      ];
  in {
    packages.${system} = {
      default = pkgs.stdenv.mkDerivation {
        name = pname;
        src = ./.;

        nativeBuildInputs = with pkgs; [
          wrapGAppsHook3
          gobject-introspection
          ags.packages.${system}.default
        ];

        buildInputs = extraPackages ++ [pkgs.gjs];

        preFixup = ''
          gappsWrapperArgs+=(--set BLACKBERRY_SHELL_CONFIG ${configFile})
        '';

        installPhase = ''
          runHook preInstall

          mkdir -p $out/bin
          mkdir -p $out/share
          cp -r * $out/share
          ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

          runHook postInstall
        '';
      };
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        BLACKBERRY_SHELL_CONFIG = configFile;

        buildInputs = [
          (ags.packages.${system}.default.override {
            inherit extraPackages;
          })
          # 型チェック (tsc) 用。ags の型定義は TypeScript 5 系に合わせて生成されている
          pkgs.nodejs
          pkgs.typescript_5
        ];
      };
    };
  };
}
