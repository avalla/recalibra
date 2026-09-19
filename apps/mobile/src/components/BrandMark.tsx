import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../constants';

interface BrandMarkProps {
  size?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image">
    <Path
      d="M14.5 48C17.2 30.8 28.9 19 45 18.2C44.1 34.6 32.9 46.1 14.5 48Z"
      fill={Colors.primary}
    />
    <Path
      d="M18.4 44.2C25.3 37.4 31.7 30.5 41.3 21.4"
      stroke={Colors.background}
      strokeWidth={3.25}
      strokeLinecap="round"
    />
  </Svg>
);
