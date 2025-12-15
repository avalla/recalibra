import { AppState, AppStateStatus } from 'react-native';
import { logger } from './logger';

export class AppStateManager {
  private static instance: AppStateManager;
  private currentState: AppStateStatus = AppState.currentState;
  private listeners: Array<(state: AppStateStatus) => void> = [];
  private appStateSubscription: any;
  
  private constructor() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }
  
  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }
  
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    logger.info(`App state changed from ${this.currentState} to ${nextAppState}`, 'AppStateManager');
    
    // Notify listeners
    this.listeners.forEach(listener => listener(nextAppState));
    
    // Update current state
    this.currentState = nextAppState;
  };
  
  getCurrentState(): AppStateStatus {
    return this.currentState;
  }
  
  addListener(listener: (state: AppStateStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  removeListener(listener: (state: AppStateStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  isAppActive(): boolean {
    return this.currentState === 'active';
  }
  
  isAppInBackground(): boolean {
    return this.currentState === 'background';
  }
  
  isAppInactive(): boolean {
    return this.currentState === 'inactive';
  }
  
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.listeners = [];
  }
}

export const appStateManager = AppStateManager.getInstance();

// Helper functions
export const isAppActive = (): boolean => {
  return appStateManager.isAppActive();
};

export const isAppInBackground = (): boolean => {
  return appStateManager.isAppInBackground();
};

export const isAppInactive = (): boolean => {
  return appStateManager.isAppInactive();
};
