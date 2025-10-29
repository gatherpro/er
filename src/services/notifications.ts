import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { DayPlan } from '../types';

// 通知の表示方法を設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// プッシュ通知トークンの取得
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('通知の許可が必要です。設定から許可してください。');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('物理デバイスでないとプッシュ通知は動作しません');
  }

  return token;
}

// タスクの通知をスケジュール
export async function scheduleTaskNotifications(plan: DayPlan) {
  // 既存の通知をキャンセル
  await cancelAllNotifications();

  const now = new Date();

  for (const task of plan.tasks) {
    if (task.status === 'completed' || task.status === 'skipped') {
      continue;
    }

    // タスク開始通知
    if (task.startTime) {
      const startTime = new Date(task.startTime);
      if (startTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: getNotificationTitle(plan.dial, 'start'),
            body: `${task.title} を始める時間です`,
            data: { taskId: task.id, type: 'start' },
            sound: getNotificationSound(plan.dial),
          },
          trigger: {
            date: startTime,
          },
        });

        // 終了5分前の警告（Coach/Bossのみ）
        if (plan.dial !== 'gentle') {
          const warningTime = new Date(startTime.getTime() + (task.estimatedMinutes - 5) * 60000);
          if (warningTime > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⏰ あと5分',
                body: `${task.title} の終了時刻が近づいています`,
                data: { taskId: task.id, type: 'warning' },
                sound: true,
              },
              trigger: {
                date: warningTime,
              },
            });
          }
        }

        // 終了時刻の強制トランジション通知
        const endTime = new Date(startTime.getTime() + task.estimatedMinutes * 60000);
        if (endTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: getNotificationTitle(plan.dial, 'transition'),
              body: getTransitionMessage(plan.dial, task.title),
              data: { taskId: task.id, type: 'transition' },
              sound: getNotificationSound(plan.dial),
              priority: plan.dial === 'boss' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: endTime,
            },
          });
        }
      }
    }

    // 締切通知
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const deadlineWarning = new Date(deadline.getTime() - 15 * 60000); // 15分前

      if (deadlineWarning > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 締切が近づいています',
            body: `${task.title} の締切まであと15分`,
            data: { taskId: task.id, type: 'deadline' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            date: deadlineWarning,
          },
        });
      }
    }
  }
}

// ダイヤルに応じた通知タイトル
function getNotificationTitle(dial: string, type: string): string {
  if (type === 'start') {
    if (dial === 'boss') return '🎯 タスク開始';
    if (dial === 'coach') return '💪 次のタスク';
    return '🌱 次のステップ';
  }

  if (type === 'transition') {
    if (dial === 'boss') return '⚡ 即座に次へ';
    if (dial === 'coach') return '👉 切り替え時間';
    return '✨ 次に進めます';
  }

  return 'タスク通知';
}

// ダイヤルに応じた遷移メッセージ
function getTransitionMessage(dial: string, taskTitle: string): string {
  if (dial === 'boss') {
    return `${taskTitle} は終了です。次のタスクに移ります。`;
  }
  if (dial === 'coach') {
    return `${taskTitle} の予定時間が過ぎました。次に進みましょう。`;
  }
  return `${taskTitle} お疲れ様でした。次のタスクへ進めます。`;
}

// ダイヤルに応じた通知音
function getNotificationSound(dial: string): boolean | string {
  if (dial === 'boss') return true; // 強いサウンド
  if (dial === 'coach') return true; // 通常サウンド
  return false; // Gentleは音なし
}

// 全通知をキャンセル
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// 通知タップ時のハンドラー
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
