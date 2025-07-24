import React, { useState, Dispatch, SetStateAction, FC  } from 'react'
import { Button, Form, Input, message, Modal, Spin, Alert } from 'antd';
import { formatFileSize } from '../helpers/fileHelper';
import { putImages } from '../api/gallaryApi';
import { useMutation } from '@tanstack/react-query';
import { useDynamicData } from '../context/DynamicDataProvider';

/**
 * ****************************************************************** Outer Function **********************************************************
 */

interface EditGallaryModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> ;
  imgData: any;
  onDeleteHandler: Function
  isSuccess: boolean;
  isImageLoading: boolean;
}

const { TextArea } = Input;
/**
 * ****************************************************************** Function Components *******************************************************
 */

const EditGallaryModal: FC<EditGallaryModalProps> = ({openModel, setOpen, imgData, onDeleteHandler, isSuccess, isImageLoading} ) : JSX.Element => {
  
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const dynamicData: any = useDynamicData();
  const { userInfo } = dynamicData.state;

  const {
    mutate: putImagesFn,
   } = useMutation((data: any) => putImages(data), {
    onSuccess(data) {
      messageApi.open({
        type: 'success',
        content: 'File details has been updated',
      });
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
        let filterUpdate=(userInfo.filterUpdate?"":" ");
        let userInfoObj={...userInfo,filterUpdate};
        dynamicData.mutations.setUserInfoData(userInfoObj);
      }, 3000);
    },
    onError(error: any) {},
  });
  
  const [form] = Form.useForm();
  const options = {
    hour12: true
  };
  const date = new Date(imgData.date_added)
  const datetime = date.toLocaleString('en-US',options) 
  form.setFieldsValue({
    title: imgData.title,
    description: imgData.description
  })
  const filesize = formatFileSize(imgData.file_size)
  const handleOk = async() => {
    try {
        const values = await form.validateFields();
        console.log('Success:', values);
        if(values?.title){
          await putImagesFn({...values,...{guid:imgData.guid,"libraryAccountKey":userInfo.libraryAccountKey,"librarySiteId":userInfo.librarySiteId}})
        }
        setLoading(true);
      } catch (errorInfo) {
        console.log('Failed:', errorInfo);
      }
    
    };
  
    const handleCancel = () => {
      setOpen(false);
    };

    

/**
 * ****************************************************************** JSX  ***************************************************************************
 */    
  return (
    <>
    {
     <Modal
      title={<h1 className=' text-gray-500'>Edit File Details</h1>}
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={'78%'}
      footer={
        isSuccess
        ? [
          <button onClick={()=>onDeleteHandler(imgData.guid,false)} data-tooltip-target="tooltip-document" type="button" className="absolute left-2 inline-flex ml-10 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z" />
            </svg>
            {/* <span className="sr-only">New document</span> */}
            <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Delete Selected</span>
          </button>,
          <Button key="submit" className='py-2' size={'large'} type="primary" loading={loading} onClick={handleOk}>
            Update
          </Button>,

          ]

        : [
            <div className='pt-5 pb-2'>
              <Spin tip="Deleting file..." ><></></Spin>
            </div>

          ]
    }
    >

      <div>
        <section className="text-gray-600 body-font">
          {contextHolder}
          {isImageLoading && (
            <Alert
              message="File is being prepared"
              description="The file thumbnail is still being processed. You can edit the file details normally, but the preview may not be fully available yet."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <div className="container mx-auto flex px-5 py-0 md:flex-row flex-col items-center">
            <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-10 mr-6 md:mb-0 border rounded-lg shadow-lg   border-gray-100">
              {!loading && (
                isImageLoading ? (
                  <div className="min-h-[300px] flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                      <span className="text-sm text-gray-500">Preparing File Preview...</span>
                    </div>
                  </div>
                ) : (
                  <img className="object-cover object-center rounded" alt="hero" src={ imgData.public_preview_uri ? imgData.public_preview_uri : 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg'} />
                )
              )}
            </div>
            <div className="lg:w-1/2 md:w-1/2 bg-white flex flex-col md:ml-auto w-full md:py-8 mt-8 md:mt-0">
              <h2 className="text-gray-400 text-base leading-7 mb-1 font-semibold title-font">
                {imgData.file_name} <br />
                Added {datetime} CT.<br />
                {imgData.pix_w} * {imgData.pix_h} px<br />
                {filesize} <br />
              </h2>
              <Form
                form={form} 
                name="dynamic_rule"
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                style={{ maxWidth: 600 }}
              >

                <div className="relative mb-4 mt-12">
                  <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Title</label>
                  {/* <input type="text" id="name" value={'Lorem ipsum'} name="name" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" /> */}
                  <Form.Item 
                       name="title"
                       
                       
                       rules={[
                            { required: true, message: 'Title is required!' },
                      ]}
                       noStyle={true}
                  >
                    <Input  maxLength={50}  />
                  </Form.Item>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="message" className="leading-7 text-base text-gray-400 font-semibold title-font">Description</label>
                  {/* <textarea id="description" maxLength={1000} value={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum eos nisi numquam ipsum fugit necessitatibus amet quisquam, quos dicta obcaecati architecto consequuntur iusto odit atque eligendi esse! Numquam, perferendis omnis?'} name="description" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 h-64 text-base outline-none  py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"></textarea> */}
                  <Form.Item 
                      name="description"
                      
                      className="w-full"
                      noStyle={true}
                      >
                    <TextArea 
                      className="w-full"
                      rows={6} cols={10} maxLength={1000} 
                     />
                  </Form.Item>
                </div>
              </Form>
            </div>
          </div>
        </section>
      </div>
    </Modal>

    }
    </>
  )
}

export default EditGallaryModal
