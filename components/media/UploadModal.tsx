import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants';
import { MediaPreview } from './MediaPreview';
import { useUploadMedia, UploadProgress } from '../../hooks/useMedia';
import { useMediaCapture } from '../../hooks/useMediaCapture';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';
import { getErrorMessage } from '../../utils/errorHandler';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Upload modal for capturing or selecting media and uploading.
 */
export const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [uploadStage, setUploadStage] = useState<'select' | 'preview' | 'uploading' | 'done'>('select');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, uploaded: 0, total: 0 });
  const [selectedAssets, setSelectedAssets] = useState<ImagePickerAsset[]>([]);

  const {
    camera: hasCameraPermission,
    mediaLibrary: hasMediaPermission,
    granted: hasAllPermissions,
    isRequesting,
    requestPermissions,
  } = useCameraPermissions();

  const {
    selectedMedia,
    isCapturing,
    error: captureError,
    capturePhoto,
    captureVideo,
    selectFromGallery,
    clearSelection,
  } = useMediaCapture();

  const {
    mutate: uploadMedia,
    isPending: isUploading,
  } = useUploadMedia();

  // Sync selectedMedia from hook to our local array
  React.useEffect(() => {
    if (selectedMedia && selectedAssets.length === 0) {
      setSelectedAssets([selectedMedia]);
    }
  }, [selectedMedia]);

  /**
   * Handle requesting permissions.
   */
  const handleRequestPermissions = useCallback(async () => {
    const status = await requestPermissions();
    if (!status.granted) {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to upload media. Please grant permissions in your device settings.',
        [{ text: 'OK' }]
      );
    }
  }, [requestPermissions]);

  /**
   * Handle capturing a photo.
   */
  const handleCapturePhoto = useCallback(async () => {
    if (!hasCameraPermission) {
      await handleRequestPermissions();
      return;
    }
    const asset = await capturePhoto();
    if (asset) {
      setUploadStage('preview');
    }
  }, [hasCameraPermission, handleRequestPermissions, capturePhoto]);

  /**
   * Handle capturing a video.
   */
  const handleCaptureVideo = useCallback(async () => {
    if (!hasCameraPermission) {
      await handleRequestPermissions();
      return;
    }
    const asset = await captureVideo();
    if (asset) {
      setUploadStage('preview');
    }
  }, [hasCameraPermission, handleRequestPermissions, captureVideo]);

  /**
   * Handle selecting from gallery.
   */
  const handleSelectFromGallery = useCallback(async () => {
    if (!hasMediaPermission) {
      await handleRequestPermissions();
      return;
    }
    const assets = await selectFromGallery(true);
    if (assets && assets.length > 0) {
      setSelectedAssets(assets);
      setUploadStage('preview');
    }
  }, [hasMediaPermission, handleRequestPermissions, selectFromGallery]);

  /**
   * Handle uploading the selected media.
   */
  const handleUpload = useCallback(() => {
    if (selectedAssets.length === 0) return;

    setUploadStage('uploading');
    setUploadProgress({ progress: 0, uploaded: 0, total: 0 });
    uploadMedia({
      assets: selectedAssets,
      onProgress: (progress) => setUploadProgress(progress),
    }, {
      onSuccess: (data) => {
        setUploadStage('done');
        setTimeout(() => {
          clearSelection();
          setUploadStage('select');
          onSuccess?.();
          onClose();
        }, 1500);
      },
      onError: (error) => {
        const message = getErrorMessage(error);
        Alert.alert('Upload Failed', message);
        setUploadStage('preview');
      },
    });
  }, [selectedAssets, uploadMedia, onSuccess, onClose, clearSelection]);

  /**
   * Handle removing an asset from selection.
   */
  const handleRemoveAsset = useCallback((index: number) => {
    setSelectedAssets(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setUploadStage('select');
      }
      return updated;
    });
  }, []);

  /**
   * Handle going back to selection.
   */
  const handleBack = useCallback(() => {
    clearSelection();
    setSelectedAssets([]);
    setUploadStage('select');
  }, [clearSelection]);

  /**
   * Handle closing the modal.
   */
  const handleClose = useCallback(() => {
    clearSelection();
    setSelectedAssets([]);
    setUploadStage('select');
    onClose();
  }, [clearSelection, onClose]);

  // Render selection stage
  const renderSelection = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Media</Text>
        <Text style={styles.subtitle}>Add photos or videos to your gallery</Text>
      </View>

      <View style={styles.optionsGrid}>
        <TouchableOpacity
          style={[styles.optionCard, !hasCameraPermission && styles.optionCardDisabled]}
          onPress={handleCapturePhoto}
          disabled={isCapturing || (isRequesting && !hasCameraPermission)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, styles.photoIconBg]}>
            <Ionicons name="camera" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.optionTitle}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, !hasCameraPermission && styles.optionCardDisabled]}
          onPress={handleCaptureVideo}
          disabled={isCapturing || (isRequesting && !hasCameraPermission)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, styles.videoIconBg]}>
            <Ionicons name="videocam" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.optionTitle}>Record Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.optionCardFull, !hasMediaPermission && styles.optionCardDisabled]}
        onPress={handleSelectFromGallery}
        disabled={isCapturing || (isRequesting && !hasMediaPermission)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.galleryIconBg]}>
          <Ionicons name="images" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.optionTitleFull}>Select from Gallery</Text>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {(!hasAllPermissions || isRequesting) && (
        <View style={styles.permissionNotice}>
          <Ionicons name="information-circle" size={18} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>
            {isRequesting ? 'Requesting permissions...' : 'Camera and media library permissions required'}
          </Text>
        </View>
      )}

      {captureError && (
        <Text style={styles.errorText}>{captureError}</Text>
      )}
    </View>
  );

  // Render preview stage
  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.previewTitle}>
          Preview {selectedAssets.length > 1 ? `(${selectedAssets.length})` : ''}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.previewContent}>
        <MediaPreview 
          assets={selectedAssets}
          onRemove={handleRemoveAsset}
        />
      </View>

      <View style={styles.previewActions}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color={COLORS.textInverse} />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render uploading stage
  const renderUploading = () => (
    <View style={styles.uploadingContainer}>
      <View style={styles.uploadingContent}>
        <View style={styles.progressCircle}>
          {uploadProgress.progress > 0 ? (
            <>
              <Text style={styles.progressPercentage}>{Math.round(uploadProgress.progress)}%</Text>
              <Text style={styles.progressDetails}>
                {formatBytes(uploadProgress.uploaded)} / {formatBytes(uploadProgress.total)}
              </Text>
            </>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
        </View>
        <Text style={styles.uploadingText}>
          {uploadProgress.progress > 0 && uploadProgress.progress < 100
            ? 'Uploading...'
            : uploadProgress.progress >= 100
            ? 'Finalizing...'
            : 'Starting upload...'}
        </Text>
      </View>
    </View>
  );

  // Render done stage
  const renderDone = () => (
    <View style={styles.doneContainer}>
      <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
      <Text style={styles.doneText}>Upload Successful!</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {uploadStage === 'select' && renderSelection()}
        {uploadStage === 'preview' && renderPreview()}
        {uploadStage === 'uploading' && renderUploading()}
        {uploadStage === 'done' && renderDone()}
      </SafeAreaView>
    </Modal>
  );
};

/**
 * Format bytes to human-readable format.
 */
function formatBytes(bytes: number): string {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  selectionContainer: {
    flex: 1,
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  optionCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIconBg: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  videoIconBg: {
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
  },
  galleryIconBg: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTitleFull: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  previewActions: {
    padding: SPACING.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  uploadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  uploadingText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  doneText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.success,
  },
});
