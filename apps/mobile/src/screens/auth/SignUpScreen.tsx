import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button, Input } from '../../components';
import { useAuth } from '../../contexts';
import type { AuthStackScreenProps } from '../../types';

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<AuthStackScreenProps<'SignUp'>['navigation']>();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: authError } = await signUp(email, password, fullName);
    
    if (authError) {
      setError(authError.message || 'Failed to create account');
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
    
    setIsLoading(false);
  };

  const handleSocialSignUp = (provider: 'google' | 'apple') => {
    Alert.alert('Coming Soon', `${provider} signup will be available soon!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Your Account</Text>

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignUp('apple')}
            >
              <Text style={styles.socialButtonIcon}>i0S</Text>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignUp('google')}
            >
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Your name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label="Email Address"
              placeholder="name@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              label="Sign Up"
              onPress={handleSignUp}
              loading={isLoading}
              style={styles.signUpButton}
            />
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Privacy & Medical Disclaimer</Text>.
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  socialButtons: {
    gap: Spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  socialButtonIcon: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.md,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  signUpButton: {
    marginTop: Spacing.md,
  },
  terms: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  termsLink: {
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
