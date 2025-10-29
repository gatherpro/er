import { DayTemplate } from '../types';

export const dayTemplates: DayTemplate[] = [
  {
    id: 'standard-work',
    name: '標準作業日',
    description: '午前：メール確認・資料作成、午後：ミーティング2つ、夕方：まとめ作業',
    defaultTasks: [
      {
        title: 'メール確認・返信',
        estimatedMinutes: 30,
        priority: 'desk',
      },
      {
        title: '資料作成',
        estimatedMinutes: 90,
        priority: 'desk',
      },
      {
        title: 'チームミーティング',
        estimatedMinutes: 60,
        priority: 'meeting',
      },
      {
        title: 'クライアント打ち合わせ',
        estimatedMinutes: 60,
        priority: 'meeting',
      },
      {
        title: '今日のまとめと明日の準備',
        estimatedMinutes: 30,
        priority: 'desk',
      },
    ],
  },
  {
    id: 'deadline-focus',
    name: '締切集中日',
    description: '締切案件に集中、午後イチで完成、その後レビュー',
    defaultTasks: [
      {
        title: '締切案件：集中作業',
        estimatedMinutes: 180,
        priority: 'deadline',
        checklist: [
          '要件の最終確認',
          'メイン機能の実装',
          'テストとバグ修正',
          'ドキュメント更新',
        ],
      },
      {
        title: '昼食・休憩',
        estimatedMinutes: 60,
        priority: 'desk',
      },
      {
        title: '最終チェックと提出',
        estimatedMinutes: 60,
        priority: 'deadline',
      },
      {
        title: 'フィードバック対応',
        estimatedMinutes: 90,
        priority: 'desk',
      },
    ],
  },
  {
    id: 'travel-day',
    name: '移動日',
    description: '午前：準備、移動、午後：現地作業、夕方：移動・まとめ',
    defaultTasks: [
      {
        title: '出発準備と資料確認',
        estimatedMinutes: 30,
        priority: 'desk',
      },
      {
        title: '移動（往路）',
        estimatedMinutes: 120,
        priority: 'travel',
      },
      {
        title: '現地でのミーティング',
        estimatedMinutes: 90,
        priority: 'meeting',
      },
      {
        title: '移動（復路）',
        estimatedMinutes: 120,
        priority: 'travel',
      },
      {
        title: '今日のまとめ',
        estimatedMinutes: 30,
        priority: 'desk',
      },
    ],
  },
  {
    id: 'meeting-heavy',
    name: 'ミーティング多め',
    description: 'ミーティング4本、合間に作業',
    defaultTasks: [
      {
        title: '朝会・今日の確認',
        estimatedMinutes: 30,
        priority: 'meeting',
      },
      {
        title: '集中作業タイム',
        estimatedMinutes: 90,
        priority: 'desk',
      },
      {
        title: 'プロジェクトMTG',
        estimatedMinutes: 60,
        priority: 'meeting',
      },
      {
        title: 'ランチMTG',
        estimatedMinutes: 60,
        priority: 'meeting',
      },
      {
        title: 'レビュー会',
        estimatedMinutes: 60,
        priority: 'meeting',
      },
      {
        title: '今日のタスク整理',
        estimatedMinutes: 30,
        priority: 'desk',
      },
    ],
  },
  {
    id: 'creative-flow',
    name: 'クリエイティブ集中',
    description: '午前：深い作業、午後：レビュー・調整',
    defaultTasks: [
      {
        title: 'ディープワーク（中断禁止）',
        estimatedMinutes: 150,
        priority: 'desk',
        description: '集中して創作作業',
      },
      {
        title: '休憩・リフレッシュ',
        estimatedMinutes: 30,
        priority: 'desk',
      },
      {
        title: '午前の成果物レビュー',
        estimatedMinutes: 60,
        priority: 'desk',
      },
      {
        title: '調整・ブラッシュアップ',
        estimatedMinutes: 90,
        priority: 'desk',
      },
      {
        title: '明日の準備',
        estimatedMinutes: 30,
        priority: 'desk',
      },
    ],
  },
];
