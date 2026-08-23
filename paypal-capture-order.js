async function token(){
 const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
 const r=await fetch("https://api-m.paypal.com/v1/oauth2/token",{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
 if(!r.ok) throw new Error("PayPal authentication failed.");
 return (await r.json()).access_token;
}
exports.handler=async(event)=>{
 try{
  const {orderID}=JSON.parse(event.body||"{}"); if(!orderID) throw new Error("Missing PayPal order ID.");
  const access=await token();
  const r=await fetch(`https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json"}});
  const data=await r.json(); if(!r.ok) throw new Error(data.message||"Could not capture PayPal payment.");
  return {statusCode:200,body:JSON.stringify({id:data.id,status:data.status})};
 }catch(e){return {statusCode:400,body:JSON.stringify({error:e.message})};}
};