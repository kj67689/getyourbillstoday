const {totalFor,validateOrder}=require("./order");
async function token(){
 const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
 const r=await fetch("https://api-m.paypal.com/v1/oauth2/token",{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
 if(!r.ok) throw new Error("PayPal authentication failed.");
 return (await r.json()).access_token;
}
exports.handler=async(event)=>{
 try{
  const {order}=JSON.parse(event.body||"{}"); validateOrder(order);
  const amount=totalFor(order); const access=await token();
  const r=await fetch("https://api-m.paypal.com/v2/checkout/orders",{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json"},body:JSON.stringify({intent:"CAPTURE",purchase_units:[{amount:{currency_code:"USD",value:amount.toFixed(2)},description:`PropBills entertainment props - ${order.package} bills`} ]})});
  const data=await r.json(); if(!r.ok) throw new Error(data.message||"Could not create PayPal order.");
  return {statusCode:200,body:JSON.stringify({id:data.id})};
 }catch(e){return {statusCode:400,body:JSON.stringify({error:e.message})};}
};