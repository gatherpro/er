import { Task, Priority } from '../types';
import { dayTemplates } from './templates';

/**
 * 朝の一文からタスクを生成（簡易版）
 *
 * 将来的には自然言語処理APIで置き換え予定
 * 現在は：
 * 1. テンプレートマッチング
 * 2. キーワード検出
 * 3. デフォルトタスク生成
 */
export function generateTasksFromInput(morningInput: string): Task[] {
  const input = morningInput.toLowerCase();

  // テンプレートマッチング
  for (const template of dayTemplates) {
    if (
      input.includes(template.name.toLowerCase()) ||
      isTemplateLike(input, template)
    ) {
      return convertTemplateToTasks(template);
    }
  }

  // キーワードベースの簡易生成
  const detectedTasks: Task[] = [];

  // 締切キーワード
  if (
    input.includes('締切') ||
    input.includes('納期') ||
    input.includes('提出')
  ) {
    detectedTasks.push(
      createTask({
        title: '締切案件対応',
        estimatedMinutes: 120,
        priority: 'deadline',
        deadline: getEndOfDay(),
      })
    );
  }

  // 移動キーワード
  if (
    input.includes('移動') ||
    input.includes('外出') ||
    input.includes('訪問')
  ) {
    detectedTasks.push(
      createTask({
        title: '移動・外出',
        estimatedMinutes: 90,
        priority: 'travel',
      })
    );
  }

  // ミーティングキーワード
  const meetingCount = countOccurrences(input, [
    'ミーティング',
    'mtg',
    '打ち合わせ',
    '会議',
  ]);
  for (let i = 0; i < meetingCount; i++) {
    detectedTasks.push(
      createTask({
        title: `ミーティング ${i + 1}`,
        estimatedMinutes: 60,
        priority: 'meeting',
      })
    );
  }

  // 作業系キーワード
  if (
    input.includes('資料') ||
    input.includes('作成') ||
    input.includes('準備')
  ) {
    detectedTasks.push(
      createTask({
        title: '資料作成・準備作業',
        estimatedMinutes: 90,
        priority: 'desk',
      })
    );
  }

  if (input.includes('メール') || input.includes('返信')) {
    detectedTasks.push(
      createTask({
        title: 'メール確認・返信',
        estimatedMinutes: 30,
        priority: 'desk',
      })
    );
  }

  // タスクが検出されなかった場合はデフォルト
  if (detectedTasks.length === 0) {
    return getDefaultTasks();
  }

  // タスクをソート（優先度順）
  return sortTasksByPriority(detectedTasks);
}

function isTemplateLike(input: string, template: DayTemplate): boolean {
  const keywords = template.description.toLowerCase().split(/[、。・]/);
  let matchCount = 0;

  for (const keyword of keywords) {
    if (input.includes(keyword.trim())) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}

function convertTemplateToTasks(template: DayTemplate): Task[] {
  return template.defaultTasks.map((t, index) =>
    createTask({
      ...t,
      startTime: calculateStartTime(index, template.defaultTasks),
    })
  );
}

function createTask(
  partial: Partial<Task> & { title: string; priority: Priority }
): Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    ...partial,
  } as Task;
}

function calculateStartTime(
  index: number,
  tasks: any[]
): Date | undefined {
  const now = new Date();
  const startHour = 9; // 9時スタート

  let totalMinutes = 0;
  for (let i = 0; i < index; i++) {
    totalMinutes += tasks[i].estimatedMinutes || 0;
  }

  const startTime = new Date(now);
  startTime.setHours(startHour, 0, 0, 0);
  startTime.setMinutes(startTime.getMinutes() + totalMinutes);

  return startTime;
}

function countOccurrences(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  return Math.max(count, 1); // 最低1つ
}

function getEndOfDay(): Date {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function getDefaultTasks(): Task[] {
  const now = new Date();
  const startHour = 9;

  return [
    createTask({
      title: '朝のタスク確認',
      estimatedMinutes: 30,
      priority: 'desk',
      startTime: new Date(now.setHours(startHour, 0, 0, 0)),
    }),
    createTask({
      title: '午前の作業',
      estimatedMinutes: 120,
      priority: 'desk',
      startTime: new Date(now.setHours(startHour, 30, 0, 0)),
    }),
    createTask({
      title: '昼休み',
      estimatedMinutes: 60,
      priority: 'desk',
      startTime: new Date(now.setHours(12, 30, 0, 0)),
    }),
    createTask({
      title: '午後の作業',
      estimatedMinutes: 120,
      priority: 'desk',
      startTime: new Date(now.setHours(13, 30, 0, 0)),
    }),
    createTask({
      title: '今日のまとめ',
      estimatedMinutes: 30,
      priority: 'desk',
      startTime: new Date(now.setHours(17, 0, 0, 0)),
    }),
  ];
}

function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Priority[] = ['deadline', 'travel', 'meeting', 'desk'];

  return tasks.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.priority);
    const bPriority = priorityOrder.indexOf(b.priority);
    return aPriority - bPriority;
  });
}
