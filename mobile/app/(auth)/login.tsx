import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../../src/api/services';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Tentando login com:', username);
      const data = await authApi.login(username, password);
      console.log('[Login] Resposta recebida:', data);
      
      if (data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        console.log('[Login] Token salvo:', data.token);
      }
      
      if (data.user) {
        await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
        console.log('[Login] User data salvo');
      }
      
      Alert.alert('Sucesso', 'Login realizado!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('[Login] Erro:', error);
      let message = 'Erro desconhecido';
      
      if (error.response) {
        // Servidor respondeu com erro
        message = error.response.data?.detail || `Erro ${error.response.status}`;
      } else if (error.request) {
        // Sem resposta do servidor (problema de rede)
        message = 'Não foi possível conectar ao servidor.\n\nVerifique:\n- Se o backend está rodando\n- Se seu celular está na mesma rede WiFi\n- IP: 192.168.0.250:8000';
      } else {
        message = error.message;
      }
      
      Alert.alert('Erro no Login', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finance App</Text>
      <Text style={styles.subtitle}>Gerencie suas finanças</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Usuário"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </Link>
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
    color: '#2b6cb0',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  button: {
    backgroundColor: '#2b6cb0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2b6cb0',
    fontSize: 16,
  },
});
