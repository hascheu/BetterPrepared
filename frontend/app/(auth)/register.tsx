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
  
  // State für feldbezogene Fehlermeldungen vom Backend
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string[];
    email?: string[];
    password?: string[];
    general?: string[];
  }>({});

  const { signIn } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    // Fehler bei erneutem Versuch zurücksetzen
    setFieldErrors({});

    // 1. Lokale Validierung im Frontend
    if (!username || !email || !password || !passwordRepeat) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }

    if (password !== passwordRepeat) {
      setFieldErrors({ password: ['Die Passwörter stimmen nicht überein.'] });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const data = await response.json();
          console.log('Backend Validation Errors:', data);

          // Fehlerzustände für die einzelnen Felder extrahieren
          const errors: typeof fieldErrors = {};

          if (data.username) errors.username = Array.isArray(data.username) ? data.username : [data.username];
          if (data.email) errors.email = Array.isArray(data.email) ? data.email : [data.email];
          if (data.password) errors.password = Array.isArray(data.password) ? data.password : [data.password];
          if (data.non_field_errors) errors.general = Array.isArray(data.non_field_errors) ? data.non_field_errors : [data.non_field_errors];
          if (data.detail) errors.general = [data.detail];

          setFieldErrors(errors);

          // Zusammenfassenden Alert anzeigen
          const allMessages = Object.entries(errors)
            .map(([field, msgs]) => `${field.toUpperCase()}: ${msgs.join(' ')}`)
            .join('\n');

          Alert.alert('Registrierung fehlgeschlagen', allMessages || 'Bitte überprüfe deine Eingaben.');
        } else {
          Alert.alert('Serverfehler', `Server antwortete mit Status ${response.status}.`);
        }
        return;
      }

      // Erfolgsfall: Auto-Login durchführen
      const loginResponse = await fetch(`${BASE_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        await signIn({ access: loginData.access, refresh: loginData.refresh });
      } else {
        Alert.alert('Erfolg', 'Konto erstellt! Bitte logge dich manuell ein.');
        router.replace('/(auth)/login');
      }

    } catch (error) {
      console.error('Netzwerkfehler:', error);
      Alert.alert('Netzwerkfehler', 'Konnte keine Verbindung zum Server herstellen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>BetterPrepared</Text>
      <Text style={styles.subtitle}>Konto erstellen</Text>

      {/* Allgemeine Fehlermeldung oben */}
      {fieldErrors.general && (
        <View style={styles.errorBox}>
          {fieldErrors.general.map((err, i) => (
            <Text key={i} style={styles.errorBoxText}>{err}</Text>
          ))}
        </View>
      )}

      {/* Benutzername */}
      <TextInput
        style={[styles.input, fieldErrors.username && styles.inputError]}
        placeholder="Benutzername"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      {fieldErrors.username && (
        <Text style={styles.fieldErrorText}>{fieldErrors.username.join(' ')}</Text>
      )}

      {/* E-Mail */}
      <TextInput
        style={[styles.input, fieldErrors.email && styles.inputError]}
        placeholder="E-Mail-Adresse"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {fieldErrors.email && (
        <Text style={styles.fieldErrorText}>{fieldErrors.email.join(' ')}</Text>
      )}

      {/* Passwort */}
      <TextInput
        style={[styles.input, fieldErrors.password && styles.inputError]}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {fieldErrors.password && (
        <Text style={styles.fieldErrorText}>{fieldErrors.password.join(' ')}</Text>
      )}

      {/* Passwort wiederholen */}
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
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF2F2',
  },
  fieldErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 10,
    marginTop: -5,
    paddingLeft: 4,
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorBoxText: {
    color: '#D8000C',
    fontSize: 14,
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