import ReactGA from "react-ga4";

export const sendEvent = (GAID:string, eventName: string,eventParams:object) => {
  if(GAID){
    
    ReactGA.initialize(GAID);
    console.log('initialize GAID',GAID);
    setTimeout(() => {
      ReactGA.event(eventName, eventParams); 
      console.log('sent GAID');
    }, 1000);
  }
  
};