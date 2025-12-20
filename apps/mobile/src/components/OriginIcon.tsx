import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path, Circle, Ellipse, Rect, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants';

interface OriginIconProps {
  origin: string;
  size?: number;
  color?: string;
  withGradient?: boolean;
}

export const OriginIcon: React.FC<OriginIconProps> = ({ 
  origin, 
  size = 24, 
  color = Colors.primary,
  withGradient = false
}) => {
  const normalizedOrigin = origin?.toLowerCase() || 'universal';
  
  const getGradientColors = () => {
    const gradients: Record<string, string[]> = {
      japan: ['#FF6B6B', '#FFE66D'],
      india: ['#F093FB', '#F5576C'],
      tibet: ['#667EEA', '#764BA2'],
      china: ['#4FACFE', '#00F2FE'],
      sufi: ['#43E97B', '#38F9D7'],
      hawaii: ['#30CFD0', '#330867'],
      usa: ['#30CFD0', '#330867'],
      universal: ['#30CFD0', '#330867'],
    };
    return gradients[normalizedOrigin] || gradients.universal;
  };
  
  const renderIcon = () => {
    switch (normalizedOrigin) {
      case 'japan':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M2 17L12 22L22 17"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M2 12L12 17L22 12"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      
      case 'india':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M12 6C12 6 8 10 8 14C8 16 10 18 12 18C14 18 16 16 16 14C16 10 12 6 12 6Z"
              fill={color}
              fillOpacity="0.3"
              stroke={color}
              strokeWidth="2"
            />
            <Circle
              cx="12"
              cy="12"
              r="2"
              fill={color}
            />
          </Svg>
        );
      
      case 'tibet':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L6 12L12 22L18 12L12 2Z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx="12"
              cy="12"
              r="3"
              fill={color}
              fillOpacity="0.3"
            />
            <Path
              d="M12 9V15"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M9 12H15"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
      
      case 'china':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M12 6V12L16 16"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle
              cx="12"
              cy="12"
              r="2"
              fill={color}
            />
          </Svg>
        );
      
      case 'sufi':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M12 2C12 2 6 8 6 12C6 16 10 20 12 20C14 20 18 16 18 12C18 8 12 2 12 2Z"
              fill={color}
              fillOpacity="0.3"
            />
            <Circle
              cx="12"
              cy="12"
              r="3"
              fill={color}
            />
            <Path
              d="M12 2V8M12 16V22M6 12H2M22 12H18"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
      
      case 'hawaii':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M12 2C8 2 5 5 5 9C5 13 8 16 12 16C16 16 19 13 19 9C19 5 16 2 12 2Z"
              fill={color}
              fillOpacity="0.3"
            />
            <Path
              d="M12 16C12 16 8 18 8 20C8 21 9 22 10 22C11 22 12 21 12 20C12 21 13 22 14 22C15 22 16 21 16 20C16 18 12 16 12 16Z"
              fill={color}
              fillOpacity="0.3"
            />
            <Circle
              cx="12"
              cy="9"
              r="2"
              fill={color}
            />
          </Svg>
        );
      
      case 'usa':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 3H21V21H3V3Z"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M3 3L21 21M21 3L3 21"
              stroke={color}
              strokeWidth="2"
            />
            <Circle
              cx="12"
              cy="12"
              r="3"
              fill={color}
              fillOpacity="0.3"
            />
          </Svg>
        );
      
      default:
        // Universal icon
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="2"
            />
            <Path
              d="M2 12H22M12 2C12 2 8 6 8 12C8 18 12 22 12 22M12 2C12 2 16 6 16 12C16 18 12 22 12 22"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle
              cx="12"
              cy="12"
              r="3"
              fill={color}
              fillOpacity="0.3"
            />
          </Svg>
        );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {withGradient ? (
        <View style={styles.gradientContainer}>
          {/* @ts-ignore - LinearGradient type issue with React 19 */}
          <LinearGradient
            colors={getGradientColors() as any}
            style={[styles.gradientBackground, { width: size * 0.8, height: size * 0.8 }]}
          />
          <View style={styles.iconOverlay}>
            {renderIcon()}
          </View>
        </View>
      ) : (
        renderIcon()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBackground: {
    borderRadius: 50,
    opacity: 0.15,
  },
  iconOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
