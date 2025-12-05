/**
 * Helper functions cho authentication trong mobile app
 * Sử dụng Capacitor Preferences để lưu token thay vì cookies
 */

import { Preferences } from '@capacitor/preferences';
import { isCapacitor } from './api-config';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'user-info';

export interface UserInfo {
  username: string;
  role: string;
  id?: string;
}

/**
 * Lưu authentication token
 */
export async function saveAuthToken(token: string): Promise<void> {
  if (isCapacitor) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  } else {
    // Trong web, token được lưu trong cookies bởi server
    // Không cần làm gì ở đây
  }
}

/**
 * Lấy authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  if (isCapacitor) {
    const result = await Preferences.get({ key: TOKEN_KEY });
    return result.value;
  } else {
    // Trong web, lấy từ cookies
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
    return null;
  }
}

/**
 * Xóa authentication token
 */
export async function clearAuthToken(): Promise<void> {
  if (isCapacitor) {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  } else {
    // Trong web, xóa cookie
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

/**
 * Lưu thông tin user
 */
export async function saveUserInfo(user: UserInfo): Promise<void> {
  if (isCapacitor) {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  } else {
    // Trong web, có thể lưu vào localStorage hoặc state
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-info', JSON.stringify(user));
    }
  }
}

/**
 * Lấy thông tin user
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  if (isCapacitor) {
    const result = await Preferences.get({ key: USER_KEY });
    if (result.value) {
      return JSON.parse(result.value);
    }
    return null;
  } else {
    // Trong web, lấy từ localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user-info');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  }
}

/**
 * Kiểm tra đã đăng nhập chưa
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null && token !== '';
}

