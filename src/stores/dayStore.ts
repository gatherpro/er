import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayPlan, Task, DailyDial, TaskStatus, Priority } from '../types';
import { scheduleTaskNotifications, cancelAllNotifications } from '../services/notifications';

interface DayStore {
  currentPlan: DayPlan | null;
  isEmergencyStopped: boolean;

  // Actions
  createDayPlan: (morningInput: string, dial: DailyDial, tasks: Task[]) => Promise<void>;
  updateDial: (dial: DailyDial) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  transitionToNext: (currentTaskId: string) => Promise<void>;
  emergencyStop: () => Promise<void>;
  resumeFromStop: () => Promise<void>;
  initializeNotifications: () => void;
  loadTodaysPlan: () => Promise<void>;

  // Dial-aware logic
  canSnooze: (taskId: string) => boolean;
  getRemainingSnoozes: (taskId: string) => number;
}

export const useDayStore = create<DayStore>((set, get) => ({
  currentPlan: null,
  isEmergencyStopped: false,

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

  transitionToNext: async (currentTaskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    const currentTask = currentPlan.tasks.find(t => t.id === currentTaskId);
    if (!currentTask) return;

    // 分岐チェック
    let nextTaskId: string | null = null;
    if (currentTask.branch) {
      // 簡易分岐ロジック（時刻チェックなど）
      const condition = currentTask.branch.condition;
      if (condition.type === 'time_check') {
        const now = new Date();
        const checkTime = new Date(condition.time);
        nextTaskId = now < checkTime ? currentTask.branch.onTrue : currentTask.branch.onFalse;
      } else {
        // デフォルトは onTrue
        nextTaskId = currentTask.branch.onTrue;
      }
    } else {
      // 優先度順に次のタスクを探す
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

    if (nextTaskId) {
      await get().startTask(nextTaskId);
    } else {
      // 全タスク完了
      const updatedPlan = { ...currentPlan, currentTaskId: null, isActive: false };
      set({ currentPlan: updatedPlan });
      await AsyncStorage.setItem('currentPlan', JSON.stringify(updatedPlan));
    }
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

  canSnooze: (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return false;

    const dial = currentPlan.dial;
    // ここでスヌーズカウントを管理（簡易版）
    if (dial === 'boss') return false;
    if (dial === 'coach') return true; // 1回まで（要実装）
    if (dial === 'gentle') return true; // 2回まで（要実装）

    return false;
  },

  getRemainingSnoozes: (taskId) => {
    const { currentPlan } = get();
    if (!currentPlan) return 0;

    const dial = currentPlan.dial;
    if (dial === 'boss') return 0;
    if (dial === 'coach') return 1;
    if (dial === 'gentle') return 2;

    return 0;
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
