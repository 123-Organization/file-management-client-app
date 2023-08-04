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
  return base[0].replace(/[^a-zA-Z ]/g, "") + now + random + basefileExt;
}

export function formatFileSize(bytes:number,decimalPoint?:number) {
  if(bytes == 0) return '0 Bytes';
  const k = 1000,
      dm = decimalPoint || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}