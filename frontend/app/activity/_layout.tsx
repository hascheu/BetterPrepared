import { Stack } from 'expo-router';

export default function ActivityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="add" 
        options={{ 
          title: 'Aktivität hinzufügen',
          headerBackTitle: 'Zurück'
        }} 
      />
    </Stack>
  );
}