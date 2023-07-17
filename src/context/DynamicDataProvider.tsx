
import { createContext, useContext, FunctionComponent, useState } from "react";
import { IFileLocationType } from "../types/IFileLocationType";
const DynamicDataContext = createContext({});

type DynamicDataProviderProps = {
  children: any,
}

interface IFileUpload {
  hasSelected: boolean
}

interface IFileLocation {
  selected: string
}


const referrer: IFileUpload = {
  "hasSelected": false
};

const fileLocation: IFileLocation = {
  "selected": IFileLocationType.Temporary
};


const initialState = {
  referrer,
  fileLocation
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
    setFileLocationData: (fileLocation: IFileLocation): void => {
      setState((state: any) => ({ ...state, fileLocation }));
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
