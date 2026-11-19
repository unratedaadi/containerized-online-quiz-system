import config from './config.json' with {type:'json'};
const headers={'content-type':'application/json','cache-control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=digest.charCodeAt(i)^config.tokenSha256.charCodeAt(i);
 if(mismatch)return reply({error:'Unauthorized'},401);
 const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');const key=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!key)return reply({error:'Database credentials unavailable'},503);
 const dbHeaders:Record<string,string>={apikey:key,'content-type':'application/json'};
 if(!key.startsWith('sb_secret_'))dbHeaders.Authorization='Bearer '+key;
 const url=Deno.env.get('SUPABASE_URL')+'/rest/v1/';
 try{
  if(req.method==='GET'){
   const result=await fetch(url+'quizroom_leaderboard?select=id,name,completed,average,best&order=average.desc,completed.desc,id.asc&limit=100',{headers:dbHeaders});
   if(!result.ok)return reply({error:'Leaderboard temporarily unavailable'},503);
   return reply({entries:await result.json()});
  }
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const body=await req.json();if(!Array.isArray(body.scores)||body.scores.length>100)return reply({error:'Invalid batch'},400);
  const scores=body.scores.map((s:Record<string,unknown>)=>({installation_id:s.installation_id,attempt_id:s.attempt_id,user_id:s.user_id,display_name:s.display_name,score:s.score,completed_at:s.completed_at}));
  for(const s of scores){if(typeof s.installation_id!=='string'||! /^[0-9a-f-]{36}$/i.test(s.installation_id)||!Number.isSafeInteger(s.attempt_id)||Number(s.attempt_id)<1||!Number.isSafeInteger(s.user_id)||Number(s.user_id)<1||typeof s.display_name!=='string'||s.display_name.length<1||s.display_name.length>80||!Number.isInteger(s.score)||Number(s.score)<0||Number(s.score)>100||typeof s.completed_at!=='string'||!Number.isFinite(Date.parse(s.completed_at)))return reply({error:'Invalid score'},400);}
  const result=await fetch(url+'quizroom_scores?on_conflict=installation_id,attempt_id',{method:'POST',headers:{...dbHeaders,Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(scores)});
  return result.ok?reply({saved:scores.length}):reply({error:'Could not save scores'},503);
 }catch{return reply({error:'Leaderboard temporarily unavailable'},503);}
});
