import axios from 'axios';
import { GenericResponse, ILoginResponse, IUserResponse } from '../types/IUsertype';

const BASE_URL = 'https://app-filemanager.finerworks.com/api/';
// const BASE_URL = 'http://localhost:5000/api/';

export const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

authApi.defaults.headers.common['Content-Type'] = 'application/json';
authApi.defaults.headers.common['Access-Control-Allow-Origin'] = '*';


export const refreshAccessTokenFn = async () => {
  const response = await authApi.get<ILoginResponse>('auth/refresh');
  return response.data;
};

authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errMessage = error.response.data.message as string;
    if (errMessage.includes('not logged in') && !originalRequest._retry) {
      originalRequest._retry = true;
      //await refreshAccessTokenFn();
      return 'tken';// authApi(originalRequest);
    }
    if (error.response.data.message.includes('not refresh')) {
      document.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const verifyEmailFn = async (verificationCode: string) => {
  const response = await authApi.get<GenericResponse>(
    `auth/verifyemail/${verificationCode}`
  );
  return response.data;
};

export const logoutUserFn = async () => {
  const response = await authApi.get<GenericResponse>('auth/logout');
  return response.data;
};

export const getMeFn = async () => {
  const response = await authApi.get<IUserResponse>('users/me');
  return response.data;
};