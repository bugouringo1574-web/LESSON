# おうちタスク 🌸

お母さんと自分の2人で、「言われたこと・やること」を共有して管理するWebアプリです。

- Googleログイン（Firebase Authentication）
- おうちコードを2人で合わせると同じリストを共有
- タスク登録／期限／担当（じぶん・お母さん）／完了チェック／削除
- リアルタイム同期（Firestore）
- パステルピンクの配色・スマホ対応

## 使っている技術
素のHTML / CSS / JavaScript（ESモジュール）＋ Firebase（Auth・Firestore）。ビルド不要なので GitHub Pages にそのまま置けます。

---

## セットアップ手順

### 1. Firebase プロジェクトを作る
1. https://console.firebase.google.com/ で「プロジェクトを追加」
2. 左メニュー **Authentication** → 始める → **Google** を有効化
3. 左メニュー **Firestore Database** → データベースを作成（本番モード・リージョンは asia-northeast1）
4. プロジェクト設定 → マイアプリ → **ウェブ（</>）** を追加して、表示された `firebaseConfig` をコピー

### 2. 設定を貼り付ける
`firebase-config.js` の中身をコピーした値に置き換えます。
（このキーは公開して問題ありません。守るのはセキュリティルールです）

### 3. セキュリティルールを設定
Firestore の「ルール」タブに `firestore.rules` の内容を貼り付けて公開します。

### 4. メンバー登録（初回だけ）
このルールでは `rooms/{おうちコード}/members/{自分のUID}` というドキュメントが必要です。
一番簡単な方法：Firebase コンソール → Firestore → 手動でコレクション `rooms` →
ドキュメントID に **おうちコード**（例 `sato-house`）→ サブコレクション `members` →
ドキュメントID に **自分のUID**（Authentication のユーザー一覧で確認できます）を作成。
お母さんの分も、一度ログインしてもらってUIDが出たら同じように追加してください。

> まず動作確認だけしたい場合は、ルールを一時的に
> `allow read, write: if request.auth != null;` にしてもOKです（後で必ず戻す）。

### 5. GitHub Pages で公開
```bash
cd home-task-app
git init
git add .
git commit -m "おうちタスクアプリ"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```
GitHub のリポジトリ → **Settings → Pages** → Source を `main` / `(root)` にして保存。
数分後 `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

最後に Firebase コンソール → Authentication → Settings → **承認済みドメイン** に
`<ユーザー名>.github.io` を追加してください（これを忘れるとログインできません）。

## データ構造
```
rooms/{roomId}/members/{uid}
rooms/{roomId}/tasks/{taskId}
  title      文字列   やること
  due        文字列   期限 (YYYY-MM-DD、空でも可)
  forWhom    文字列   "me" | "mom"
  done       真偽値   完了したか
  createdBy  文字列   登録した人の名前
  createdAt  時刻
  doneAt     時刻     完了した時刻（記録用）
```
