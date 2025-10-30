import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Card, Button, FAB, Chip, ProgressBar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDayStore } from '../stores/dayStore';
import { Task, DailyDial, Priority } from '../types';
import { format } from 'date-fns';
import { addNotificationResponseListener } from '../services/notifications';
import { BranchChoiceModal } from '../components/BranchChoiceModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TodayTimeline'>;
};

export function TodayTimelineScreen({ navigation }: Props) {
  const {
    currentPlan,
    isEmergencyStopped,
    pendingBranchChoice,
    startTask,
    completeTask,
    skipTask,
    emergencyStop,
    resumeFromStop,
    updateDial,
    makeBranchChoice,
  } = useDayStore();

  useEffect(() => {
    // 通知タップ時の処理
    const subscription = addNotificationResponseListener((response) => {
      const { taskId, type } = response.notification.request.content.data as {
        taskId: string;
        type: string;
      };

      if (type === 'transition') {
        // 強制トランジション
        completeTask(taskId);
      } else if (type === 'start') {
        // タスク開始
        startTask(taskId);
      }
    });

    return () => subscription.remove();
  }, []);

  if (!currentPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall">今日のプランがありません</Text>
        <Button
          mode="contained"
          onPress={() => navigation.replace('MorningInput')}
          style={styles.button}
        >
          新しいプランを作成
        </Button>
      </View>
    );
  }

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '緊急停止',
      'すべての通知を止めて一時停止しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '停止する',
          style: 'destructive',
          onPress: emergencyStop,
        },
      ]
    );
  };

  const handleDialChange = () => {
    Alert.alert(
      '強度を変更',
      '今日のダイヤルを変更しますか？（弱い方への変更のみ推奨）',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'Gentle',
          onPress: () => updateDial('gentle'),
        },
        {
          text: 'Coach',
          onPress: () => updateDial('coach'),
        },
        {
          text: 'Boss',
          onPress: () => updateDial('boss'),
        },
      ]
    );
  };

  const currentTask = currentPlan.tasks.find(
    (t) => t.id === currentPlan.currentTaskId
  );

  const completedCount = currentPlan.tasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const progress = completedCount / currentPlan.tasks.length;

  // 分岐先のタスクを取得する関数
  const getBranchTasks = (taskId: string): Task[] | undefined => {
    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (!task?.branch) return undefined;

    const trueTask = currentPlan.tasks.find(t => t.id === task.branch?.onTrue);
    const falseTask = currentPlan.tasks.find(t => t.id === task.branch?.onFalse);

    return [trueTask, falseTask].filter((t): t is Task => t !== undefined);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ヘッダー情報 */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text variant="labelSmall" style={styles.label}>
                  今日のダイヤル
                </Text>
                <Chip
                  icon={getDialEmoji(currentPlan.dial)}
                  onPress={handleDialChange}
                  style={[styles.dialChip, { backgroundColor: getDialColor(currentPlan.dial) }]}
                  textStyle={{ color: '#fff' }}
                >
                  {currentPlan.dial.toUpperCase()}
                </Chip>
              </View>
              <View style={styles.headerRight}>
                <Text variant="labelSmall" style={styles.label}>
                  進捗
                </Text>
                <Text variant="titleMedium">
                  {completedCount} / {currentPlan.tasks.length}
                </Text>
              </View>
            </View>
            <ProgressBar progress={progress} style={styles.progressBar} />
          </Card.Content>
        </Card>

        {/* 緊急停止中の警告 */}
        {isEmergencyStopped && (
          <Card style={styles.warningCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.warningTitle}>
                🛑 緊急停止中
              </Text>
              <Text variant="bodySmall" style={styles.warningText}>
                すべての通知が停止しています
              </Text>
              <Button
                mode="contained"
                onPress={resumeFromStop}
                style={styles.resumeButton}
              >
                再開する
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* 現在のタスク */}
        {currentTask && (
          <Card style={styles.currentTaskCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.label}>
                いまここ
              </Text>
              <Text variant="headlineSmall" style={styles.currentTaskTitle}>
                {currentTask.title}
              </Text>
              {currentTask.description && (
                <Text variant="bodyMedium" style={styles.currentTaskDescription}>
                  {currentTask.description}
                </Text>
              )}
              <View style={styles.taskActions}>
                <Button
                  mode="contained"
                  onPress={() => completeTask(currentTask.id)}
                  style={styles.actionButton}
                >
                  完了
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => skipTask(currentTask.id)}
                  style={styles.actionButton}
                >
                  スキップ
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* タイムライン */}
        <View style={styles.timelineSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            今日のライン
          </Text>
          {currentPlan.tasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleTaskPress(task.id)}
            >
              <TaskCard
                task={task}
                index={index}
                isActive={task.id === currentPlan.currentTaskId}
                allTasks={currentPlan.tasks}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 緊急停止FAB */}
      <FAB
        icon="stop"
        label="緊急停止"
        style={[
          styles.fab,
          isEmergencyStopped && styles.fabStopped,
        ]}
        onPress={handleEmergencyStop}
        color="#fff"
      />

      {/* 分岐選択モーダル */}
      <BranchChoiceModal
        visible={!!pendingBranchChoice}
        options={pendingBranchChoice?.options || []}
        tasks={pendingBranchChoice ? getBranchTasks(pendingBranchChoice.taskId) : undefined}
        onChoice={makeBranchChoice}
        onDismiss={() => {}}
      />
    </View>
  );
}

function TaskCard({ task, index, isActive, allTasks }: { task: Task; index: number; isActive: boolean; allTasks: Task[] }) {
  // 分岐先のタスクを取得
  const getTrueTask = () => task.branch ? allTasks.find(t => t.id === task.branch!.onTrue) : null;
  const getFalseTask = () => task.branch ? allTasks.find(t => t.id === task.branch!.onFalse) : null;

  // 分岐条件の説明を生成
  const getBranchDescription = () => {
    if (!task.branch) return null;

    const { condition } = task.branch;
    switch (condition.type) {
      case 'time_check':
        return `⏰ ${condition.time} で自動分岐`;
      case 'completion_check':
        return `✅ タスク完了状態で分岐`;
      case 'manual_choice':
        return `👆 手動選択`;
      default:
        return '🔀 分岐あり';
    }
  };

  return (
    <Card
      style={[
        styles.taskCard,
        isActive && styles.taskCardActive,
        task.status === 'completed' && styles.taskCardCompleted,
      ]}
    >
      <Card.Content>
        <View style={styles.taskCardHeader}>
          <Text variant="labelSmall" style={styles.taskNumber}>
            {index + 1}
          </Text>
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </View>
        <Text variant="titleMedium" style={styles.taskTitle}>
          {task.title}
        </Text>
        {task.estimatedMinutes && (
          <Text variant="bodySmall" style={styles.taskTime}>
            ⏱ {task.estimatedMinutes}分
          </Text>
        )}
        {task.deadline && (
          <Text variant="bodySmall" style={styles.taskDeadline}>
            🚨 {format(new Date(task.deadline), 'HH:mm')}まで
          </Text>
        )}

        {/* 分岐の詳細表示 */}
        {task.branch && (
          <View style={styles.branchContainer}>
            <View style={styles.branchHeader}>
              <Text variant="bodySmall" style={styles.branchDescription}>
                {getBranchDescription()}
              </Text>
            </View>
            <View style={styles.branchPaths}>
              {/* True パス */}
              <View style={styles.branchPath}>
                <View style={styles.branchPathHeader}>
                  <Text style={styles.branchPathIcon}>✓</Text>
                  <Text variant="labelSmall" style={styles.branchPathLabel}>
                    {task.branch.condition.type === 'time_check'
                      ? `${task.branch.condition.time}前`
                      : task.branch.condition.type === 'completion_check'
                      ? '完了済み'
                      : task.branch.condition.type === 'manual_choice'
                      ? task.branch.condition.options[0]
                      : 'Yes'}
                  </Text>
                </View>
                <View style={styles.branchArrow}>
                  <Text style={styles.branchArrowText}>↓</Text>
                </View>
                <View style={styles.branchTaskPreview}>
                  <Text variant="bodySmall" style={styles.branchTaskTitle} numberOfLines={1}>
                    {getTrueTask()?.title || '次のタスク'}
                  </Text>
                  {getTrueTask()?.estimatedMinutes && (
                    <Text variant="labelSmall" style={styles.branchTaskTime}>
                      {getTrueTask()?.estimatedMinutes}分
                    </Text>
                  )}
                </View>
              </View>

              {/* 区切り線 */}
              <View style={styles.branchDivider} />

              {/* False パス */}
              <View style={styles.branchPath}>
                <View style={styles.branchPathHeader}>
                  <Text style={styles.branchPathIcon}>✗</Text>
                  <Text variant="labelSmall" style={styles.branchPathLabel}>
                    {task.branch.condition.type === 'time_check'
                      ? `${task.branch.condition.time}以降`
                      : task.branch.condition.type === 'completion_check'
                      ? '未完了'
                      : task.branch.condition.type === 'manual_choice'
                      ? task.branch.condition.options[1]
                      : 'No'}
                  </Text>
                </View>
                <View style={styles.branchArrow}>
                  <Text style={styles.branchArrowText}>↓</Text>
                </View>
                <View style={styles.branchTaskPreview}>
                  <Text variant="bodySmall" style={styles.branchTaskTitle} numberOfLines={1}>
                    {getFalseTask()?.title || '代替タスク'}
                  </Text>
                  {getFalseTask()?.estimatedMinutes && (
                    <Text variant="labelSmall" style={styles.branchTaskTime}>
                      {getFalseTask()?.estimatedMinutes}分
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const labels = {
    pending: '待機中',
    active: '実行中',
    completed: '完了',
    skipped: 'スキップ',
    overdue: '超過',
  };

  const colors = {
    pending: '#9E9E9E',
    active: '#2196F3',
    completed: '#4CAF50',
    skipped: '#FF9800',
    overdue: '#F44336',
  };

  return (
    <Chip
      compact
      style={[styles.statusBadge, { backgroundColor: colors[status] }]}
      textStyle={{ color: '#fff', fontSize: 10 }}
    >
      {labels[status]}
    </Chip>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const labels = {
    deadline: '締切',
    travel: '移動',
    meeting: '対人',
    desk: '作業',
  };

  const icons = {
    deadline: '🚨',
    travel: '🚗',
    meeting: '👥',
    desk: '💻',
  };

  return (
    <Text variant="bodySmall" style={styles.priorityBadge}>
      {icons[priority]} {labels[priority]}
    </Text>
  );
}

function getDialEmoji(dial: DailyDial): string {
  const emojis = { gentle: '🌱', coach: '💪', boss: '⚡' };
  return emojis[dial];
}

function getDialColor(dial: DailyDial): string {
  const colors = { gentle: '#4CAF50', coach: '#2196F3', boss: '#F44336' };
  return colors[dial];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {},
  headerRight: {
    alignItems: 'flex-end',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  dialChip: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
  },
  warningTitle: {
    color: '#c62828',
    marginBottom: 4,
  },
  warningText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  currentTaskCard: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  currentTaskTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentTaskDescription: {
    color: '#555',
    marginBottom: 16,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  timelineSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  taskCardActive: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  taskNumber: {
    backgroundColor: '#000',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusBadge: {
    height: 24,
  },
  priorityBadge: {
    fontSize: 12,
    color: '#666',
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  branchContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  branchHeader: {
    marginBottom: 12,
  },
  branchDescription: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 13,
  },
  branchPaths: {
    flexDirection: 'row',
    gap: 8,
  },
  branchPath: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  branchPathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  branchPathIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  branchPathLabel: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 11,
    flex: 1,
  },
  branchArrow: {
    alignItems: 'center',
    marginVertical: 2,
  },
  branchArrowText: {
    fontSize: 16,
    color: '#64748b',
  },
  branchTaskPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  branchTaskTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  branchTaskTime: {
    fontSize: 10,
    color: '#64748b',
  },
  branchDivider: {
    width: 1,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  taskTime: {
    color: '#666',
    marginTop: 4,
  },
  taskDeadline: {
    color: '#d32f2f',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',
  },
  fabStopped: {
    backgroundColor: '#4CAF50',
  },
  button: {
    marginTop: 16,
  },
});
