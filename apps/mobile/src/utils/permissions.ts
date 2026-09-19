import { tr } from '../i18n/core';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { logger } from './logger';

export class PermissionManager {
  private static instance: PermissionManager;
  
  private constructor() {}
  
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }
  
  // Request notification permissions
  async requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // On Android, we need to request permissions for notifications
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        
        if (granted) {
          logger.info('Notification permissions granted', 'PermissionManager');
        } else {
          logger.warn('Notification permissions denied', 'PermissionManager');
        }
        
        return granted;
      } catch (error) {
        logger.error('Error requesting notification permissions', error as Error, 'PermissionManager');
        return false;
      }
    } else {
      // On iOS, permissions are handled automatically by the system
      return true;
    }
  }
  
  // Request health permissions (for Apple Health on iOS)
  async requestHealthPermissions(): Promise<boolean> {
    // This is handled by the Apple Health integration directly
    // We'll return true for now as the actual permission request
    // is managed by the health integration
    logger.info('Health permissions requested', 'PermissionManager');
    return true;
  }
  
  // Request storage permissions (Android only)
  async requestStoragePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: tr("Storage Permission"),
          message: tr("App needs access to your storage to save files"),
          buttonNeutral: tr('Ask Me Later'),
          buttonNegative: tr("Cancel"),
          buttonPositive: 'OK',
        },
      );
      
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      if (isGranted) {
        logger.info('Storage permissions granted', 'PermissionManager');
      } else {
        logger.warn('Storage permissions denied', 'PermissionManager');
      }
      
      return isGranted;
    } catch (error) {
      logger.error('Error requesting storage permissions', error as Error, 'PermissionManager');
      return false;
    }
  }
  
  // Request camera permissions
  async requestCameraPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: tr("Camera Permission"),
            message: tr("App needs access to your camera"),
            buttonNeutral: tr('Ask Me Later'),
            buttonNegative: tr("Cancel"),
            buttonPositive: 'OK',
          },
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        
        if (isGranted) {
          logger.info('Camera permissions granted', 'PermissionManager');
        } else {
          logger.warn('Camera permissions denied', 'PermissionManager');
        }
        
        return isGranted;
      } catch (error) {
        logger.error('Error requesting camera permissions', error as Error, 'PermissionManager');
        return false;
      }
    } else {
      // On iOS, permissions are handled automatically by the system
      return true;
    }
  }
  
  // Request all essential permissions
  async requestAllEssentialPermissions(): Promise<boolean> {
    try {
      const notificationPermission = await this.requestNotificationPermissions();
      const healthPermission = await this.requestHealthPermissions();
      
      let storagePermission = true;
      let cameraPermission = true;
      
      if (Platform.OS === 'android') {
        storagePermission = await this.requestStoragePermissions();
        cameraPermission = await this.requestCameraPermissions();
      }
      
      const allGranted = notificationPermission && healthPermission && storagePermission && cameraPermission;
      
      if (allGranted) {
        logger.info('All essential permissions granted', 'PermissionManager');
      } else {
        logger.warn('Some essential permissions denied', 'PermissionManager');
      }
      
      return allGranted;
    } catch (error) {
      logger.error('Error requesting all essential permissions', error as Error, 'PermissionManager');
      return false;
    }
  }
  
  // Check if notification permissions are granted
  async checkNotificationPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Error checking notification permissions', error as Error, 'PermissionManager');
      return false;
    }
  }
  
  // Check if storage permissions are granted (Android only)
  async checkStoragePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted;
    } catch (error) {
      logger.error('Error checking storage permissions', error as Error, 'PermissionManager');
      return false;
    }
  }
  
  // Check if camera permissions are granted
  async checkCameraPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return granted;
      } catch (error) {
        logger.error('Error checking camera permissions', error as Error, 'PermissionManager');
        return false;
      }
    } else {
      // On iOS, permissions are handled automatically by the system
      return true;
    }
  }
}

export const permissionManager = PermissionManager.getInstance();

// Helper functions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  return await permissionManager.requestNotificationPermissions();
};

export const requestHealthPermissions = async (): Promise<boolean> => {
  return await permissionManager.requestHealthPermissions();
};

export const requestStoragePermissions = async (): Promise<boolean> => {
  return await permissionManager.requestStoragePermissions();
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  return await permissionManager.requestCameraPermissions();
};

export const requestAllEssentialPermissions = async (): Promise<boolean> => {
  return await permissionManager.requestAllEssentialPermissions();
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  return await permissionManager.checkNotificationPermissions();
};

export const checkStoragePermissions = async (): Promise<boolean> => {
  return await permissionManager.checkStoragePermissions();
};

export const checkCameraPermissions = async (): Promise<boolean> => {
  return await permissionManager.checkCameraPermissions();
};
