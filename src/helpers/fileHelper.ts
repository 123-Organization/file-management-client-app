export function makeUniqueFileName(base:string) {
  const ext = base.split('.');
  const basefileExt = "."+ext[ext.length-1];
  const now:string = ""+new Date().getTime();
  let random:string = ""+Math.floor(Math.random() * 100000);
  // zero pad random
  random = "" + random;
  while (random.length < 5) {
      random = "0" + random;
  }
  let fileName:string="";
  while (fileName.length < ext.length) {
    fileName = "" + ext[fileName.length];
  }

  
  return base[0].replace(/[^a-zA-Z ]/g, "") + now + random +'__'+fileName+ basefileExt;
}

export function formatFileSize(bytes:number,decimalPoint?:number) {
  if(bytes == 0) return '0 Bytes';
  const k = 1000,
      dm = decimalPoint || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function removeDuplicates(arr:string[]) {
  let unique:string[] = [];
  arr.forEach(element => {
      if (!unique.includes(element)) {
          unique.push(element);
      }
  });
  return unique;
}

export function osName() {
  let OSName = "unknown";
  const navApp = navigator.userAgent.toLowerCase();
  switch (true) {
    case (navApp.indexOf("win") != -1):
      OSName = "windows";
      break;
    case (navApp.indexOf("mac") != -1):
      OSName = "apple";
      break;
    case (navApp.indexOf("linux") != -1):
      OSName = "linux";
      break;
    case (navApp.indexOf("x11") != -1):
      OSName = "unix";
      break;
  }
  console.log(OSName, navApp);
  return OSName;
}

export function sumTo(n:number):number {
  if (n == 1) return 1;
  return n + sumTo(n - 1);
}