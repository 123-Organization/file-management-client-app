import React, { useState } from 'react'
import EditGallaryModal from './EditGallaryModal';
import { Gallery } from "react-grid-gallery";
import GallarySelection from './GallarySelection';
import { useDynamicData } from "../context/DynamicDataProvider";


const IMAGES = [
    {
       src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg",
       isSelected: false,
    },
    {
       src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
       isSelected: false,
    },
    {
       src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg",
       isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg",
        isSelected: false,
    },
    {
        src: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg",
        isSelected: false,
    },
  ];

const Gallary: React.FC = (): JSX.Element => {
    const [open, setOpen] = useState(false);
    const [imageURL, setImageURL] = useState('');
    const [images, setImages] = useState(IMAGES);
    const hasSelected = images.some((image) => image.isSelected);

    const dynamicData: any = useDynamicData();
    const { referrer, setReferrerData } = dynamicData.state;

    const handleSelect = (index: number) => {
        const nextImages = images.map((image, i) =>
          i === index ? { ...image, isSelected: !image.isSelected } : image
        );
        setImages(nextImages);

        const referrerObj = {hasSelected}
        console.log('referrer',referrer)
        console.log('referrerObj',referrerObj)

        let isUpdated = referrerObj.hasSelected !== referrer.hasSelected;
        console.log('isUpdated',isUpdated)
  
        isUpdated && dynamicData.mutations.setReferrerData(referrerObj);

      };
    
       
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8">
            {images.map(
                  (image, i) => (            
                        <div key={i} className={`${image.isSelected?'isSelectedImg':''}`} >
                            <img className={`h-auto cursor-pointer w-full rounded-lg `} onClick={()=> handleSelect(i)} src={image.src} alt="" />
                            <div className='flex relative w-full'>
                                <div className='text-sm pt-10'>Lorem ipsum </div>
                                <div>
                                <svg onClick={() => {
                                    setOpen(true)
                                    setImageURL(image.src)
                                    
                                }}  className="absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                                </div>
                            </div>
                        </div>
                    )
            )}
                       <EditGallaryModal openModel={open} setOpen={setOpen} imgURL={imageURL} />
        </div>
    )
}

export default Gallary
