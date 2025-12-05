/**
 * Cấu hình API base URL
 * Trong web: sử dụng relative URL (gọi API cùng domain)
 * Trong mobile app: sử dụng absolute URL (gọi API từ server)
 */

// Kiểm tra xem đang chạy trong Capacitor (mobile app) hay không
export const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

// API base URL
// Trong development: có thể dùng localhost
// Trong production: thay bằng URL server thực tế (ví dụ: https://your-domain.com)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Lấy full URL cho API endpoint
 * @param endpoint - API endpoint (ví dụ: '/api/auth/login')
 * @returns Full URL hoặc relative URL tùy vào môi trường
 */
export function getApiUrl(endpoint: string): string {
  // Nếu đang chạy trong Capacitor (mobile app) và có API_BASE_URL
  if (isCapacitor && API_BASE_URL) {
    // Đảm bảo endpoint bắt đầu bằng /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Loại bỏ /api nếu đã có trong API_BASE_URL
    if (API_BASE_URL.endsWith('/api')) {
      return `${API_BASE_URL}${normalizedEndpoint.replace('/api', '')}`;
    }
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }
  
  // Trong web, sử dụng relative URL
  return endpoint;
}

/**
 * Fetch với authentication token
 * Tự động thêm token từ storage (mobile) hoặc cookies (web)
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Lấy token từ storage (mobile) hoặc cookies (web)
  let token: string | null = null;
  
  if (isCapacitor) {
    // Trong mobile app, lấy token từ storage
    const { Preferences } = await import('@capacitor/preferences');
    token = await Preferences.get({ key: 'auth-token' }).then(r => r.value);
  } else {
    // Trong web, lấy token từ cookies
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }
  
  // Thêm token vào headers nếu có
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers: headers as HeadersInit,
  });
}

