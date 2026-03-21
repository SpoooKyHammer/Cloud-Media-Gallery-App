import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton loading placeholder with shimmer effect.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 100,
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
};

/**
 * Skeleton card placeholder for media grid items.
 */
export const MediaCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <Skeleton height="100%" borderRadius={12} />
    </View>
  );
};

/**
 * Grid of skeleton placeholders for initial loading state.
 */
export const MediaGridSkeleton: React.FC<{ numColumns?: number; count?: number }> = ({
  numColumns = 3,
  count = 12,
}) => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <MediaCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.backgroundSecondary,
    overflow: 'hidden',
  },
  cardContainer: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
  },
});
