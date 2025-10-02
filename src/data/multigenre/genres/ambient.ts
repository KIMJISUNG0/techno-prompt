import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const ambientPack: GenrePack = {
  id: 'ambient',
  label: 'Ambient',
  description: 'Textural / drone / space',
  orderWeight: 50,
  inheritsUniversal: true,
  groups: [ g('drones','Drones'), g('textures','Textures') ],
  options: [
    o('amb-drone-low','Low Drone','low evolving drone','drones',{primary:true}),
    o('amb-drone-air','Air Drone','airy high drone','drones'),
    o('amb-texture-grain','Grain Wash','granular wash texture','textures'),
    o('amb-texture-bell','Bell Shimmers','bell shimmer texture','textures'),
  ],
  subopts: {}
};
