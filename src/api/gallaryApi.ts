import { GenericResponse } from "../types/IUsertype";
import { authApi } from "./authApi";

export const deleteImages = async (data:object) => {
  const response = await authApi.delete<any>(`deleteimage`,{data});
  return response.data;
};


export const getImages = async (data:object) => {
  const response = await authApi.post<any>(`getallimages`,data);
  return response.data;
};


export const startImageUpload = async (data:object) => {
  const response = await authApi.get<any>(`start-upload`,data);
  return response.data;
};

export const getUserAccount = async (accountKey:string) => {
  const response = await authApi.get<any>(`get-user-account?account_key=`+accountKey);
  return response.data;
};


export const putImages = async (data:object) => {
  const response = await authApi.put<any>(`updateimage`,data);
  return response.data;
};

export const postPrintImages = async (data:object) => {
  const response = await authApi.post<any>(`printimages`,data);
  return response.data;
};