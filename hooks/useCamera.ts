import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { recognizeImageRealtime } from '../utils/visionApi';

interface UseCameraProps {
  onRecognitionResult?: (result: string) => void;
}

interface UseCameraReturn {
  hasPermission: boolean | null;
  cameraRef: React.RefObject<Camera>;
  type: any;
  flashMode: any;
  isCameraReady: boolean;
  isRecognizing: boolean;
  recognitionResult: string;
  lastImageUri: string | null;
  toggleCameraType: () => void;
  toggleFlash: () => void;
  takePicture: () => Promise<void>;
  startRealtimeRecognition: () => void;
  stopRealtimeRecognition: () => void;
  speakResult: (text?: string) => void;
}

export const useCamera = ({ onRecognitionResult }: UseCameraProps = {}): UseCameraReturn => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<string>('');
  const [lastImageUri, setLastImageUri] = useState<string | null>(null);
  const [realtimeRecognition, setRealtimeRecognition] = useState<boolean>(false);
  
  const cameraRef = useRef<Camera>(null);
  const recognitionInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(
        cameraStatus === 'granted' && mediaLibraryStatus === 'granted'
      );
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Ứng dụng cần quyền truy cập vào camera và thư viện ảnh để hoạt động.',
          [{ text: 'Đã hiểu' }]
        );
      }
    })();
    
    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
      
      Speech.stop();
    };
  }, []);

  const toggleCameraType = () => {
    setType(prevType => (
      prevType === Camera.Constants.Type.back 
        ? Camera.Constants.Type.front 
        : Camera.Constants.Type.back
    ));
  };

  const toggleFlash = () => {
    setFlashMode(prevFlashMode => (
      prevFlashMode === Camera.Constants.FlashMode.off 
        ? Camera.Constants.FlashMode.on 
        : Camera.Constants.FlashMode.off
    ));
  };

  const takePicture = async (): Promise<void> => {
    if (!cameraRef.current || !isCameraReady) return;
    
    try {
      setIsRecognizing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: Platform.OS === 'android', // Tối ưu cho Android
      });
      
      setLastImageUri(photo.uri);
      
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      
      console.log(`[DEBUG] Bắt đầu đọc kết quả`);
      await recognizeImageRealtime(photo.uri, (result) => {
        setRecognitionResult(result);
        if (onRecognitionResult) {
          onRecognitionResult(result);
        }
        
        console.log(`[DEBUG] Bắt đầu đọc kết quả`);
        speakResult(result);
      });
    } catch (error) {
      console.error('Lỗi khi chụp ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsRecognizing(false);
    }
  };

  const speakResult = (textToSpeak?: string): void => {
    console.log(`[DEBUG] Đọc file speakResult: ${textToSpeak}`);
    const text = textToSpeak || recognitionResult;
    if (!text) return;
    
    try {
      console.log(`[DEBUG] Bắt đầu đọc stop`);
      Speech.stop();
      
      const tryLanguages = [
        'vi-VN',  
        'vi',    
        '',      
        'en-US'   
      ];
      
      // Thử lần lượt từng ngôn ngữ
      const tryNextLanguage = (index = 0) => {
        if (index >= tryLanguages.length) {
          console.log('[DEBUG] Đã thử tất cả ngôn ngữ, không thành công');
          return;
        }
        
        const lang = tryLanguages[index];
        console.log(`[DEBUG] Thử ngôn ngữ: ${lang || 'default'}`);
        
        const options = {
          language: lang,
          pitch: 1.0,
          rate: 0.9,
          onStart: () => console.log(`[DEBUG] Bắt đầu đọc với ngôn ngữ: ${lang || 'default'}`),
          onDone: () => console.log('[DEBUG] Đã đọc xong'),
          onStopped: () => console.log('[DEBUG] Bị dừng'),
          onError: (error: any) => {
            console.log(`[DEBUG] Lỗi khi đọc với ngôn ngữ ${lang}:`, error);
            tryNextLanguage(index + 1);
          }
        };
        
        Speech.speak(text, options);
      };
      
      tryNextLanguage();
      
    } catch (error) {
      console.error('[ERROR] Lỗi khi sử dụng Speech:', error);
      Alert.alert(
        'Lỗi Text-to-Speech',
        'Không thể sử dụng chức năng đọc văn bản. Vui lòng kiểm tra cài đặt âm thanh của thiết bị.',
        [{ text: 'Đã hiểu' }]
      );
    }
  };

  const startRealtimeRecognition = (): void => {
    setRealtimeRecognition(true);
    
    // Thiết lập khoảng thời gian chụp ảnh và nhận diện
    recognitionInterval.current = setInterval(async () => {
      if (!cameraRef.current || !isCameraReady || isRecognizing) return;
      
      try {
        setIsRecognizing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
          skipProcessing: true,
        });
        
        setLastImageUri(photo.uri);
        
        await recognizeImageRealtime(photo.uri, (result) => {
          if (result !== recognitionResult) {
            console.log(`[DEBUG] Đọc file result: ${result}`);
            setRecognitionResult(result);
            if (onRecognitionResult) {
              onRecognitionResult(result);
              console.log(`[DEBUG] Đọc file result: ${result}`);
            }
            
            speakResult(result);
          }
        });
      } catch (error) {
        console.error('Lỗi nhận diện thời gian thực:', error);
      } finally {
        setIsRecognizing(false);
      }
    }, 5000); 
  };

  const stopRealtimeRecognition = (): void => {
    setRealtimeRecognition(false);
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current);
      recognitionInterval.current = null;
    }
  };

  return {
    hasPermission,
    cameraRef,
    type,
    flashMode,
    isCameraReady,
    isRecognizing,
    recognitionResult,
    lastImageUri,
    toggleCameraType,
    toggleFlash,
    takePicture,
    startRealtimeRecognition,
    stopRealtimeRecognition,
    speakResult,
  };
}; 