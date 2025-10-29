import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Card, Button, Text } from 'react-native-paper';

interface Props {
  visible: boolean;
  options: string[];
  onChoice: (choiceIndex: number) => void;
  onDismiss: () => void;
}

export function BranchChoiceModal({ visible, options, onChoice, onDismiss }: Props) {
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
              {options.map((option, index) => (
                <Button
                  key={index}
                  mode="contained"
                  onPress={() => {
                    onChoice(index);
                    onDismiss();
                  }}
                  style={styles.optionButton}
                  contentStyle={styles.optionButtonContent}
                >
                  {option}
                </Button>
              ))}
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
    gap: 12,
  },
  optionButton: {
    paddingVertical: 4,
  },
  optionButtonContent: {
    paddingVertical: 12,
  },
});
