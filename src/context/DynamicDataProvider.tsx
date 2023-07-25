import { createContext, useContext, FunctionComponent, useState } from "react";
import { IFileLocationType } from "../types/IFileLocationType";
const DynamicDataContext = createContext({});

type DynamicDataProviderProps = {
  children: any,
}

interface IFileUpload {
  hasSelected: boolean,
  fileSelected: string[]
}

interface IFileLocation {
  selected: string
}

interface IUserInfo {
  libraryName:string
  librarySessionId:string
  libraryAccountKey:string
  librarySiteId:string
  filterSearchFilter:string
  filterPageNumber:string
  filterPerPage:string
}  
const referrer: IFileUpload = {
  "hasSelected": false,
  "fileSelected": []
};

const fileLocation: IFileLocation = {
  "selected": IFileLocationType.Temporary
};


const userInfo: IUserInfo = {
  "libraryName": "temporary",
  "librarySessionId": "81de5dba-0300-4988-a1cb-df97dfa4e3721",
  "libraryAccountKey": "kqdzaai2xyzppcxuhgsjorv21",
  "librarySiteId": "2",
  "filterSearchFilter": "",
  "filterPageNumber": "1",
  "filterPerPage": "12"
}

const initialState = {
  referrer,
  fileLocation,
  userInfo
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
    setUserInfoData: (userInfo: IUserInfo): void => {
      setState((state: any) => ({ ...state, userInfo }));
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
