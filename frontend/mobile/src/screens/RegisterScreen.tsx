import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import CustomInput from '../components/CustomInput';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Atenção', 'Preencha nome, email e senha.');
      return;
    }

    try {
      setLoading(true);

      // POST /api/users — creates new CLIENT account on Spring Boot
      const response = await fetch('http://192.168.3.56:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: 'CLIENT',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.message || 'Erro ao criar conta.');
        return;
      }

      Alert.alert('Conta criada!', 'Faça login para continuar.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);

    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Junte-se a milhares de clientes</Text>
        </View>

        {/* Form */}
        <CustomInput
          placeholder="Nome completo"
          icon="👤"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <CustomInput
          placeholder="Email"
          icon="✉️"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <CustomInput
          placeholder="Telefone"
          icon="📱"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <CustomInput
          placeholder="Senha"
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.buttonRow}>
          <GoldButton
            label="Cadastrar"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  back: {
    marginBottom: 24,
  },
  backText: {
    color: C.gold,
    fontSize: 24,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    color: C.white,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: C.gray,
    fontSize: 14,
    marginTop: 6,
  },
  buttonRow: {
    marginTop: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: C.gray,
    fontSize: 13,
  },
  loginLink: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});