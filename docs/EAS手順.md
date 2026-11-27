# EAS 手順（開発ビルドと Update）

MapLibre による地図タイル化と、知り合い・学内向けの内部配布の前提として、EAS の開発ビルドと EAS Update を使う。Expo アカウントは `koko-jyun15`、スラッグは `kumadai-sanpo`。アプリ ID は `com.gami19.kumadaisanpo`。

## 初回：EAS プロジェクトの紐づけ（未実施なら）

このリポジトリを初めて EAS に載せるときは、ローカルで Expo にログインしたうえで次を実行する。

```bash
npx eas-cli login
export EXPO_TOKEN=（Expo ダッシュボードで発行したトークン）
npx eas-cli init --non-interactive
```

`eas init` が `app.json` の `extra.eas.projectId` と `updates.url`（`https://u.expo.dev/<projectId>`）を埋める。いまはどちらも空欄なので、初回だけこの手順が必要。

## Apple Developer Program 加入後：iPhone 実機の開発ビルド

オーナーが Apple Developer Program に入ったあとで行う（今回の PR では実行しない）。

1. iPhone を登録する：`npx eas-cli device:create`
2. 開発ビルドを作る：`npm run build:dev:ios`（中身は `eas build --profile development --platform ios`）
3. ビルド完了メール／ダッシュボードのリンクから端末にインストールする
4. 以後は PC で `npm run start:dev-client`（`npx expo start --dev-client`）を起動し、開発ビルド側で接続する

iOS シミュレータ用は `npm run build:dev:sim`。Android 実機／エミュレータは `npm run build:dev:android`（Apple 資格情報は不要）。

## EAS Update（preview 配信）

ネイティブ変更が無く JS／アセットだけ差し替えるときは、ビルドし直さず Update で配る。

```bash
npm run update:preview
# または
npx eas-cli update --channel preview --message "要約"
```

`eas.json` の channel は development / preview / production。トンネル（`expo start --tunnel`）が 502 などで不安定なときも、Update なら Expo の CDN 経由で届くので、テスター確認は Update の方が安定しやすい。

## Expo Go と開発ビルドの違い

| | Expo Go | 開発ビルド（dev client） |
|---|---|---|
| 起動 | `npx expo start` → QR | 先に EAS で入れたアプリを開き、`npx expo start --dev-client` に接続 |
| 使えるネイティブ | Expo Go に入っているものだけ | `expo-dev-client` ＋ 追加したネイティブ（例: MapLibre） |
| このアプリでの位置づけ | いまの日常確認 | タイル地図・内部配布の前提 |

`expo-dev-client` / `expo-updates` を入れても Expo Go での起動は壊さない。MapLibre など Go に無いモジュールは、開発ビルドが揃うまで導入しない。

## 開発ビルド専用の機能（位置の上書きなど）

- 位置情報のモック／上書き、MapLibre、カスタムネイティブモジュールは開発ビルド（または preview／production ビルド）専用
- Expo Go では使えない／落ちる可能性があるので、該当コードは開発ビルド向けに分岐するか、導入タイミングを MapLibre 以降にそろえる
- 個人データ（現在地・お気に入り・訪問スタンプ）は端末内のみ。EAS や Cloudflare へ送る設定は足さない

## よく使うコマンド

```bash
npm run start:dev-client   # 開発ビルド向け Metro
npm run build:dev:ios      # iOS 実機（Apple 加入後）
npm run build:dev:sim      # iOS シミュレータ
npm run build:dev:android  # Android
npm run update:preview     # preview チャンネルへ Update
```
