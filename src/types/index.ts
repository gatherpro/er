// 日次ダイヤル - 今日の強度
export type DailyDial = 'gentle' | 'coach' | 'boss';

// タスクの状態
export type TaskStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'overdue';

// タスクの優先度（強制トランジション順）
export type Priority = 'deadline' | 'travel' | 'meeting' | 'desk';

// 分岐条件の種類
export type BranchCondition =
  | { type: 'time_check'; time: string; label: string }
  | { type: 'completion_check'; taskId: string; label: string }
  | { type: 'manual_choice'; options: string[] };

// タスク定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  priority: Priority;
  startTime?: Date;
  endTime?: Date;
  deadline?: Date;
  status: TaskStatus;

  // 分岐設定
  branch?: {
    condition: BranchCondition;
    onTrue: string; // 次のタスクID
    onFalse: string; // 代替タスクID
  };

  // Boss モードのチェックリスト
  checklist?: string[];
  checklistCompleted?: boolean[];

  // スヌーズカウント
  snoozeCount?: number;
}

// 今日の計画
export interface DayPlan {
  id: string;
  date: Date;
  dial: DailyDial;
  morningInput: string; // 朝の一文
  tasks: Task[];
  currentTaskId: string | null;
  isActive: boolean;
  createdAt: Date;
}

// ダイヤル設定
export interface DialSettings {
  gentle: {
    snoozeCount: 2;
    notificationIntensity: 'low';
    overtimeHandling: 'split'; // 超過時は分割して後段へ
  };
  coach: {
    snoozeCount: 1;
    notificationIntensity: 'medium';
    overtimeHandling: 'compress_10'; // 10%圧縮＋分割
  };
  boss: {
    snoozeCount: 0;
    notificationIntensity: 'high';
    overtimeHandling: 'compress_30'; // 30%圧縮＋即切上げ
    requireChecklist: true; // チェックリスト通過必須
  };
}

// 通知設定
export interface NotificationConfig {
  taskId: string;
  scheduledTime: Date;
  type: 'start' | 'warning' | 'transition' | 'overtime';
  message: string;
}

// テンプレート（後で自然言語処理と置き換える部分）
export interface DayTemplate {
  id: string;
  name: string;
  description: string;
  defaultTasks: Omit<Task, 'id' | 'status'>[];
}
