import React, { useState, Dispatch, SetStateAction, FC  } from 'react'
import { Button, Modal } from 'antd';

/**
 * ****************************************************************** Outer Function **********************************************************
 */

interface EditGallaryModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> ;
  imgURL: any;
  onDeleteHandler: Function
}

/**
 * ****************************************************************** Function Components *******************************************************
 */

const EditGallaryModal: FC<EditGallaryModalProps> = ({openModel, setOpen, imgURL, onDeleteHandler} ) : JSX.Element => {
  
  const [loading, setLoading] = useState(false);

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

/**
 * ****************************************************************** JSX  ***************************************************************************
 */    
  return (
    <>
    <Modal
      title={<h1 className=' text-gray-500'>Edit File Details</h1>}
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={'78%'}
      footer={[
        <button onClick={()=>onDeleteHandler(imgURL.guid,false)} data-tooltip-target="tooltip-document" type="button" className="absolute left-2 inline-flex ml-10 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
          <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z" />
          </svg>
          {/* <span className="sr-only">New document</span> */}
          <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Delete Selected</span>
        </button>,
        <Button key="submit" className='py-2' size={'large'} type="primary" loading={loading} onClick={handleOk}>
          Update
        </Button>,

      ]}
    >

      <div>
        <section className="text-gray-600 body-font">
          <div className="container mx-auto flex px-5 py-0 md:flex-row flex-col items-center">
            <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-10 md:mb-0">
              <img className="object-cover object-center rounded" alt="hero" src={ imgURL.public_preview_uri ? imgURL.public_preview_uri : 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg'} />
            </div>
            <div className="lg:w-1/2 md:w-1/2 bg-white flex flex-col md:ml-auto w-full md:py-8 mt-8 md:mt-0">
              <h2 className="text-gray-400 text-base leading-7 mb-1 font-semibold title-font">
                FileName.jpg <br />
                Added 6/10/2023 at 12:32 PM CT.<br />
                3600 * 2400px<br />
                12 MB<br />
              </h2>
              <div className="relative mb-4 mt-12">
                <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Title</label>
                <input type="text" id="name" value={'Lorem ipsum'} name="name" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
              </div>
              <div className="relative mb-4">
                <label htmlFor="message" className="leading-7 text-base text-gray-400 font-semibold title-font">Description</label>
                <textarea id="description" maxLength={1000} value={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum eos nisi numquam ipsum fugit necessitatibus amet quisquam, quos dicta obcaecati architecto consequuntur iusto odit atque eligendi esse! Numquam, perferendis omnis?'} name="description" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 h-64 text-base outline-none  py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"></textarea>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
    </>
  )
}

export default EditGallaryModal
