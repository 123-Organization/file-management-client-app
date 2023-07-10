
import { createContext, useContext, FunctionComponent, useState } from "react";
const DynamicDataContext = createContext({});

type DynamicDataProviderProps = {
  children: any,
}

interface IFileUpload {
  hasSelectedFile: boolean
}


const referrer: IFileUpload = {
  "hasSelectedFile": false
};

const initialState = {
  referrer,
 }



export const DynamicDataProvider: FunctionComponent<DynamicDataProviderProps> = ({ children }) => {
  // init state
  const [state, setState] = useState(initialState);

  // define getters
  const getters = {

  }

  // define mutations
  const mutations = {
    setReferrerData: (referrer: IFileUpload): void => {
      setState((state: any) => ({ ...state, referrer }));
    },
   

  };

  const contextData = {
    state,
    getters,
    mutations
  }

  return (
    <DynamicDataContext.Provider value={contextData}>
      {children}
    </DynamicDataContext.Provider>
  );
}

// Api hook
export function useDynamicData(): any {
  return useContext(DynamicDataContext);
}
