/** Écran de connexion — épuré : logo, établissement, e-mail, mot de passe. */
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth';
import { theme, spacing } from '../theme';
import { Button, Field } from '../ui';

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
            <View style={styles.glow} />
            <View style={styles.glowOuter} />
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              accessibilityLabel="Logo Kalanso"
            />
            <Text style={styles.name}>Kalanso</Text>
            <Text style={styles.tagline}>L’école dans votre poche</Text>
          </View>

          <View style={styles.form}>
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

            <Text style={styles.help}>
              Les comptes sont créés par l’établissement. En cas d’oubli du mot de passe,
              adressez-vous à la direction.
            </Text>
          </View>

          <Text style={styles.footer}>Kalanso · Application de l’établissement</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 48, paddingBottom: 28 },
  hero: { alignItems: 'center', marginBottom: 34 },
  glow: {
    position: 'absolute',
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(91, 124, 250, 0.18)',
  },
  glowOuter: {
    position: 'absolute',
    top: -95,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(91, 124, 250, 0.06)',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 182, 255, 0.35)',
    shadowColor: '#5b7cfa',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  name: { color: theme.ink, fontSize: 32, fontWeight: '800', letterSpacing: 2.4, marginTop: 16 },
  tagline: { color: theme.copper, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 5, fontWeight: '700' },
  form: { width: '100%' },
  errorBox: {
    backgroundColor: 'rgba(240, 138, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 138, 138, 0.4)',
    borderRadius: theme.radiusSm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: theme.danger, fontSize: 12.5, lineHeight: 18 },
  submit: { marginTop: 4 },
  help: { color: theme.faint, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: 'center' },
  footer: {
    color: 'rgba(167, 182, 255, 0.35)',
    fontSize: 10.5,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 36,
  },
});
