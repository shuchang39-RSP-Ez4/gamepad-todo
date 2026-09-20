# 🏰 夏休みの宿題クエスト (Summer Homework Quest)

レトロRPG風のUIとゲームパッド操作で、夏休みの宿題を楽しく継続できるタスク管理アプリです。

## 🎯 アプリの目的
夏休みの宿題という長期的なプロジェクトに対し、ゲーミフィケーション（ゲーム要素）と視覚的な進捗管理（バーンダウンチャート）を取り入れることで、子どもの自発的な学習意欲と継続をサポートすることを目的としています。

## 🚀 主な特徴・アピールポイント

### 🎮 エンタメ×アクセシビリティ
キーボード操作だけでなく、**Gamepad API**を用いてゲームパッドでの完全操作に対応。10ft UI（テレビ画面での利用）も考慮し、面倒な作業をゲーム体験に昇華させました。

### 📊 カレンダー連動型バーンダウンチャート
重いグラフライブラリを使わず、**HTML5 SVG**を用いてカスタム描画。
1.  夏休みの期間（開始日〜終了日）に応じたX軸の自動スケーリング
2.  **土日祝日のカラーハイライト**（土曜：青、日曜・祝日：赤）
3.  日々の進捗に応じて階段状に右下へ進む**「実績ステップグラフ」**
4.  視認性の高い20刻みのY軸目盛りとグリッド線

### 👨‍👩‍👧‍👦 実用的なモード管理
*   **子どもモード**：クエスト（宿題）の選択とポイント消化に集中できるシンプルUI。
*   **親モード**：夏休みの期間設定、新しい宿題・ポイントの追加、削除が可能な管理画面（LocalStorageで永続化）。

## 🛠️ 開発環境・技術スタック
*   **Language / Framework**: React, TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Key Features**: Gamepad API, Web Audio API (SE), LocalStorage API

## 📸 スクリーンショット
<img width="1920" height="1020" alt="gamepad-todo_img01" src="https://github.com/user-attachments/assets/b5aca95d-39d3-442f-ad5e-b000fcc5c162" />
<img width="1920" height="1020" alt="gamepad-todo_img02" src="https://github.com/user-attachments/assets/5f896036-a3ae-4ce6-a9d1-b034c36e6d31" />
<img width="1600" height="896" alt="gamepad-todo_img03" src="https://github.com/user-attachments/assets/03ff988c-6075-43b2-9a31-c4750d1d1f46" />

## 👨‍💻 開発プロセス
*   **企画〜実装**: 約1人日の集中開発で構築。
*   **AI活用**: 設計やアルゴリズムの壁打ち、コードの最適化にAIを開発パートナーとして活用し、短期間での高品質な実装を実現しました。

## 🚀 デモ
（もしVercel等でデモ環境を公開していれば、そのURLをここに貼ってください）
