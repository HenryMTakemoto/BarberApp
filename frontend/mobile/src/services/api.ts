const BASE_URL = 'http://192.168.3.56:8080/api';

// Helper function to make authenticated requests
// Automatically adds the JWT token to every request
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const { default: AsyncStorage } = await import(
    '@react-native-async-storage/async-storage'
  );
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return response;
};

export default apiRequest;
