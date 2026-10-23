export type ManagementField = { name: string; label: string; type?: "text" | "number" | "email" | "checkbox" | "select"; required?: boolean; min?: number; max?: number; options?: string[]; lookup?: "room_types" | "food_menu"; };
export const MANAGEMENT = {
  rooms: { title: "Rooms", fields: [
    {name:"room_number",label:"Room number",required:true}, {name:"room_type_id",label:"Room type",type:"select",lookup:"room_types",required:true},
    {name:"floor",label:"Floor",type:"number",min:0,max:200}, {name:"price_override",label:"Nightly price override (USD)",type:"number",min:0,max:100000},
    {name:"status",label:"Housekeeping status",type:"select",options:["available","cleaning","maintenance"],required:true}, {name:"is_active",label:"Active",type:"checkbox"},
  ] },
  room_types: {title:"Room types & prices",fields:[{name:"name",label:"Name",required:true},{name:"description",label:"Description"},{name:"capacity",label:"Maximum guests",type:"number",min:1,max:20,required:true},{name:"base_price",label:"Nightly price (USD)",type:"number",min:0,max:100000,required:true},{name:"is_active",label:"Active",type:"checkbox"}]},
  food_menu: {title:"Food menu",fields:[{name:"name",label:"Name",required:true},{name:"category",label:"Category",required:true},{name:"description",label:"Description"},{name:"price",label:"Price (USD)",type:"number",min:0,max:100000,required:true},{name:"is_available",label:"Available",type:"checkbox"}]},
  food_orders: {title:"Food orders",fields:[{name:"menu_id",label:"Food item",type:"select",lookup:"food_menu",required:true},{name:"quantity",label:"Quantity",type:"number",min:1,max:50,required:true},{name:"booking_id",label:"Booking ID (optional)"},{name:"notes",label:"Notes"}]},
  guests: {title:"Customers",fields:[{name:"booking_name",label:"Booking name"},{name:"booking_phone",label:"Booking phone"},{name:"nationality",label:"Nationality"},{name:"address",label:"Address"}]},
  hotel_settings: {title:"Hotel settings",fields:[{name:"name",label:"Hotel name",required:true},{name:"phone",label:"Phone"},{name:"email",label:"Contact email",type:"email"},{name:"address",label:"Address"},{name:"payment_instructions",label:"Payment instructions"},{name:"evc_number",label:"EVC Plus receiving number"},{name:"evc_name",label:"EVC Plus account name"},{name:"edahab_number",label:"eDahab receiving number"},{name:"edahab_name",label:"eDahab account name"}]},
} satisfies Record<string,{title:string;fields:ManagementField[]}>;
export type Resource = keyof typeof MANAGEMENT;
