import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { logger } from './logger';

interface ResourceLoaderOptions {
  onProgress?: (progress: number, total: number) => void;
  onError?: (error: Error, resource: string) => void;
}

export class ResourceLoader {
  private loadedAssets: Set<string> = new Set();
  private loadedFonts: Set<string> = new Set();
  
  async loadAssetsAsync(
    assets: number[], 
    options?: ResourceLoaderOptions
  ): Promise<void> {
    const { onProgress, onError } = options || {};
    
    try {
      const total = assets.length;
      let loaded = 0;
      
      for (const asset of assets) {
        try {
          if (!this.loadedAssets.has(asset.toString())) {
            await Asset.loadAsync(asset);
            this.loadedAssets.add(asset.toString());
          }
          
          loaded++;
          onProgress?.(loaded, total);
        } catch (error) {
          onError?.(error as Error, `Asset ${asset}`);
          logger.error(`Failed to load asset ${asset}`, error as Error, 'ResourceLoader');
          throw error;
        }
      }
      
      logger.info(`Successfully loaded ${loaded} assets`, 'ResourceLoader');
    } catch (error) {
      logger.error('Failed to load assets', error as Error, 'ResourceLoader');
      throw error;
    }
  }
  
  async loadFontsAsync(
    fonts: { [fontFamily: string]: number }, 
    options?: ResourceLoaderOptions
  ): Promise<void> {
    const { onProgress, onError } = options || {};
    
    try {
      // Check which fonts need to be loaded
      const fontsToLoad: { [fontFamily: string]: number } = {};
      const fontEntries = Object.entries(fonts);
      
      for (const [fontFamily, fontAsset] of fontEntries) {
        if (!this.loadedFonts.has(fontFamily)) {
          fontsToLoad[fontFamily] = fontAsset;
        }
      }
      
      if (Object.keys(fontsToLoad).length > 0) {
        await Font.loadAsync(fontsToLoad);
        
        // Mark fonts as loaded
        Object.keys(fontsToLoad).forEach(fontFamily => 
          this.loadedFonts.add(fontFamily)
        );
        
        onProgress?.(Object.keys(fontsToLoad).length, fontEntries.length);
        logger.info(`Successfully loaded ${Object.keys(fontsToLoad).length} fonts`, 'ResourceLoader');
      } else {
        onProgress?.(fontEntries.length, fontEntries.length);
        logger.info('All fonts already loaded', 'ResourceLoader');
      }
    } catch (error) {
      onError?.(error as Error, 'Fonts');
      logger.error('Failed to load fonts', error as Error, 'ResourceLoader');
      throw error;
    }
  }
  
  async loadResourcesAsync(
    assets: number[] = [], 
    fonts: { [fontFamily: string]: number } = {},
    options?: ResourceLoaderOptions
  ): Promise<void> {
    try {
      logger.info('Starting resource loading', 'ResourceLoader');
      
      // Load assets first
      if (assets.length > 0) {
        await this.loadAssetsAsync(assets, options);
      }
      
      // Then load fonts
      if (Object.keys(fonts).length > 0) {
        await this.loadFontsAsync(fonts, options);
      }
      
      logger.info('All resources loaded successfully', 'ResourceLoader');
    } catch (error) {
      logger.error('Failed to load resources', error as Error, 'ResourceLoader');
      throw error;
    }
  }
  
  isAssetLoaded(assetId: string): boolean {
    return this.loadedAssets.has(assetId);
  }
  
  isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily);
  }
  
  clearCache(): void {
    this.loadedAssets.clear();
    this.loadedFonts.clear();
    logger.info('Resource loader cache cleared', 'ResourceLoader');
  }
}

export const resourceLoader = new ResourceLoader();
