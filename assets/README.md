# Assets

このディレクトリには以下のアセットファイルが必要です：

- `icon.png` - アプリアイコン (1024x1024)
- `splash.png` - スプラッシュ画面 (1284x2778)
- `adaptive-icon.png` - Androidアダプティブアイコン (1024x1024)
- `favicon.png` - Webファビコン (48x48)
- `notification-icon.png` - 通知アイコン (96x96)

## 一時的な対応

開発中はExpoのデフォルトアイコンが使用されます。
本番リリース前にこれらのアセットを追加してください。

## アイコン生成ツール

Expoの公式ツールを使用できます：
```bash
npx expo-optimize
```
