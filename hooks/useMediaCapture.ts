import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface UseMediaCaptureReturn {
  selectedMedia: ImagePickerAsset | null;
  isCapturing: boolean;
  error: string | null;
  capturePhoto: () => Promise<ImagePickerAsset | null>;
  captureVideo: () => Promise<ImagePickerAsset | null>;
  selectFromGallery: (multiple?: boolean) => Promise<ImagePickerAsset[] | null>;
  clearSelection: () => void;
}

const VIDEO_MAX_DURATION = 60; // 60 seconds max

/**
 * Hook for capturing and selecting media.
 */
export const useMediaCapture = (): UseMediaCaptureReturn => {
  const [selectedMedia, setSelectedMedia] = useState<ImagePickerAsset | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Capture a photo using the camera.
   * Uses full resolution without cropping/editing.
   */
  const capturePhoto = useCallback(async (): Promise<ImagePickerAsset | null> => {
    try {
      setIsCapturing(true);
      setError(null);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // No cropping/editing
        quality: 1, // Full quality
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      setSelectedMedia(asset);
      return asset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Capture a video using the camera.
   * Uses full resolution without cropping/editing.
   */
  const captureVideo = useCallback(async (): Promise<ImagePickerAsset | null> => {
    try {
      setIsCapturing(true);
      setError(null);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false, // No cropping/editing
        quality: 1, // Full quality
        videoMaxDuration: VIDEO_MAX_DURATION,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      setSelectedMedia(asset);
      return asset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture video';
      setError(message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Select media from the device gallery.
   * No cropping/editing - shows preview screen after selection.
   */
  const selectFromGallery = useCallback(async (multiple = false): Promise<ImagePickerAsset[] | null> => {
    try {
      setIsCapturing(true);
      setError(null);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false, // No cropping/editing
        // Multi-select: iOS uses allowsMultipleSelection, Android uses selectionLimit
        allowsMultipleSelection: multiple,
        selectionLimit: multiple ? 10 : 1,
        quality: 1, // Full quality
      });

      if (result.canceled) {
        return null;
      }

      if (result.assets.length > 0) {
        setSelectedMedia(result.assets[0]);
      }

      return result.assets;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select media';
      setError(message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Clear the selected media.
   */
  const clearSelection = useCallback(() => {
    setSelectedMedia(null);
    setError(null);
  }, []);

  return {
    selectedMedia,
    isCapturing,
    error,
    capturePhoto,
    captureVideo,
    selectFromGallery,
    clearSelection,
  };
};
