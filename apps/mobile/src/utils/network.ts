/**
 * Utility functions for network connectivity
 * Using Expo's built-in capabilities
 */

// Simple network connectivity check using fetch
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a reliable endpoint (no AbortController to avoid platform type mismatches)
    const timeoutMs = 5000;

    const response = await Promise.race([
      fetch('https://httpbin.org/get', {
        method: 'HEAD',
      }),
      new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Network check timeout')), timeoutMs);
      }),
    ]);

    return response.ok;
  } catch (error) {
    console.log('[Network] Connectivity check failed:', error);
    return false;
  }
};

// Since we don't have access to detailed network info, we'll provide a simplified version
export const getNetworkState = async () => {
  const isConnected = await checkNetworkConnectivity();
  
  return {
    type: isConnected ? 'unknown' : 'none',
    isConnected,
    isInternetReachable: isConnected,
    details: null,
  };
};

// We can't determine WiFi connection without proper library, so we'll return false
export const isWiFiConnection = async (): Promise<boolean> => {
  // In a full implementation, you would use NetInfo from '@react-native-netinfo/netinfo'
  // or expo-network if available
  return false;
};
