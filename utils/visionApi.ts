import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

// Cấu hình API
const CONFIG = {
  // Lưu ý: Có hai cách để kết nối từ thiết bị thật đến server local:
  // 1. Sử dụng địa chỉ IP thực của máy tính, ví dụ: "http://192.168.1.5:8080"
  // 2. Sử dụng adb reverse để chuyển tiếp cổng: 
  //    - Chạy lệnh: adb reverse tcp:8080 tcp:8080
  //    - Sau đó có thể sử dụng: "http://localhost:8080"
  // Có thể dùng VPS sau đó mở port rồi kết nối hoặc dùng ngrok để truy cập vào PC cá nhân
  baseURL: "http://<IP Host>:8080",
  
  maxTokens: 100,
  temperature: 0,
  
  requestInterval: 1000, 
  requestTimeout: 15000, 
  
  defaultInstruction: "Mô tả những gì bạn đang thấy trong ảnh này. Tập trung vào các đối tượng chính, vị trí và hành động. Hãy mô tả ngắn gọn và rõ ràng để giúp người khiếm thị hiểu được xung quanh.",
};

export const testServerConnection = async (): Promise<boolean> => {
  try {
    console.log(`[TEST] Kiểm tra kết nối đến ${CONFIG.baseURL}...`);
    
    // Tạo fetch với timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${CONFIG.baseURL}/v1/models`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`[TEST] Kết nối thành công (${response.status})`);
      return true;
    } else {
      console.log(`[TEST] Máy chủ trả về lỗi: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`[TEST] Không thể kết nối đến server:`, error);
    
    console.log(`[DEBUG] Thông tin thiết bị:
    - Platform: ${Platform.OS} ${Platform.Version}
    - Server URL: ${CONFIG.baseURL}
    - Error name: ${error.name}
    - Error message: ${error.message}
    - Network info: Kiểm tra xem thiết bị có kết nối mạng và đang cùng mạng với server
    `);
    
    // if (CONFIG.baseURL.includes('localhost') || CONFIG.baseURL.includes('127.0.0.1')) {
    //   console.error(`[DEBUG] ⚠️ Phát hiện URL sử dụng localhost! 
    //   Trên thiết bị thật, localhost trỏ đến chính thiết bị, không phải máy tính của bạn.
    //   Hãy thay bằng địa chỉ IP thực của máy tính, ví dụ: http://192.168.1.xxx:8080`);
    // }
    
    return false;
  }
};

export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    console.log(`[DEBUG] Đọc file từ đường dẫn: ${uri}`);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log(`[DEBUG] Đã đọc file thành công, kích thước: ${base64.length} ký tự`);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('[ERROR] Lỗi chuyển đổi ảnh sang base64:', error);
    throw error;
  }
};

const callVisionAPI = async (imageBase64URL: string, instruction: string = CONFIG.defaultInstruction) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
  
  try {
    console.log(`[API] Gửi yêu cầu đến server`);
    console.log(`[API] Độ dài dữ liệu base64: ${imageBase64URL.length} ký tự`);
    
    const requestBody = JSON.stringify({
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      messages: [
        {
          role: 'user', 
          content: [
            {
              type: 'image_url', 
              image_url: {
                url: imageBase64URL,
              }
            },
            { 
              type: 'text', 
              text: instruction 
            },
          ]
        },
      ]
    });
    
    console.log(`[API] Kích thước body request: ${requestBody.length} bytes`);
    
    const response = await fetch(`${CONFIG.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[API ERROR] Server trả về lỗi: ${response.status}`);
      console.error(`[API ERROR] Nội dung lỗi: ${errorData}`);
      throw new Error(`Server error: ${response.status} - ${errorData}`);
    }

    console.log(`[API] Nhận được phản hồi, đang xử lý...`);
    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('[API ERROR] Định dạng phản hồi không hợp lệ:', JSON.stringify(data));
      throw new Error('Định dạng phản hồi không hợp lệ');
    }
    
    console.log(`[API] Xử lý phản hồi thành công`);
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`[API ERROR] Request timeout sau ${CONFIG.requestTimeout/1000} giây`);
      throw new Error(`Quá thời gian chờ phản hồi (${CONFIG.requestTimeout/1000}s)`);
    }
    
    console.error('[API ERROR] Lỗi khi gọi API:', error);
    throw error;
  }
};

const cacheResult = async (imageHash: string, result: string) => {
  try {
    await AsyncStorage.setItem(`vision_result_${imageHash}`, result);
  } catch (error) {
    console.error('Lỗi lưu kết quả vào bộ nhớ:', error);
  }
};

const getCachedResult = async (imageHash: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(`vision_result_${imageHash}`);
  } catch (error) {
    console.error('Lỗi lấy kết quả từ bộ nhớ:', error);
    return null;
  }
};

const createSimpleHash = (base64: string): string => {
  return String(base64.length) + base64.substr(0, 20) + base64.substr(-20);
};

export const recognizeImage = async (imageUri: string, customInstruction?: string): Promise<string> => {
  try {
    const base64ImageURL = await imageToBase64(imageUri);
    const imageHash = createSimpleHash(base64ImageURL);
    
    const cachedResult = await getCachedResult(imageHash);
    if (cachedResult) {
      console.log('Đã tìm thấy kết quả trong bộ nhớ tạm');
      return cachedResult;
    }
    
    const result = await callVisionAPI(base64ImageURL, customInstruction || CONFIG.defaultInstruction);
    
    await cacheResult(imageHash, result);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Lỗi nhận diện hình ảnh:', error);
    return `Không thể nhận diện hình ảnh: ${error.message}. Vui lòng thử lại.`;
  }
};

let lastApiCallTime = 0;

export const recognizeImageRealtime = async (
  imageUri: string,
  onResult: (result: string) => void,
  customInstruction?: string
): Promise<void> => {
  const currentTime = Date.now();
  
  if (currentTime - lastApiCallTime < CONFIG.requestInterval) {
    return;
  }
  
  lastApiCallTime = currentTime;
  
  try {
    console.log('[REALTIME] Đang gửi yêu cầu nhận diện hình ảnh');
    const result = await recognizeImage(imageUri, customInstruction);
    console.log('[REALTIME] Kết quả nhận được:', result.substring(0, 50) + '...');
    onResult(result);
  } catch (error) {
    console.error('[REALTIME ERROR] Lỗi nhận diện hình ảnh thời gian thực:', error);
    onResult(`Lỗi: ${error.message}`);
  }
};

export const updateApiConfig = (newConfig: Partial<typeof CONFIG>) => {
  Object.assign(CONFIG, newConfig);
  console.log('[CONFIG] Đã cập nhật cấu hình API:', JSON.stringify(CONFIG, null, 2));
  
  // if (CONFIG.baseURL.includes('localhost') || CONFIG.baseURL.includes('127.0.0.1')) {
  //   console.warn(`[CONFIG] ⚠️ CẢNH BÁO: Bạn đang sử dụng địa chỉ localhost (${CONFIG.baseURL}).
  //   Điều này sẽ không hoạt động trên thiết bị thật!
  //   Hãy sử dụng địa chỉ IP thực của máy tính, ví dụ: http://192.168.1.xxx:8080`);
    
  //   Alert.alert(
  //     'Cảnh báo: Địa chỉ localhost',
  //     'Bạn đang sử dụng localhost trong cấu hình API. Điều này sẽ không hoạt động trên thiết bị thật. Hãy thay bằng địa chỉ IP của máy tính.',
  //     [{ text: 'Đã hiểu' }]
  //   );
  // }
  
  // Tự động test kết nối sau khi cập nhật config
  testServerConnection()
    .then(isSuccess => {
      if (isSuccess) {
        console.log('[CONFIG] Kết nối server thành công sau khi cập nhật config!');
        
        Alert.alert(
          'Kết nối thành công',
          `Đã kết nối tới server tại ${CONFIG.baseURL}`,
          [{ text: 'OK' }]
        );
      } else {
        console.error('[CONFIG] Không thể kết nối đến server sau khi cập nhật config!');
        Alert.alert(
          'Lỗi kết nối',
          `Không thể kết nối đến server tại ${CONFIG.baseURL}.\nVui lòng kiểm tra:\n- Địa chỉ IP có chính xác không\n- Server đã khởi động chưa\n- Thiết bị có kết nối cùng mạng WiFi với server không`,
          [{ text: 'Đã hiểu' }]
        );
      }
    });
}; 