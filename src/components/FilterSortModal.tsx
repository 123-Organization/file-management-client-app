import React, { useState, Dispatch, SetStateAction, ChangeEvent  } from 'react'
import { Button, Input, Modal, Radio, RadioChangeEvent, Select, Space } from 'antd';
import { JsxEmit } from 'typescript';

interface FilterSortModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> ;
}

const FilterSortModal = ({openModel, setOpen} : FilterSortModalProps) => {

  
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filter, setFilter] = useState('');

  const handleOk = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 3000);
    };
  
  const handleCancel = () => {
    setOpen(false);
  };
  
  const [value, setValue] = useState(1);

  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

    
  return (
    <>
    <Modal
      title={<h1 className=' text-gray-500'>Filters & Sorting</h1>}
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={'40%'}
      footer={[
        <Button key="submit" className='py-2' size={'large'} type="primary" loading={loading} onClick={handleOk}>
          Show Results
        </Button>,

      ]}
    >

      <div className='filterSorting'>
        <section className="text-gray-600 body-font">
            <div className="relative mb-4 mt-12 ml-4">
                <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Filter by</label>
                <input type="text" placeholder='filename, title or description' id="name" value={filter} onChange={ (e: ChangeEvent) => setFilter((e.target as HTMLInputElement).value) } name="name" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
            </div>
          <div className="container mx-auto flex px-5 py-0 md:flex-row flex-col items-center1">
            <div className="lg:w-1/2 md:w-1/2 bg-white flex flex-col md:ml-auto w-full md:py-833  mt-8 md:mt-0">

              <div className="border rounded-md p-4 relative mb-4 mt-0">
                <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Date Range files added</label>
                <input type="date" placeholder='From Date' id="name" value={fromDate} name="name" onChange={ (e: ChangeEvent) => setFromDate((e.target as HTMLInputElement).value) } className="w-full mb-3 text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                <input type="date" placeholder='To Date' id="name" value={toDate} name="name" onChange={ (e: ChangeEvent) => setToDate((e.target as HTMLInputElement).value) } className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
              </div>
              <div className="relative mb-4 flex flex-col">
                <label htmlFor="message" className=" leading-7 text-base text-gray-400 font-semibold title-font">Image per page</label>
                <Select
                  defaultValue="8"
                  className='text-gray-400 w-full mt-5'
                  onChange={handleChange}
                  options={[
                    { value: '8', label: '8' },
                    { value: '6', label: '6' },
                    { value: '4', label: '4' },
                    { value: '2', label: '2', disabled: true },
                  ]}
                />
              </div>
            </div>
            <div className="lg:w-1/2  md:w-1/2 w-1/2 mb-10 md:mb-0  flex flex-col items-center py-2 justify-evenly border rounded-md ml-3 ">
            <label htmlFor="name" className="leading-7  text-base text-gray-400 font-semibold title-font">Sort results by</label>
            <Radio.Group  onChange={onChange} value={value}>
                  <Space  direction="vertical" className='gap-12'>
                    <Radio className='text-gray-400' value={1}>Newest First</Radio>
                    <Radio className='text-gray-400' value={2}>Oldest First</Radio>
                    <Radio className='text-gray-400' value={3}>File Size</Radio>
                    <Radio className='text-gray-400' value={4}>Title</Radio>
                    <Radio className='text-gray-400' value={5}>File Name</Radio>
                  </Space>
                </Radio.Group>
            </div>
          </div>
        </section>
      </div>
    </Modal>
    </>
  )
}

export default FilterSortModal
