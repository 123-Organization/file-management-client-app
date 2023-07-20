import { GenericResponse } from "../types/IUsertype";
import { authApi } from "./authApi";

export const deleteImages = async (data:object) => {
  const response = await authApi.delete<any>(`deleteimage`,{data});
  return response.data;
};