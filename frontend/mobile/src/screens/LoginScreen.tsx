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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import CustomInput from '../components/CustomInput';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://192.168.3.56:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.message || 'Email ou senha incorretos.');
        return;
      }

      // Save token and user data locally on the device
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role — BARBER goes to barber dashboard
      if (data.user.role === 'BARBER') {
        navigation.replace('BarberTabs');
      } else {
        navigation.replace('MainTabs');
      }

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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>✂️</Text>
          </View>
          <Text style={styles.logoTitle}>BarberApp</Text>
          <Text style={styles.logoSub}>Seu estilo, na palma da mão</Text>
        </View>

        {/* Form */}
        <CustomInput
          placeholder="Email"
          icon="✉️"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <CustomInput
          placeholder="Senha"
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <GoldButton
          label="Entrar"
          onPress={handleLogin}
          loading={loading}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou continue com</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google OAuth — future implementation */}
        <TouchableOpacity style={styles.socialButtonFull}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialLabel}>Continuar com Google</Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Criar conta</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 34,
  },
  logoTitle: {
    color: C.gold,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoSub: {
    color: C.gray,
    fontSize: 14,
    marginTop: 4,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -6,
  },
  forgotText: {
    color: C.gold,
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.gray,
    fontSize: 12,
  },
  socialButtonFull: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  socialIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
  },
  socialLabel: {
    color: C.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: C.gray,
    fontSize: 13,
  },
  registerLink: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});