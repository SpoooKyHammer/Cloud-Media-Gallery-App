import React, { memo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface MediaPreviewProps {
  assets: ImagePickerAsset[];
  onRemove?: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = SCREEN_WIDTH - (SPACING.xl * 2);

/**
 * Media preview component for showing selected media before upload.
 * Always displays files in a grid layout with remove capability.
 */
export const MediaPreview = memo(({ assets, onRemove }: MediaPreviewProps) => {
  const renderAsset = ({ item, index }: { item: ImagePickerAsset; index: number }) => (
    <AssetItem asset={item} index={index} onRemove={onRemove} />
  );

  return (
    <View style={styles.multiContainer}>
      <FlatList
        data={assets}
        renderItem={renderAsset}
        keyExtractor={(item, index) => `asset-${index}-${item.uri}`}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

MediaPreview.displayName = 'MediaPreview';

/**
 * Format bytes to human-readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface AssetItemProps {
  asset: ImagePickerAsset;
  index: number;
  onRemove?: (index: number) => void;
}

const AssetItem = ({ asset, index, onRemove }: AssetItemProps) => {
  const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video');
  const mediaType = asset.mimeType?.split('/')[0]?.toUpperCase() || 'MEDIA';
  const fileSize = formatFileSize(asset.fileSize || 0);
  const dimensions = asset.width && asset.height 
    ? `${Math.round(asset.width)}×${Math.round(asset.height)}`
    : null;

  return (
    <View style={styles.assetItem}>
      <Image 
        source={{ uri: asset.uri }} 
        style={styles.assetImage} 
        resizeMode="cover"
      />

      {isVideo && (
        <View style={styles.videoIndicator}>
          <Ionicons name="videocam" size={16} color={COLORS.textInverse} />
        </View>
      )}

      {onRemove && (
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => onRemove(index)} 
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={28} color={COLORS.error} />
        </TouchableOpacity>
      )}

      <View style={styles.infoBar}>
        <View style={styles.infoRow}>
          <Ionicons name="file-tray-full" size={12} color={COLORS.textInverse} />
          <Text style={styles.infoText}>
            {mediaType}
          </Text>
        </View>
        <Text style={styles.infoText}>
          {fileSize}
        </Text>
        {dimensions && (
          <Text style={styles.infoText}>
            {dimensions}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  multiContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  assetItem: {
    flex: 1,
    aspectRatio: 1,
    margin: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
    position: 'relative',
  },
  assetImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  videoIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: SPACING.xs / 2,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 10,
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  infoText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: '500',
  },
});
