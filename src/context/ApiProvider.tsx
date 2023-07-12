import { createContext, useContext, FunctionComponent } from "react";
import { ApiHelper } from "../common/ApiHelper/ApiHelper";

// init context
const ApiContext = createContext({});

type ApiProviderProps = {
  children: any,
}

export const ApiProvider: FunctionComponent<ApiProviderProps> = ({ children }) => {
  const apiHelper = new ApiHelper();

  return (
    <ApiContext.Provider value={apiHelper}>
      { children }
    </ApiContext.Provider>
  );
}

// Api hook
export function useApi(): any {
  return useContext(ApiContext);
}
