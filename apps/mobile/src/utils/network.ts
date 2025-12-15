/**
 * Utility functions for network connectivity
 * Using Expo's built-in capabilities
 */

// Simple network connectivity check using fetch
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a reliable endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://httpbin.org/get', { 
      method: 'HEAD', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
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
