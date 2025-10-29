import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MorningInputScreen } from '../screens/MorningInputScreen';
import { TodayTimelineScreen } from '../screens/TodayTimelineScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { DialSelectorScreen } from '../screens/DialSelectorScreen';

export type RootStackParamList = {
  MorningInput: undefined;
  DialSelector: { morningInput: string };
  TodayTimeline: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MorningInput"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MorningInput"
        component={MorningInputScreen}
        options={{ title: '今日だけ自動運転' }}
      />
      <Stack.Screen
        name="DialSelector"
        component={DialSelectorScreen}
        options={{ title: '今日の強度を選択' }}
      />
      <Stack.Screen
        name="TodayTimeline"
        component={TodayTimelineScreen}
        options={{ title: '今日のライン' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'タスク詳細' }}
      />
    </Stack.Navigator>
  );
}
