import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../constants';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (width - SPACING.lg * 2 - SPACING.sm * (numColumns - 1)) / numColumns;

/**
 * Dummy media data for gallery placeholder.
 */
const DUMMY_MEDIA = [
  { id: '1', uri: 'https://picsum.photos/300/300?random=1', type: 'image' },
  { id: '2', uri: 'https://picsum.photos/300/400?random=2', type: 'image' },
  { id: '3', uri: 'https://picsum.photos/300/300?random=3', type: 'image' },
  { id: '4', uri: 'https://picsum.photos/300/500?random=4', type: 'image' },
  { id: '5', uri: 'https://picsum.photos/300/300?random=5', type: 'image' },
  { id: '6', uri: 'https://picsum.photos/300/400?random=6', type: 'image' },
  { id: '7', uri: 'https://picsum.photos/300/300?random=7', type: 'image' },
  { id: '8', uri: 'https://picsum.photos/300/300?random=8', type: 'image' },
  { id: '9', uri: 'https://picsum.photos/300/400?random=9', type: 'image' },
];

/**
 * Gallery screen - Displays user's media files in a grid layout.
 */
export default function GalleryScreen() {
  const renderItem = useMemo(
    () =>
      ({ item }: { item: (typeof DUMMY_MEDIA)[0] }) => (
        <View style={[styles.imageContainer, { width: itemSize, height: itemSize * 1.3 }]}>
          <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
        </View>
      ),
    []
  );

  const keyExtractor = useCallback((item: (typeof DUMMY_MEDIA)[0]) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FlatList
          data={DUMMY_MEDIA}
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
