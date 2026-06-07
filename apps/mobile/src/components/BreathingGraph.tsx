import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Circle } from 'react-native-svg';
import { Colors } from '../constants';

export type BreathingPhase = 'inhale' | 'inhale2' | 'hold' | 'exhale' | 'rest' | 'retention';

export type CycleSegment = {
  phase: BreathingPhase;
  duration: number;
};

export type GraphCurvePreset = 'default' | 'relax' | 'energy';

type BreathingGraphProps = {
  width: number;
  height: number;
  segments: CycleSegment[];
  cycleTotalSeconds: number;
  cycleProgress: number;
  activePhaseColor: string;
  strokeColor?: string;
  markers?: GraphMarker[];
  curvePreset?: GraphCurvePreset;
};

type WavePoint = { x: number; y: number };

type ValueLookup = {
  value: number;
  phase: BreathingPhase;
};

export type GraphMarker = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  offset: number;
  tone?: 'water' | 'om' | 'binaural' | 'nature' | 'tibetan' | 'frequency' | 'default';
};

const TOP_PAD_RATIO = 0.18;
const BOTTOM_PAD_RATIO = 0.1;
const CYCLES_RENDERED = 3;
const POINTS_PER_CYCLE = 160;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getMarkerColor(tone: GraphMarker['tone'] | undefined, fallback: string): string {
  switch (tone) {
    case 'water':
      return '#45B7D1';
    case 'om':
      return '#9F7AEA';
    case 'binaural':
      return '#22D3EE';
    case 'tibetan':
      return '#F59E0B';
    case 'nature':
      return '#22C55E';
    case 'frequency':
      return '#60A5FA';
    default:
      return fallback;
  }
}

function getPhaseTarget(phase: BreathingPhase, preset: GraphCurvePreset): number {
  const inhaleMax = preset === 'relax' ? 0.9 : preset === 'energy' ? 1.08 : 1;
  const exhaleMin = preset === 'relax' ? 0.1 : 0;
  const retentionBase = preset === 'relax' ? 0.2 : 0.15;
  switch (phase) {
    case 'inhale':
      return inhaleMax;
    case 'inhale2':
      return inhaleMax;
    case 'hold':
      return inhaleMax;
    case 'exhale':
      return exhaleMin;
    case 'retention':
      return retentionBase;
    case 'rest':
      return exhaleMin;
    default:
      return exhaleMin;
  }
}

function interpolateValue(from: number, to: number, t: number, preset: GraphCurvePreset): number {
  const eased =
    preset === 'energy'
      ? Math.pow(t, 0.7)
      : preset === 'relax'
        ? t * t * (3 - 2 * t)
        : t;
  return from + (to - from) * eased;
}

function mapValueToY(value: number, height: number): number {
  const topPad = height * TOP_PAD_RATIO;
  const bottomPad = height * BOTTOM_PAD_RATIO;
  const innerHeight = height - topPad - bottomPad;
  return height - bottomPad - value * innerHeight;
}

function buildWavePoints(
  segments: CycleSegment[],
  width: number,
  height: number,
  cycleTotalSeconds: number,
  preset: GraphCurvePreset
): WavePoint[] {
  const points: WavePoint[] = [];
  let previousValue = 0;

  for (let cycle = 0; cycle < CYCLES_RENDERED; cycle += 1) {
    let xCursor = cycle * width;

    segments.forEach((segment) => {
      const segmentRatio = segment.duration / cycleTotalSeconds;
      const pointsCount = Math.max(2, Math.round(segmentRatio * POINTS_PER_CYCLE));
      const targetValue = getPhaseTarget(segment.phase, preset);

      for (let i = 0; i < pointsCount; i += 1) {
        const t = pointsCount <= 1 ? 1 : i / (pointsCount - 1);
        const value = interpolateValue(previousValue, targetValue, t, preset);
        const x = xCursor + t * segmentRatio * width;
        const y = mapValueToY(value, height);
        points.push({ x, y });
      }

      previousValue = targetValue;
      xCursor += segmentRatio * width;
    });
  }

  return points;
}

function buildPath(points: WavePoint[]): string {
  if (points.length === 0) return '';
  const start = points[0];
  const commands = [`M ${start.x} ${start.y}`];
  for (let i = 1; i < points.length; i += 1) {
    commands.push(`L ${points[i].x} ${points[i].y}`);
  }
  return commands.join(' ');
}

function buildAreaPath(points: WavePoint[], height: number): string {
  if (points.length === 0) return '';
  const start = points[0];
  const end = points[points.length - 1];
  const path = buildPath(points);
  return `${path} L ${end.x} ${height} L ${start.x} ${height} Z`;
}

function getValueAtProgress(
  segments: CycleSegment[],
  cycleTotalSeconds: number,
  progress: number,
  preset: GraphCurvePreset
): ValueLookup {
  const clamped = clampNumber(progress, 0, 1);
  const targetSeconds = clamped * cycleTotalSeconds;
  let elapsed = 0;
  let previousValue = 0;

  for (const segment of segments) {
    const segmentEnd = elapsed + segment.duration;
    const targetValue = getPhaseTarget(segment.phase, preset);

    if (targetSeconds <= segmentEnd) {
      const t = segment.duration === 0 ? 1 : (targetSeconds - elapsed) / segment.duration;
      return {
        value: interpolateValue(previousValue, targetValue, t, preset),
        phase: segment.phase,
      };
    }

    elapsed = segmentEnd;
    previousValue = targetValue;
  }

  return { value: previousValue, phase: segments[segments.length - 1]?.phase ?? 'rest' };
}

function getHoldMarkers(
  segments: CycleSegment[],
  cycleTotalSeconds: number,
  width: number
): number[] {
  let elapsed = 0;
  const markers: number[] = [];

  segments.forEach((segment) => {
    const isHold = segment.phase === 'hold' || segment.phase === 'retention';
    if (isHold) {
      markers.push(elapsed / cycleTotalSeconds);
    }
    elapsed += segment.duration;
  });

  return markers.map((marker) => marker * width);
}

export function BreathingGraph({
  width,
  height,
  segments,
  cycleTotalSeconds,
  cycleProgress,
  activePhaseColor,
  strokeColor = Colors.textMuted,
  markers = [],
  curvePreset = 'default',
}: BreathingGraphProps): React.ReactElement {
  const normalizedProgress = clampNumber(cycleProgress, 0, 1);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevPhaseColorRef = useRef(activePhaseColor);
  const currentPhaseColorRef = useRef(activePhaseColor);

  const points = useMemo(
    () => buildWavePoints(segments, width, height, cycleTotalSeconds, curvePreset),
    [segments, width, height, cycleTotalSeconds, curvePreset]
  );

  const areaPath = useMemo(() => buildAreaPath(points, height), [points, height]);
  const linePath = useMemo(() => buildPath(points), [points]);

  // Center the current cycle-progress under the fixed center playhead.
  // The wave renders CYCLES_RENDERED cycles side by side; we scroll so that
  // fraction `p` of the middle cycle (layer x = width + p*width) lands at
  // screen x = width/2. Without the -width/2 offset the wave under the
  // playhead is half a cycle out of sync with the breathing phase / dot.
  const translateX = -normalizedProgress * width - width / 2;

  const nowPoint = useMemo(
    () => getValueAtProgress(segments, cycleTotalSeconds, normalizedProgress, curvePreset),
    [segments, cycleTotalSeconds, normalizedProgress, curvePreset]
  );

  const nowY = mapValueToY(nowPoint.value, height);

  const holdMarkers = useMemo(
    () => getHoldMarkers(segments, cycleTotalSeconds, width),
    [segments, cycleTotalSeconds, width]
  );

  const markerPositions = useMemo(
    () =>
      markers
        .map((marker) => {
          const offset = clampNumber(marker.offset, 0, 1);
          const x = width / 2 + (offset - normalizedProgress) * width;
          return {
            marker,
            x,
          };
        })
        .filter((item) => item.x > -40 && item.x < width + 40),
    [markers, normalizedProgress, width]
  );

  useEffect(() => {
    prevPhaseColorRef.current = currentPhaseColorRef.current;
    currentPhaseColorRef.current = activePhaseColor;
    fadeAnim.stopAnimation();
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: false,
    }).start();
  }, [activePhaseColor, fadeAnim]);

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.graphViewport, { width, height }]}>
        <View style={[styles.graphLayer, { transform: [{ translateX }] }]}>
          <Svg width={width * CYCLES_RENDERED} height={height}>
            <Defs>
              <LinearGradient id="breathGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={activePhaseColor} stopOpacity={0.4} />
                <Stop offset="1" stopColor={Colors.primary} stopOpacity={0.18} />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#breathGradient)" />
            {(() => {
              const AnimatedPath = Animated.createAnimatedComponent(Path);
              return (
                <>
                  <AnimatedPath
                    d={linePath}
                    stroke={prevPhaseColorRef.current}
                    strokeWidth={3.5}
                    fill="none"
                    opacity={fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 0],
                    })}
                  />
                  <AnimatedPath
                    d={linePath}
                    stroke={activePhaseColor}
                    strokeWidth={3.5}
                    fill="none"
                    opacity={fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    })}
                  />
                </>
              );
            })()}
            <Path
              d={linePath}
              stroke={strokeColor}
              strokeWidth={1.5}
              opacity={0.35}
              fill="none"
            />
            {holdMarkers.map((markerX, index) => (
              <Line
                key={`marker-${index}`}
                x1={markerX}
                x2={markerX}
                y1={height * 0.12}
                y2={height * 0.9}
                stroke={activePhaseColor}
                strokeWidth={1.2}
                opacity={0.2}
              />
            ))}
          </Svg>
        </View>
        <View pointerEvents="none" style={[styles.playhead, { left: width / 2 - 1 }]}>
          <View style={[styles.playheadGlow, { backgroundColor: activePhaseColor }]} />
          <View style={[styles.playheadLine, { backgroundColor: activePhaseColor }]} />
          <View
            style={[
              styles.playheadDot,
              {
                backgroundColor: activePhaseColor,
                top: nowY - 6,
              },
            ]}
          />
        </View>
        <Svg pointerEvents="none" width={width} height={height} style={styles.centerOverlay}>
          <Circle
            cx={width / 2}
            cy={nowY}
            r={10}
            fill={activePhaseColor}
            opacity={0.12}
          />
        </Svg>
        {markerPositions.length > 0 && (
          <View pointerEvents="none" style={styles.markerLayer}>
            {markerPositions.map(({ marker, x }, index) => {
              const markerColor = getMarkerColor(marker.tone, activePhaseColor);
              return (
                <Animated.View
                  key={marker.id}
                  style={[
                    styles.markerBubble,
                    {
                      left: x - 24,
                    },
                  ]}
                >
                  <View style={[styles.markerIconWrap, { backgroundColor: markerColor + '1A' }]}>
                    <Ionicons name={marker.icon} size={14} color={markerColor} />
                  </View>
                  <Text style={styles.markerLabel} numberOfLines={1}>
                    {marker.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphViewport: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: Colors.backgroundElevated,
  },
  graphLayer: {
    height: '100%',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playheadLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.65,
  },
  playheadGlow: {
    position: 'absolute',
    width: 8,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.15,
  },
  playheadDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  centerOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  markerLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    height: 40,
  },
  markerBubble: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.backgroundElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markerIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabel: {
    color: Colors.textPrimary,
    fontSize: 11,
  },
});
