const crypto=require("crypto");
const {totalFor,validateOrder}=require("./order");

exports.handler=async(event)=>{
 try{
  if(event.httpMethod!=="POST") return {statusCode:405,body:JSON.stringify({error:"Method not allowed"})};
  const {token,order}=JSON.parse(event.body||"{}");
  validateOrder(order);
  if(!token) throw new Error("Missing payment token.");
  const amount=totalFor(order);

  const response=await fetch("https://connect.squareup.com/v2/payments",{
   method:"POST",
   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+process.env.SQUARE_ACCESS_TOKEN,
    "Square-Version":"2026-01-22"
   },
   body:JSON.stringify({
    source_id:token,
    idempotency_key:crypto.randomUUID(),
    amount_money:{amount:Math.round(amount*100),currency:"USD"},
    location_id:process.env.SQUARE_LOCATION_ID,
    reference_id:`PROP-${Date.now()}`,
    note:`Package ${order.package}; denomination ${order.denomination}`
   })
  });
  const data=await response.json();
  if(!response.ok) return {statusCode:400,body:JSON.stringify({error:data.errors?.[0]?.detail||"Square payment failed."})};
  return {statusCode:200,body:JSON.stringify({payment:data.payment})};
 }catch(e){return {statusCode:400,body:JSON.stringify({error:e.message})};}
};