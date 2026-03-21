import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
  granted: boolean;
}

/**
 * Hook for handling camera and media library permissions.
 */
export const useCameraPermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: false,
    mediaLibrary: false,
    granted: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Request camera and media library permissions.
   */
  const requestPermissions = useCallback(async (): Promise<PermissionStatus> => {
    setIsRequesting(true);
    try {
      // Request camera permission
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permission
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      const status = {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
        granted: cameraStatus.status === 'granted' && mediaStatus.status === 'granted',
      };

      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Permission request failed:', error);
      return { camera: false, mediaLibrary: false, granted: false };
    } finally {
      setIsRequesting(false);
    }
  }, []);

  /**
   * Check current permission status without prompting.
   */
  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

      const status = {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
        granted: cameraStatus.status === 'granted' && mediaStatus.status === 'granted',
      };

      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Permission check failed:', error);
      return { camera: false, mediaLibrary: false, granted: false };
    }
  }, []);

  return {
    ...permissionStatus,
    isRequesting,
    requestPermissions,
    checkPermissions,
  };
};
