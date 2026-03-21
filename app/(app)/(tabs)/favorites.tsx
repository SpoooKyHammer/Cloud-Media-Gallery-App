import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../constants';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (width - SPACING.lg * 2 - SPACING.sm * (numColumns - 1)) / numColumns;

/**
 * Dummy favorites data for placeholder.
 */
const DUMMY_FAVORITES = [
  { id: '1', uri: 'https://picsum.photos/300/300?random=10', type: 'image' },
  { id: '2', uri: 'https://picsum.photos/300/400?random=11', type: 'image' },
  { id: '3', uri: 'https://picsum.photos/300/300?random=12', type: 'image' },
  { id: '4', uri: 'https://picsum.photos/300/500?random=13', type: 'image' },
];

/**
 * Favorites screen - Displays user's favorited media files.
 */
export default function FavoritesScreen() {
  const renderItem = useMemo(
    () =>
      ({ item }: { item: (typeof DUMMY_FAVORITES)[0] }) => (
        <View style={[styles.imageContainer, { width: itemSize, height: itemSize * 1.3 }]}>
          <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ),
    []
  );

  const keyExtractor = useCallback((item: (typeof DUMMY_FAVORITES)[0]) => item.id, []);

  if (DUMMY_FAVORITES.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any media to add it to your favorites
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FlatList
          data={DUMMY_FAVORITES}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  grid: {
    paddingBottom: SPACING.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
});
