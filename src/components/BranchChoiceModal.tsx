import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Modal, Card, Button, Text, Divider } from 'react-native-paper';
import { Task } from '../types';

interface Props {
  visible: boolean;
  options: string[];
  tasks?: Task[]; // 分岐先のタスク情報（オプション）
  onChoice: (choiceIndex: number) => void;
  onDismiss: () => void;
}

export function BranchChoiceModal({ visible, options, tasks, onChoice, onDismiss }: Props) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              🔀 分岐: 次のタスクを選択
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              どちらのルートに進みますか？
            </Text>

            <View style={styles.optionsContainer}>
              {options.map((option, index) => {
                const task = tasks?.[index];
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onChoice(index);
                    }}
                    style={styles.optionCard}
                  >
                    <View style={styles.optionHeader}>
                      <Text variant="labelLarge" style={styles.optionLabel}>
                        {option}
                      </Text>
                      {task?.estimatedMinutes && (
                        <View style={styles.timeBadge}>
                          <Text variant="labelSmall" style={styles.timeText}>
                            ⏱ {task.estimatedMinutes}分
                          </Text>
                        </View>
                      )}
                    </View>
                    {task && (
                      <>
                        <Text variant="titleMedium" style={styles.taskTitle}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text variant="bodySmall" style={styles.taskDescription} numberOfLines={2}>
                            {task.description}
                          </Text>
                        )}
                      </>
                    )}
                    <View style={styles.selectButton}>
                      <Text variant="labelMedium" style={styles.selectButtonText}>
                        このルートを選ぶ →
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    color: '#0369a1',
    fontWeight: 'bold',
    flex: 1,
  },
  timeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  taskTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskDescription: {
    color: '#64748b',
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
