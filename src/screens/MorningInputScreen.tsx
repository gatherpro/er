import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, Card, Chip } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDayStore } from '../stores/dayStore';
import { dayTemplates } from '../utils/templates';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MorningInput'>;
};

export function MorningInputScreen({ navigation }: Props) {
  const [morningInput, setMorningInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { currentPlan, loadTodaysPlan } = useDayStore();

  useEffect(() => {
    loadTodaysPlan();
  }, []);

  useEffect(() => {
    // 既に今日のプランがあればタイムラインへ
    if (currentPlan && currentPlan.isActive) {
      navigation.replace('TodayTimeline');
    }
  }, [currentPlan]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = dayTemplates.find(t => t.id === templateId);
    if (template) {
      setMorningInput(template.description);
    }
  };

  const handleNext = () => {
    if (morningInput.trim()) {
      navigation.navigate('DialSelector', { morningInput: morningInput.trim() });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            今日だけ自動運転
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            朝に決めて、あとは自動で進む。
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              今日の予定を一文で
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              例: 午前は資料作成、午後はミーティング3つ、夕方から移動
            </Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={morningInput}
              onChangeText={setMorningInput}
              placeholder="今日の予定を入力..."
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <View style={styles.templateSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            よく使うテンプレート
          </Text>
          <View style={styles.chipContainer}>
            {dayTemplates.map(template => (
              <Chip
                key={template.id}
                selected={selectedTemplate === template.id}
                onPress={() => handleTemplateSelect(template.id)}
                style={styles.chip}
              >
                {template.name}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.principles}>
          <Text variant="titleSmall" style={styles.principlesTitle}>
            体験原則
          </Text>
          <Text variant="bodySmall" style={styles.principleText}>
            • 今日のライン一本だけ表示、分岐は裏で自動判定{'\n'}
            • 通知による強制トランジションで前へ進む{'\n'}
            • 緊急停止はいつでも可能{'\n'}
            • 決断は朝だけ、実行は通知がやる
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!morningInput.trim()}
          style={styles.button}
        >
          次へ：強度を選ぶ
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  hint: {
    color: '#999',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
  },
  templateSection: {
    marginBottom: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  principles: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  principlesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  principleText: {
    color: '#555',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
});
