import AsyncStorage from '@react-native-async-storage/async-storage';

const API_THROTTLE_INTERVAL = 1000;

const sampleResponses = [
  'Trong hình ảnh có một người đàn ông đang đi bộ trên đường. Bên cạnh anh ấy là một con chó nhỏ màu nâu. Phía xa có vài cây xanh và một chiếc xe đang đỗ.',
  'Hình ảnh cho thấy một phòng khách với ghế sofa màu xám, một chiếc bàn cà phê bằng gỗ và một chiếc TV lớn. Trên tường có vài bức tranh treo.',
  'Đây là một nhà bếp với tủ lạnh, bếp và tủ kệ. Trên bàn bếp có một số trái cây và một bình hoa.',
  'Hình ảnh hiển thị một bàn học với máy tính xách tay, sách và một chiếc đèn bàn. Cạnh đó là một chiếc ghế văn phòng màu đen.',
  'Trong hình có hai người (một nam và một nữ) đang nói chuyện trong một quán cà phê. Trên bàn có hai cốc cà phê và một chiếc bánh ngọt.',
  'Đây là một góc đường đông đúc với nhiều người đi bộ. Có vài cửa hàng và một quán ăn nhỏ ở góc đường.',
  'Hình ảnh cho thấy một người đàn ông lớn tuổi đang ngồi trên ghế đọc sách trong công viên. Xung quanh có nhiều cây xanh và vài đứa trẻ đang chơi đùa.',
  'Đây là một bãi biển với cát trắng và nước biển xanh. Có vài người đang tắm nắng và một vài người đang bơi.',
  'Trong hình có một chiếc xe đạp màu đỏ dựng bên cạnh một cửa hàng. Phía trước cửa hàng có một biển hiệu và vài chậu hoa.',
  'Hình ảnh hiển thị một bàn ăn với các món thức ăn như salad, thịt nướng và rau. Có vài người đang ngồi quanh bàn cùng ăn tối.'
];

const createSimpleHash = (uri: string): string => {
  return String(uri.length) + uri.substr(0, 20) + uri.substr(-20);
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

export const recognizeImage = async (imageUri: string): Promise<string> => {
  try {
    const imageHash = createSimpleHash(imageUri);
    
    const cachedResult = await getCachedResult(imageHash);
    if (cachedResult) {
      console.log('Đã tìm thấy kết quả trong bộ nhớ tạm');
      return cachedResult;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const randomIndex = Math.floor(Math.random() * sampleResponses.length);
    const result = sampleResponses[randomIndex];
    
    await cacheResult(imageHash, result);
    
    return result;
  } catch (error) {
    console.error('Lỗi nhận diện hình ảnh:', error);
    return 'Không thể nhận diện hình ảnh. Vui lòng thử lại.';
  }
};

let lastApiCallTime = 0;

export const recognizeImageRealtime = async (
  imageUri: string,
  onResult: (result: string) => void
): Promise<void> => {
  const currentTime = Date.now();
  
  if (currentTime - lastApiCallTime < API_THROTTLE_INTERVAL) {
    return;
  }
  
  lastApiCallTime = currentTime;
  
  try {
    const result = await recognizeImage(imageUri);
    onResult(result);
  } catch (error) {
    console.error('Lỗi nhận diện hình ảnh thời gian thực:', error);
  }
}; 