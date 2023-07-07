import React from 'react'
import BottomIcon from '../components/BottomIcon'
import Gallary from '../components/Gallary'
import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';

const treeData: DataNode[] = [
  {
    title: 'My File Libraries',
    key: '0-0-0',
    children: [
      {
        title: 'Temporary',
        key: 'Temporary',
      },
      {
        title: 'Inventory',
        key: 'Inventory',
      },

    ],
  }];

const Thumbnail: React.FC = (): JSX.Element => {

  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
  };

  return (
    <div className='realtive'>
      <div className='flex'>
        <Gallary />
        <div >
          <Tree
            className='w-96 font-semibold pt-8'
            showLine
            switcherIcon={<DownOutlined />}
            defaultExpandedKeys={['0-0-0']}
            treeData={treeData}
          />
        </div>
      </div>
      <BottomIcon />
    </div>
  )
}

export default Thumbnail
