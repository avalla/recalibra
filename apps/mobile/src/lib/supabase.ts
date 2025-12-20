import * as Linking from 'expo-linking';

// Get the redirect URL for auth
export const getAuthRedirectUrl = () => {
  return Linking.createURL('auth/callback');
};

