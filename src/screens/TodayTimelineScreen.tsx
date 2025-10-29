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
import { Task, DailyDial } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
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
        onChoice={makeBranchChoice}
        onDismiss={() => {}}
      />
    </View>
  );
}

function TaskCard({ task, index, isActive }: { task: Task; index: number; isActive: boolean }) {
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
        {task.branch && (
          <View style={styles.branchBadge}>
            <Text variant="bodySmall" style={styles.branchText}>
              🔀 分岐あり
            </Text>
          </View>
        )}
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
  branchBadge: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  branchText: {
    color: '#0277bd',
    fontWeight: '600',
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
