import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, RadioButton } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDayStore } from '../stores/dayStore';
import { DailyDial } from '../types';
import { generateTasksFromInput } from '../utils/taskGenerator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DialSelector'>;
  route: RouteProp<RootStackParamList, 'DialSelector'>;
};

interface DialOption {
  value: DailyDial;
  title: string;
  emoji: string;
  description: string;
  features: string[];
  color: string;
}

const dialOptions: DialOption[] = [
  {
    value: 'gentle',
    title: 'Gentle',
    emoji: '🌱',
    description: 'ゆるやかに進める',
    features: [
      '通知は最小限',
      'スヌーズ2回まで',
      '超過時は分割して後段へ',
      '柔軟な調整が可能',
    ],
    color: '#4CAF50',
  },
  {
    value: 'coach',
    title: 'Coach',
    emoji: '💪',
    description: 'ほどよくプッシュ',
    features: [
      '段階的なナッジ',
      'スヌーズ1回まで',
      '超過は10%圧縮＋分割',
      'バランスの取れた強度',
    ],
    color: '#2196F3',
  },
  {
    value: 'boss',
    title: 'Boss',
    emoji: '⚡',
    description: '強制的に進める',
    features: [
      'スヌーズ不可',
      'チェックリスト必須',
      '超過は30%圧縮＋即切上げ',
      '締切厳守モード',
    ],
    color: '#F44336',
  },
];

export function DialSelectorScreen({ navigation, route }: Props) {
  const { morningInput } = route.params;
  const [selectedDial, setSelectedDial] = useState<DailyDial>('coach');
  const { createDayPlan } = useDayStore();

  const handleConfirm = async () => {
    // 朝の一文からタスクを生成（簡易版）
    const tasks = generateTasksFromInput(morningInput);

    // プランを作成
    await createDayPlan(morningInput, selectedDial, tasks);

    // タイムラインへ
    navigation.replace('TodayTimeline');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          今日の強度を選択
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          日次ダイヤル：通知強度・スヌーズ・遷移が連動
        </Text>
      </View>

      <Card style={styles.inputCard}>
        <Card.Content>
          <Text variant="labelSmall" style={styles.label}>
            今日の予定
          </Text>
          <Text variant="bodyMedium">{morningInput}</Text>
        </Card.Content>
      </Card>

      <RadioButton.Group
        onValueChange={(value) => setSelectedDial(value as DailyDial)}
        value={selectedDial}
      >
        {dialOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setSelectedDial(option.value)}
            style={styles.optionContainer}
          >
            <Card
              style={[
                styles.optionCard,
                selectedDial === option.value && {
                  borderColor: option.color,
                  borderWidth: 3,
                },
              ]}
            >
              <Card.Content>
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.emoji}>{option.emoji}</Text>
                    <Text variant="titleLarge" style={styles.optionTitle}>
                      {option.title}
                    </Text>
                  </View>
                  <RadioButton value={option.value} />
                </View>

                <Text variant="bodyMedium" style={styles.optionDescription}>
                  {option.description}
                </Text>

                <View style={styles.featureList}>
                  {option.features.map((feature, index) => (
                    <Text key={index} variant="bodySmall" style={styles.feature}>
                      • {feature}
                    </Text>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </RadioButton.Group>

      <View style={styles.notice}>
        <Text variant="bodySmall" style={styles.noticeText}>
          💡 強度はいつでも弱く変更できます（安全と可逆性）
        </Text>
      </View>

      <Button mode="contained" onPress={handleConfirm} style={styles.button}>
        確定：今日のラインを開始
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  inputCard: {
    marginBottom: 24,
    backgroundColor: '#e8f5e9',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: '#fff',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  optionTitle: {
    fontWeight: 'bold',
  },
  optionDescription: {
    color: '#555',
    marginBottom: 12,
  },
  featureList: {
    gap: 4,
  },
  feature: {
    color: '#777',
    lineHeight: 18,
  },
  notice: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  noticeText: {
    color: '#e65100',
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
});
