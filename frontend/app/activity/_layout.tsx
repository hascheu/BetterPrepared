import { Stack } from 'expo-router';

export default function ActivityLayout() {
  return (
    <Stack>
      <Stack.Screen name="add" options={{ title: 'Aktivität planen', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Details', headerShown: true }} />
    </Stack>
  );
}