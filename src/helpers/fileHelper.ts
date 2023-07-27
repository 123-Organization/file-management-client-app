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