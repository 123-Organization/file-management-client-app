import { createContext, useContext, FunctionComponent, useState,useEffect } from "react";
import { IFileLocationType } from "../types/IFileLocationType";
import { useCookies } from 'react-cookie';

const DynamicDataContext = createContext({});


type DynamicDataProviderProps = {
  children: any,
}

interface IFileUpload {
  hasSelected: boolean,
  fileSelected: string[]
  filterCount:string
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
  filterUploadFrom:string
  filterUploadTo:string
  filterSortField:string
  filterSortDirection:string
  filterUpdate:string
  GAID:string
  guidPreSelected:string
  libraryOptions: string[]
  multiselectOptions: boolean
  domain: string
  terms_of_service_url: string
  button_text: string
  account_id: number
}  
const referrer: IFileUpload = {
  "hasSelected": false,
  "fileSelected": [],
  'filterCount': "100"
};

const fileLocation: IFileLocation = {
  "selected": IFileLocationType.Temporary
};


const userInfo: IUserInfo = {
  "libraryName": "temporary",
  "librarySessionId": "81de5dba-0300-4988-a1cb-df97dfa4e372",
  "libraryAccountKey": "81de5dba-0300-4988-a1cb-df97dfa4e372",
  "librarySiteId": "2",
  "filterSearchFilter": "",
  "filterPageNumber": "1",
  "filterPerPage": "12",
  "filterUploadFrom": "",
  "filterUploadTo": "",
  "filterSortField": "id",
  "filterSortDirection": "DESC",
  "filterUpdate": "1",
  "GAID": "",
  // "guidPreSelected": "ebc02edb-4ec0-44d7-87e1-fb8395182c36",
  "guidPreSelected": "",
  // "guidPreSelected": "12d2523f-9e9c-49ee-944e-598b3bce0815",
  "libraryOptions": ["temporary","inventory"],
  "multiselectOptions": true,
  "domain": "",
  "terms_of_service_url": "/terms.aspx",
  "button_text": "Create Print",
  "account_id": 12,
}

const initialState = {
  referrer,
  fileLocation,
  userInfo
 }



export const DynamicDataProvider: FunctionComponent<DynamicDataProviderProps> = ({ children }) => {
  const [cookies] = useCookies(['Session', 'AccountGUID']);
  console.log('cookies',cookies)

  if(cookies['Session'] || cookies['AccountGUID'] ){
    userInfo.librarySessionId = cookies['Session'];
    userInfo.libraryAccountKey = cookies['AccountGUID'];
  }
  // init state
  const [state, setState] = useState(initialState);

  // define getters
  const getters = {

  }

  // define mutations
  const mutations = {
    setReferrerData: (referrer: IFileUpload): void => {
      console.log('setReferrerData',referrer)
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
