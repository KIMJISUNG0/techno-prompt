// small nanoid replacement to avoid extra dependency
export function nanoid(size=8){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = ''; for(let i=0;i<size;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}
