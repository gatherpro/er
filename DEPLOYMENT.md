# デプロイガイド

## 📱 デプロイ方法

このアプリは React Native + Expo で構築されており、複数のデプロイ方法があります。

### 方法1: Expo Go での開発版テスト（最も簡単）

**必要なもの**
- スマートフォン（iOS または Android）
- Expo Go アプリ

**手順**

1. **依存関係のインストール**
```bash
cd /home/user/er
npm install
```

2. **開発サーバーの起動**
```bash
npm start
```

3. **スマートフォンでアクセス**
   - iOS: カメラアプリでQRコードをスキャン
   - Android: Expo Go アプリ内でQRコードをスキャン

**制限事項**
- Expo Go環境での実行のため、一部のネイティブ機能に制限あり
- 通知機能は制限される可能性あり

---

### 方法2: EAS Build でビルド（推奨：本番向け）

**必要なもの**
- Expo アカウント
- EAS CLI

**手順**

1. **EAS CLI のインストール**
```bash
npm install -g eas-cli
```

2. **Expo にログイン**
```bash
eas login
```

3. **プロジェクトの設定**
```bash
eas build:configure
```

4. **ビルド実行**

**iOSの場合（シミュレーター用）**
```bash
eas build --platform ios --profile development
```

**Androidの場合（APK）**
```bash
eas build --platform android --profile preview
```

**本番ビルド**
```bash
# iOS（App Store用）
eas build --platform ios --profile production

# Android（Google Play用）
eas build --platform android --profile production
```

5. **ビルド完了後**
- iOS: ダウンロードしてシミュレーターにインストール、またはTestFlightで配信
- Android: APKをダウンロードして直接インストール、またはGoogle Playで配信

---

### 方法3: TestFlight / Google Play での配信

**TestFlight（iOS）**

1. EAS Buildで本番ビルドを作成
```bash
eas build --platform ios --profile production
```

2. ビルド完了後、ipaファイルをApp Store Connectにアップロード
```bash
eas submit --platform ios
```

3. TestFlightでテスターを招待

**Google Play（Android）**

1. EAS Buildで本番ビルドを作成
```bash
eas build --platform android --profile production
```

2. AABファイルをGoogle Play Consoleにアップロード
```bash
eas submit --platform android
```

3. 内部テストトラックで配信

---

## 🚀 簡易デプロイ（ローカル実行）

開発中の最も簡単な方法：

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm start

# または個別プラットフォーム
npm run ios      # iOSシミュレーター
npm run android  # Androidエミュレーター
npm run web      # Webブラウザ（開発用）
```

---

## 📋 デプロイ前のチェックリスト

- [ ] `npm install` が成功する
- [ ] `npm start` でエラーなく起動する
- [ ] 基本的な画面遷移が動作する
- [ ] 通知権限のリクエストが表示される
- [ ] app.json の bundleIdentifier/package が正しい
- [ ] バージョン番号を更新

---

## 🔧 トラブルシューティング

### 「Module not found」エラー
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### iOS シミュレーターが起動しない
```bash
npx expo start --ios
```

### Android エミュレーターが起動しない
```bash
npx expo start --android
```

### 通知が動作しない
- 物理デバイスでテストしてください（シミュレーターでは通知機能が制限されます）
- 通知権限が許可されているか確認

---

## 📦 現在の設定

- **アプリ名**: 今日だけ自動運転
- **Slug**: day-autopilot
- **バージョン**: 1.0.0
- **Bundle ID (iOS)**: com.dayautopilot.app
- **Package (Android)**: com.dayautopilot.app

---

## 🌐 Expo での公開

Expo の公開機能を使って、誰でもアクセスできるURLを生成できます：

```bash
eas update --branch production
```

公開後、以下のURLでアクセス可能：
```
exp://exp.host/@あなたのユーザー名/day-autopilot
```

---

## 次のステップ

1. まず **Expo Go でテスト** してアプリの動作を確認
2. 問題なければ **EAS Build** で開発版ビルドを作成
3. TestFlight/Google Play で **内部テスト**を実施
4. フィードバックを反映して **本番リリース**

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
