/**
 * Global fetch wrapper để tự động thay thế API URLs cho mobile app
 * Sử dụng trong mobile app để tự động thêm base URL
 */

// Kiểm tra xem đang chạy trong Capacitor (mobile app) hay không
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

// API base URL từ environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Wrapper cho fetch để tự động thay thế API URLs
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let url: string;
  
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else {
    url = input.url;
  }
  
  // Nếu đang chạy trong mobile app và có API_BASE_URL
  // Và URL là relative path bắt đầu bằng /api/
  if (isCapacitor && API_BASE_URL && url.startsWith('/api/')) {
    // Thay thế relative URL bằng absolute URL
    url = `${API_BASE_URL}${url}`;
  }
  
  // Lấy token từ storage (mobile) hoặc cookies (web)
  let token: string | null = null;
  
  if (isCapacitor) {
    // Trong mobile app, lấy token từ Capacitor Preferences
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const result = await Preferences.get({ key: 'auth-token' });
      token = result.value;
    } catch (error) {
      console.warn('Failed to get token from Preferences:', error);
    }
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
    ...(init?.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Tạo request với URL đã được thay thế
  const requestInit: RequestInit = {
    ...init,
    headers: headers as HeadersInit,
    credentials: isCapacitor ? 'omit' : 'include', // Mobile không dùng cookies
  };
  
  if (typeof input === 'string' || input instanceof URL) {
    return fetch(url, requestInit);
  } else {
    // Nếu input là Request object, tạo Request mới với URL đã thay đổi
    return fetch(url, requestInit);
  }
}

/**
 * Thay thế global fetch (chỉ trong mobile app)
 * Sử dụng với cẩn thận - có thể ảnh hưởng đến các thư viện khác
 */
export function setupGlobalFetch() {
  if (isCapacitor && typeof window !== 'undefined') {
    // Lưu fetch gốc
    const originalFetch = window.fetch;
    
    // Thay thế fetch
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      return apiFetch(input, init);
    };
  }
}

