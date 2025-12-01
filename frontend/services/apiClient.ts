import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Client HTTP generik untuk API eksternal di masa depan.
// Saat ini TIDAK digunakan di mana pun, hanya disiapkan sebagai abstraksi.
// Ketika Anda menambahkan API eksternal, cukup impor instance ini di service terkait.

const defaultConfig: AxiosRequestConfig = {
  // Base URL bisa diatur lewat env Expo jika nanti dibutuhkan, misalnya:
  // baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  // Untuk sekarang dibiarkan undefined agar tidak mengganggu perilaku yang ada.
  timeout: 15000,
};

export const externalApiClient: AxiosInstance = axios.create(defaultConfig);


