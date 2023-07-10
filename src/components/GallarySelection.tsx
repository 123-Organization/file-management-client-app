import React, { useState } from 'react'
import { Gallery } from "react-grid-gallery";
import { useQuery } from "react-query";

import { useDynamicData } from "../context/DynamicDataProvider";



const IMAGES = [
  {
     src: "https://c2.staticflickr.com/9/8817/28973449265_07e3aa5d2e_b.jpg",
     width: 320,
     height: 174,
     isSelected: true,
     caption: "After Rain (Jeshu John - designerspics.com)",
  },
  {
     src: "https://c2.staticflickr.com/9/8356/28897120681_3b2c0f43e0_b.jpg",
     width: 320,
     height: 212,
     isSelected: false,
     tags: [
        { value: "Ocean", title: "Ocean" },
        { value: "People", title: "People" },
     ],
     alt: "Boats (Jeshu John - designerspics.com)",
  },

  {
     src: "https://c4.staticflickr.com/9/8887/28897124891_98c4fdd82b_b.jpg",
     width: 320,
     height: 212,
     isSelected: false,
  },
];


const GallarySelection: React.FC = (): JSX.Element => {
    const [open, setOpen] = useState(false);
    const [imageURL, setImageURL] = useState('');

    

    const [images, setImages] = useState(IMAGES);
   


    const dynamicData: any = useDynamicData();
    const { referrer, setReferrerData } = dynamicData.state;
   

    const handleSelect = (index: number) => {
        const nextImages = images.map((image, i) =>
          i === index ? { ...image, isSelected: !image.isSelected } : image
        );
        console.log(nextImages);
        setImages(nextImages);

        const hasSelected = images.some((image) => image.isSelected);
        const referrerObj = {hasSelected}
        

        console.log('referrer',referrer)
        console.log('referrerObj',referrerObj)

        let isUpdated = JSON.stringify(referrer) !== JSON.stringify(referrer);
        console.log('isUpdated',isUpdated)
  
        isUpdated && dynamicData.mutations.setReferrerData(referrerObj);
      };
    
      // const handleSelectAllClick = () => {
      //   const nextImages = images.map((image) => ({
      //     ...image,
      //     isSelected: !hasSelected,
      //   }));
      //   setImages(nextImages);
        
      // };


    return (
      <Gallery images={images} onSelect={handleSelect}  />
    )
}

export default GallarySelection
