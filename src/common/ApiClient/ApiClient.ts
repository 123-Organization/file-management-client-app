import { Config } from '../../common/Config/Config';


const BASE_API_URL: string = Config.api.backend.baseUrl.endpoint;
const API_ERROR_CODE: number = Config.api.backend.errorCode;

export class ApiClient {
  private baseUrl: string;
  private apiErrorCode: number;

  constructor() {
    this.baseUrl = BASE_API_URL;
    this.apiErrorCode = API_ERROR_CODE;
  }

 
}
