import React, { useEffect } from 'react'
import Gallary from '../components/Gallary'
import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { FileFilled, FileTextOutlined, FileOutlined, FileTextFilled  } from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';

/**
 * ****************************************************************** Function Components *******************************************************
 */

const Thumbnail: React.FC = (): JSX.Element => {

  const dynamicData: any = useDynamicData();
  const { referrer, fileLocation, userInfo } = dynamicData.state;

  /**
 * ****************************************************************** Outer Function **********************************************************
 */

const  childrenTree = []

userInfo.libraryOptions.includes("temporary") && childrenTree.push({
  title: 'Temporary',
  key: 'temporary',
  //@ts-ignore
  icon:({ selected }) => (selected ? <FileFilled className='text-blue-400' /> : <FileOutlined className='text-base' />),
});

userInfo.libraryOptions.includes("inventory") && childrenTree.push({
  title: 'Inventory',
  key: 'inventory',
  //@ts-ignore
  icon:({ selected }) => (selected ? <FileTextFilled className='text-blue-400' /> : <FileTextOutlined className='text-base pb-2'  />),
});  

const treeData: DataNode[] = [
  {
    title: 'My File Libraries',
    key: '0-0-0',
    icon:<svg className="w-5 h-5 mb-2 text-gray-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5h6M9 8h6m-6 3h6M4.996 5h.01m-.01 3h.01m-.01 3h.01M2 1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z"/>
        </svg>,
    children: childrenTree
  }];
  
  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
    let libraryName  = ((selectedKeys[0]!=='inventory')?'temporary':'inventory')
    const fileLocationObj= {selected:libraryName}
    let isUpdated = JSON.stringify(fileLocation) !== JSON.stringify(fileLocationObj);
    console.log('isUpdated',isUpdated)

    isUpdated && dynamicData.mutations.setFileLocationData(fileLocationObj);

    let userInfoObj = {...userInfo,libraryName};
    
    let isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
    console.log('isUpdated',isUpdated,userInfo,userInfoObj)

    if(isUpdatedUser) {
      userInfoObj.filterPageNumber="1";
      dynamicData.mutations.setUserInfoData(userInfoObj);
    } 

  };


  //useEffect(()=>{

  // },[])
/**
 * ****************************************************************** JSX  ***************************************************************************
 */
  return (
    <div className='realtive'>
      <div className='flex '>
        <div className={`${userInfo.libraryOptions.length ? 'w-10/12':'w-full'} max-lg:w-9/12  max-md:w-full`}>
          <Gallary />
        </div>
        {
          !!userInfo.libraryOptions.length &&   
          <div className='md:w-2/12 max-md:hidden max-md:w-0/12 '>
            <Tree
              showIcon
              className=' fixed font-semibold pt-8 text-gray-400  '
              showLine
              selectedKeys={[fileLocation.selected]}
              switcherIcon={<DownOutlined />}
              defaultExpandedKeys={['0-0-0']}
              treeData={treeData}
              onSelect={onSelect}
              
            />
          </div>
        }
      </div>
      
    </div>
  )
}

export default Thumbnail
