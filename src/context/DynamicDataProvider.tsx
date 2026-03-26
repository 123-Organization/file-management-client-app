import { createContext, useContext, FunctionComponent, useState, useEffect, useCallback } from "react";
import { IFileLocationType } from "../types/IFileLocationType";
import { useCookies } from 'react-cookie';
import { useSearchParams } from "react-router-dom";

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

//sync
const userInfo: IUserInfo = {
  "libraryName": "temporary",
  "librarySessionId": "",
  "libraryAccountKey": "",
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
  userInfo,
  openUpload: false
 }





export const DynamicDataProvider: FunctionComponent<DynamicDataProviderProps> = ({ children }) => {
  const [cookies] = useCookies(['Session', 'AccountGUID']);
  
  

  const [searchParams, setSearchParams] = useSearchParams();

  const [state, setState] = useState(() => {
    const urlPage = searchParams.get('page');
    const urlLimit = searchParams.get('limit');
    
    // We'll initially use namespaced keys if available
    const initialLibrary = userInfo.libraryName;
    const storedPage = localStorage.getItem(`pagination_${initialLibrary}_page`);
    const storedLimit = localStorage.getItem(`pagination_${initialLibrary}_limit`);

    return {
      referrer,
      fileLocation,
      userInfo: {
        ...userInfo,
        filterPageNumber: urlPage || storedPage || userInfo.filterPageNumber,
        filterPerPage: urlLimit || storedLimit || userInfo.filterPerPage,
        librarySessionId: cookies['Session'] || userInfo.librarySessionId,
        libraryAccountKey: cookies['AccountGUID'] || userInfo.libraryAccountKey,
      },
      openUpload: false
    };
  });

  // Sync state to URL when userInfo pagination changes
  useEffect(() => {
    const currentPage = state.userInfo.filterPageNumber;
    const currentLimit = state.userInfo.filterPerPage;
    
    const params = new URLSearchParams(searchParams);
    let changed = false;

    if (currentPage !== "1" || params.has('page')) {
      if (params.get('page') !== currentPage) {
        params.set('page', currentPage);
        changed = true;
      }
    }
    
    if (currentLimit !== "12" || params.has('limit')) {
      if (params.get('limit') !== currentLimit) {
        params.set('limit', currentLimit);
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [state.userInfo.filterPageNumber, state.userInfo.filterPerPage, setSearchParams]);

  // Sync to local storage when pagination values change
  useEffect(() => {
    const library = state.userInfo.libraryName;
    localStorage.setItem(`pagination_${library}_page`, state.userInfo.filterPageNumber);
    localStorage.setItem(`pagination_${library}_limit`, state.userInfo.filterPerPage);
  }, [state.userInfo.filterPageNumber, state.userInfo.filterPerPage]);

  useEffect(() => {
    setState((prevState: any) => ({
      ...prevState,
      userInfo: {
        ...prevState.userInfo,
        librarySessionId: cookies['Session'] || prevState.userInfo.librarySessionId,
        libraryAccountKey: cookies['AccountGUID'] || prevState.userInfo.libraryAccountKey,
      },
    }));
  }, [cookies]);

  // Handle library switch - load last known pagination state
  useEffect(() => {
    const library = state.userInfo.libraryName;
    const storedPage = localStorage.getItem(`pagination_${library}_page`) || "1";
    const storedLimit = localStorage.getItem(`pagination_${library}_limit`) || "12";

    if (state.userInfo.filterPageNumber !== storedPage || state.userInfo.filterPerPage !== storedLimit) {
      setState((prevState: any) => ({
        ...prevState,
        userInfo: {
          ...prevState.userInfo,
          filterPageNumber: storedPage,
          filterPerPage: storedLimit,
        }
      }));
    }
  }, [state.userInfo.libraryName]);

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
    setOpenUpload: (openUpload: boolean): void => {
      setState((state: any) => ({ ...state, openUpload }));
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
