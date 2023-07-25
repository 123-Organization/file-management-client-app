import React from 'react'
import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';
import { useDynamicData } from '../context/DynamicDataProvider';



const BottomIcon: React.FC = (): JSX.Element => {
    const dynamicData: any = useDynamicData();
    const { userInfo, referrer, fileLocation } = dynamicData.state;
    
    const onChange: PaginationProps['onChange'] = (filterPageNumber) => {
        console.log('Page: ', filterPageNumber);
    
        let userInfoObj = {...userInfo,filterPageNumber};
    
        let isUpdated = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
        console.log('isUpdated',isUpdated,userInfo,userInfoObj)
    
        isUpdated && dynamicData.mutations.setUserInfoData(userInfoObj);
      };
    
    console.log('fileLocation',fileLocation)
    return (
        <div className='flex'>
            <div className="flex fixed bottom-0 left-0  w-full h-16 bg-white  border-b mt-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="grid h-full max-w-lg grid-cols-4 font-medium basis-1/2">
                    {
                        referrer.hasSelected &&
                        <>
                            {
                            fileLocation.selected==='inventory' && 
                                <button type="button" className="inline-flex flex-col items-center ml-20 justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                    <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 19">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3M9.5 1v10.93m4-3.93-4 4-4-4" />
                                    </svg>
                                    <span className="text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Download Selected</span>
                                </button>
                            }
                            <button data-tooltip-target="tooltip-document" type="button" className="inline-flex ml-20 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z" />
                                </svg>
                                {/* <span className="sr-only">New document</span> */}
                                <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Delete Selected</span>
                            </button>
                        </>    
                    }
                </div>
                <div className='flex w-full justify-end'>

                    <Pagination simple className=' mt-5 mr-3' onChange={onChange} defaultCurrent={userInfo.filterPageNumber} defaultPageSize={50} total={500} />
                </div>
            </div>

        </div>
    )
}

export default BottomIcon
