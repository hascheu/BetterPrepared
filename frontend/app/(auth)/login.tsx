import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router'; 
import BASE_URL from '@/config/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const { signIn } = useAuth();

  const handleLogin = async () => {
      if (!username || !password) {
        Alert.alert('Fehler', 'Bitte gib Benutzername und Passwort ein.');
        return;
      }

      setLoading(true);

      try {
        // 1. Anfrage an dein Django-Backend
        const response = await fetch(`${BASE_URL}/api/users/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // 🟢 2. Beide Tokens als Objekt übergeben:
          await signIn({
            access: data.access,
            refresh: data.refresh,
          }); 
          // Der AuthContext leitet dich automatisch zu den (tabs) weiter!
        } else {
          // 3. Fehlerbehandlung (z.B. falsche Credentials)
          Alert.alert('Login fehlgeschlagen', data.detail || 'Prüfe deine Eingaben.');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Netzwerkfehler', 'Konnte keine Verbindung zum Server herstellen.');
      } finally {
        setLoading(false);
      }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BetterPrepared</Text>
      <Text style={styles.subtitle}>Bitte einloggen</Text>

      <TextInput
        style={styles.input}
        placeholder="Benutzername"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Verdeckt die Passworteingabe
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ color: '#007AFF', fontSize: 16 }}>Noch kein Konto? Hier registrieren</Text>
      </TouchableOpacity>
   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});