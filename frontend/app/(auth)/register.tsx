import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import BASE_URL from '@/config/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  
  const router = useRouter();

  const handleRegister = async () => {
    // 1. Lokale Validierung im Frontend
    if (!username || !email || !password || !passwordRepeat) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }

    if (password !== passwordRepeat) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);

    try {
      // 2. Anfrage an den (noch zu bauenden) Django-Endpunkt
      const response = await fetch(`${BASE_URL}/api/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registrierung erfolgreich, starte Auto-Login...');

      const loginResponse = await fetch(`${BASE_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // Nutzt die gerade eingetippten Daten
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        await signIn({
          access: loginData.access,
          refresh: loginData.refresh,
        });
      } else {
        // Falls der Token-Schnittstelle wider Erwarten etwas fehlt
        Alert.alert('Konto erstellt', 'Bitte logge dich auf der Startseite manuell ein.');
        router.replace('/(auth)/login');
      }

      } else {
        // Django gibt oft detaillierte Fehlermeldungen zurück (z.B. "Username existiert bereits")
        let errorMessage = 'Prüfe deine Eingaben.';
        if (data.username) errorMessage = `Benutzername: ${data.username.join(' ')}`;
        else if (data.email) errorMessage = `E-Mail: ${data.email.join(' ')}`;
        else if (data.password) errorMessage = `Passwort: ${data.password.join(' ')}`;
        else if (data.detail) errorMessage = data.detail;

        Alert.alert('Registrierung fehlgeschlagen', errorMessage);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Netzwerkfehler', 'Konnte keine Verbindung zum Server herstellen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>BetterPrepared</Text>
      <Text style={styles.subtitle}>Konto erstellen</Text>

      <TextInput
        style={styles.input}
        placeholder="Benutzername"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="E-Mail-Adresse"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Passwort wiederholen"
        value={passwordRepeat}
        onChangeText={setPasswordRepeat}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrieren</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkButton}>
        <Text style={styles.linkText}>Bereits ein Konto? Hier einloggen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 30,
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
    backgroundColor: '#fafafa',
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
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});