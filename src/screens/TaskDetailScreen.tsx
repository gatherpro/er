import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Checkbox } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDayStore } from '../stores/dayStore';
import { format } from 'date-fns';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;
  route: RouteProp<RootStackParamList, 'TaskDetail'>;
};

export function TaskDetailScreen({ navigation, route }: Props) {
  const { taskId } = route.params;
  const { currentPlan, startTask, completeTask, skipTask } = useDayStore();

  const task = currentPlan?.tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall">タスクが見つかりません</Text>
        <Button onPress={() => navigation.goBack()}>戻る</Button>
      </View>
    );
  }

  const isActive = currentPlan?.currentTaskId === taskId;
  const dial = currentPlan?.dial;

  const handleStart = async () => {
    await startTask(taskId);
    navigation.goBack();
  };

  const handleComplete = async () => {
    await completeTask(taskId);
    navigation.goBack();
  };

  const handleSkip = async () => {
    await skipTask(taskId);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            {task.title}
          </Text>

          {task.description && (
            <Text variant="bodyLarge" style={styles.description}>
              {task.description}
            </Text>
          )}

          <View style={styles.infoSection}>
            <InfoRow label="状態" value={getStatusLabel(task.status)} />
            <InfoRow label="優先度" value={getPriorityLabel(task.priority)} />
            <InfoRow
              label="予定時間"
              value={task.estimatedMinutes ? `${task.estimatedMinutes}分` : '未設定'}
            />
            {task.startTime && (
              <InfoRow
                label="開始時刻"
                value={format(new Date(task.startTime), 'HH:mm')}
              />
            )}
            {task.deadline && (
              <InfoRow
                label="締切"
                value={format(new Date(task.deadline), 'HH:mm')}
                highlight
              />
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Boss モードのチェックリスト */}
      {dial === 'boss' && task.checklist && task.checklist.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚡ Boss モード：チェックリスト
            </Text>
            <Text variant="bodySmall" style={styles.checklistHint}>
              すべて完了しないと次に進めません
            </Text>
            <View style={styles.checklistContainer}>
              {task.checklist.map((item, index) => (
                <ChecklistItem
                  key={index}
                  item={item}
                  checked={task.checklistCompleted?.[index] ?? false}
                  onToggle={() => {
                    // チェックリストのトグル処理
                    // TODO: ストアに追加
                  }}
                />
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 分岐情報 */}
      {task.branch && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🔀 分岐設定
            </Text>
            <Text variant="bodyMedium">
              {getBranchDescription(task.branch.condition)}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* アクションボタン */}
      <View style={styles.actions}>
        {task.status === 'pending' && !isActive && (
          <Button mode="contained" onPress={handleStart} style={styles.button}>
            このタスクを開始
          </Button>
        )}

        {isActive && (
          <>
            <Button
              mode="contained"
              onPress={handleComplete}
              style={[styles.button, styles.buttonComplete]}
            >
              完了する
            </Button>
            <Button
              mode="outlined"
              onPress={handleSkip}
              style={styles.button}
            >
              スキップ
            </Button>
          </>
        )}

        {task.status === 'completed' && (
          <Text variant="bodyLarge" style={styles.completedText}>
            ✅ 完了済み
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={styles.infoLabel}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.infoValue, highlight && styles.infoValueHighlight]}
      >
        {value}
      </Text>
    </View>
  );
}

function ChecklistItem({
  item,
  checked,
  onToggle,
}: {
  item: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.checklistItem}>
      <Checkbox status={checked ? 'checked' : 'unchecked'} onPress={onToggle} />
      <Text variant="bodyMedium" style={styles.checklistText}>
        {item}
      </Text>
    </View>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待機中',
    active: '実行中',
    completed: '完了',
    skipped: 'スキップ',
    overdue: '超過',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    deadline: '🚨 締切',
    travel: '🚗 移動',
    meeting: '👥 対人',
    desk: '💻 作業',
  };
  return labels[priority] || priority;
}

function getBranchDescription(condition: any): string {
  if (condition.type === 'time_check') {
    return `${condition.label}（${condition.time}で分岐）`;
  }
  if (condition.type === 'completion_check') {
    return `${condition.label}（完了状況で分岐）`;
  }
  if (condition.type === 'manual_choice') {
    return `手動選択：${condition.options.join(' / ')}`;
  }
  return '分岐条件あり';
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
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    color: '#555',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoSection: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: '600',
  },
  infoValueHighlight: {
    color: '#d32f2f',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  checklistHint: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  checklistContainer: {
    gap: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistText: {
    flex: 1,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 8,
  },
  buttonComplete: {
    backgroundColor: '#4CAF50',
  },
  completedText: {
    textAlign: 'center',
    color: '#4CAF50',
    paddingVertical: 16,
  },
});
