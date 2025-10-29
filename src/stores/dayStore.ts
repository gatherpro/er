import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayPlan, Task, DailyDial, TaskStatus, Priority } from '../types';
import { scheduleTaskNotifications, cancelAllNotifications } from '../services/notifications';

interface DayStore {
  currentPlan: DayPlan | null;
  isEmergencyStopped: boolean;
  pendingBranchChoice: { taskId: string; options: string[] } | null;

  // Actions
  createDayPlan: (morningInput: string, dial: DailyDial, tasks: Task[]) => Promise<void>;
  updateDial: (dial: DailyDial) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  transitionToNext: (currentTaskId: string, branchChoice?: number) => Promise<void>;
  emergencyStop: () => Promise<void>;
  resumeFromStop: () => Promise<void>;
  initializeNotifications: () => void;
  loadTodaysPlan: () => Promise<void>;
  toggleChecklistItem: (taskId: string, index: number) => Promise<void>;
  snoozeTask: (taskId: string) => Promise<void>;
  makeBranchChoice: (choice: number) => Promise<void>;

  // Dial-aware logic
  canSnooze: (taskId: string) => boolean;
  getRemainingSnoozes: (taskId: string) => number;

  // Branch evaluation
  evaluateBranch: (task: Task, branchChoice?: number) => string | null;
}

export const useDayStore = create<DayStore>((set, get) => ({
  currentPlan: null,
  isEmergencyStopped: false,
  pendingBranchChoice: null,

  createDayPlan: async (morningInput, dial, tasks) => {
    const newPlan: DayPlan = {
      id: `plan-${Date.now()}`,
      date: new Date(),
      dial,
      morningInput,
      tasks: tasks.map(t => ({ ...t, status: 'pending' as TaskStatus })),
      currentTaskId: null,
      isActive: true,
      createdAt: new Date(),
    };

    set({ currentPlan: newPlan, isEmergencyStopped: false });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(newPlan));

    // 通知をスケジュール
    await scheduleTaskNotifications(newPlan);
  },

  updateDial: async (dial) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const updatedPlan = { ...currentPlan, dial };
    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));

    // 通知を再スケジュール
    await cancelAllNotifications();
    await scheduleTaskNotifications(updatedPlan);
  },

  startTask: async (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan || get().isEmergencyStopped) return;

    const updatedTasks = currentPlan.tasks.map(task =>
      task.id === taskId
        ? { ...task, status: 'active' as TaskStatus, startTime: new Date() }
        : task.status === 'active'
        ? { ...task, status: 'pending' as TaskStatus }
        : task
    );

    const updatedPlan = {
      ...currentPlan,
      tasks: updatedTasks,
      currentTaskId: taskId,
    };

    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));
  },

  completeTask: async (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Boss モードの場合、チェックリスト確認
    if (currentPlan.dial === 'boss' && task.checklist) {
      const allChecked = task.checklistCompleted?.every(c => c) ?? false;
      if (!allChecked) {
        console.log('Boss mode: Checklist not completed');
        return;
      }
    }

    const updatedTasks = currentPlan.tasks.map(t =>
      t.id === taskId
        ? { ...t, status: 'completed' as TaskStatus, endTime: new Date() }
        : t
    );

    const updatedPlan = { ...currentPlan, tasks: updatedTasks };
    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));

    // 自動遷移
    await get().transitionToNext(taskId);
  },

  skipTask: async (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const updatedTasks = currentPlan.tasks.map(t =>
      t.id === taskId ? { ...t, status: 'skipped' as TaskStatus } : t
    );

    const updatedPlan = { ...currentPlan, tasks: updatedTasks };
    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));
  },

  transitionToNext: async (currentTaskId, branchChoice) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const currentTask = currentPlan.tasks.find(t => t.id === currentTaskId);
    if (!currentTask) return;

    // 分岐評価
    const nextTaskId = get().evaluateBranch(currentTask, branchChoice);

    if (nextTaskId) {
      await get().startTask(nextTaskId);
    } else {
      // 全タスク完了
      const updatedPlan = { ...currentPlan, currentTaskId: null, isActive: false };
      set({ currentPlan: updatedPlan });
      await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));
    }
  },

  evaluateBranch: (task, branchChoice) => {
    const { currentPlan } = get();
    if (!currentPlan) return null;

    let nextTaskId: string | null = null;

    if (task.branch) {
      const condition = task.branch.condition;

      if (condition.type === 'time_check') {
        // 時刻チェック分岐
        const now = new Date();
        const checkTime = new Date(condition.time);
        nextTaskId = now < checkTime ? task.branch.onTrue : task.branch.onFalse;
      } else if (condition.type === 'completion_check') {
        // 完了状態チェック分岐
        const targetTask = currentPlan.tasks.find(t => t.id === condition.taskId);
        if (targetTask) {
          const isCompleted = targetTask.status === 'completed';
          nextTaskId = isCompleted ? task.branch.onTrue : task.branch.onFalse;
        } else {
          nextTaskId = task.branch.onFalse;
        }
      } else if (condition.type === 'manual_choice') {
        // 手動選択分岐
        if (branchChoice !== undefined && condition.options[branchChoice]) {
          // 選択肢に応じたタスクIDを取得
          // 簡易実装: onTrueが選択肢0、onFalseが選択肢1
          nextTaskId = branchChoice === 0 ? task.branch.onTrue : task.branch.onFalse;
        } else {
          // 選択待ち
          set({ pendingBranchChoice: { taskId: task.id, options: condition.options } });
          return null;
        }
      }
    } else {
      // 分岐なし：優先度順に次のタスクを探す
      const priorityOrder: Priority[] = ['deadline', 'travel', 'meeting', 'desk'];
      const pendingTasks = currentPlan.tasks.filter(t => t.status === 'pending');

      for (const priority of priorityOrder) {
        const nextTask = pendingTasks.find(t => t.priority === priority);
        if (nextTask) {
          nextTaskId = nextTask.id;
          break;
        }
      }
    }

    return nextTaskId;
  },

  makeBranchChoice: async (choice) => {
    const { pendingBranchChoice, currentPlan } = get();
    if (!pendingBranchChoice || !currentPlan) return;

    const taskId = pendingBranchChoice.taskId;
    set({ pendingBranchChoice: null });

    // 分岐選択を適用して遷移
    await get().transitionToNext(taskId, choice);
  },

  emergencyStop: async () => {
    set({ isEmergencyStopped: true });
    await cancelAllNotifications();
  },

  resumeFromStop: async () => {
    const { currentPlan } = get();
    set({ isEmergencyStopped: false });

    if (currentPlan) {
      await scheduleTaskNotifications(currentPlan);
    }
  },

  toggleChecklistItem: async (taskId, index) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const updatedTasks = currentPlan.tasks.map(task => {
      if (task.id === taskId && task.checklist) {
        const checklistCompleted = task.checklistCompleted || new Array(task.checklist.length).fill(false);
        checklistCompleted[index] = !checklistCompleted[index];
        return { ...task, checklistCompleted };
      }
      return task;
    });

    const updatedPlan = { ...currentPlan, tasks: updatedTasks };
    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));
  },

  snoozeTask: async (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan || !get().canSnooze(taskId)) return;

    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (!task) return;

    const snoozeCount = (task.snoozeCount || 0) + 1;
    const maxSnoozes = currentPlan.dial === 'gentle' ? 2 : 1;

    if (snoozeCount > maxSnoozes) return;

    const updatedTasks = currentPlan.tasks.map(t =>
      t.id === taskId ? { ...t, snoozeCount } : t
    );

    const updatedPlan = { ...currentPlan, tasks: updatedTasks };
    set({ currentPlan: updatedPlan });
    await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));

    // 5分後に再通知（簡易実装）
    // 実装は notifications.ts で行う
  },

  canSnooze: (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return false;

    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (!task) return false;

    const dial = currentPlan.dial;
    if (dial === 'boss') return false;

    const snoozeCount = task.snoozeCount || 0;
    const maxSnoozes = dial === 'gentle' ? 2 : 1;

    return snoozeCount < maxSnoozes;
  },

  getRemainingSnoozes: (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return 0;

    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (!task) return 0;

    const dial = currentPlan.dial;
    if (dial === 'boss') return 0;

    const snoozeCount = task.snoozeCount || 0;
    const maxSnoozes = dial === 'gentle' ? 2 : 1;

    return Math.max(0, maxSnoozes - snoozeCount);
  },

  initializeNotifications: () => {
    // 通知リスナーの初期化
    // 実装は notifications.ts で行う
  },

  loadTodaysPlan: async () => {
    try {
      const stored = await AsyncStorage.getItem('currentPlan');
      if (stored) {
        const plan = JSON.parse(stored) as DayPlan;
        const planDate = new Date(plan.date);
        const today = new Date();

        // 今日のプランかチェック
        if (
          planDate.getDate() === today.getDate() &&
          planDate.getMonth() === today.getMonth() &&
          planDate.getFullYear() === today.getFullYear()
        ) {
          set({ currentPlan: plan });
        } else {
          // 古いプランはクリア
          await AsyncStorage.removeItem('currentPlan');
        }
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
    }
  },
}));
