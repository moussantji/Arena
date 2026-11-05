/**
 * Connexion premium : ciel aurore, emblème champagne, carte de verre.
 */
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth';
import { gradients, theme } from '../theme';
import { Aurora, Button, Field } from '../ui';

export default function LoginScreen() {
  const { signIn, signingIn, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!email.trim() || !password) return;
    void signIn(email, password);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Aurora dense />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.hero}>
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emblemRing}
            >
              <View style={styles.emblemCore}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.logo}
                  accessibilityLabel="Logo Kalanso"
                />
              </View>
            </LinearGradient>
            <Text style={styles.name}>KALANSO</Text>
            <Text style={styles.tagline}>Gestion d’école</Text>
          </View>

          <View style={styles.formCard}>
            <Field
              label="Adresse e-mail"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) clearError();
              }}
              placeholder="vous@exemple.com"
              editable={!signingIn}
              returnKeyType="next"
            />
            <Field
              label="Mot de passe"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              textContentType="password"
              secureTextEntry
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (error) clearError();
              }}
              placeholder="10 caractères minimum"
              editable={!signingIn}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {error ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              label="Se connecter"
              onPress={submit}
              loading={signingIn}
              disabled={!email.trim() || !password}
              style={styles.submit}
            />

            <View style={styles.helpRow}>
              <View style={styles.helpLine} />
              <Text style={styles.helpMark}>KALANSO · SÉCURISÉ</Text>
              <View style={styles.helpLine} />
            </View>

            <Text style={styles.help}>
              Les comptes sont créés par l’établissement. En cas d’oubli du mot de passe,
              adressez-vous à la direction.
            </Text>
          </View>

          <Text style={styles.footer}>Application de l’établissement</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 36, paddingBottom: 28 },
  hero: { alignItems: 'center', marginBottom: 30 },
  emblemRing: {
    width: 104,
    height: 104,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.copper,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  emblemCore: {
    width: 98,
    height: 98,
    borderRadius: 27,
    backgroundColor: theme.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 78, height: 78, borderRadius: 20 },
  name: {
    color: theme.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 7,
    marginTop: 18,
  },
  tagline: { color: theme.faint, fontSize: 13, letterSpacing: 2.4, marginTop: 6, textTransform: 'uppercase' },
  formCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: theme.radiusLg,
    padding: 20,
  },
  errorBox: {
    backgroundColor: theme.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(240, 138, 138, 0.4)',
    borderRadius: theme.radiusSm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: theme.danger, fontSize: 12.5, lineHeight: 18 },
  submit: { marginTop: 4 },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 10 },
  helpLine: { flex: 1, height: 1, backgroundColor: theme.line },
  helpMark: { color: theme.ghost, fontSize: 8.5, letterSpacing: 1.6, fontWeight: '700' },
  help: { color: theme.faint, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  footer: {
    color: 'rgba(167, 182, 255, 0.35)',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 28,
    textTransform: 'uppercase',
  },
});
