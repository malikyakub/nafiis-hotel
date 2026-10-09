// Authorized acceptance check. Creates only labelled guest fixtures, then removes them.
// Never uses or changes an existing customer's account, session or booking.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,key,options);
const fixtures=[];
let bookingId,raceBookingId,paymentId,objectPath,stage='create fixtures';
const statePath='.chain-local/customer-isolation-fixtures.json';
function save(){fs.mkdirSync('.chain-local',{recursive:true});fs.writeFileSync(statePath,JSON.stringify({fixtures:fixtures.map(f=>({id:f.id,guestId:f.guestId})),bookingId,raceBookingId,paymentId,objectPath},null,2));}
function checked(result){if(result.error)throw new Error('Operation failed');return result.data;}
function assert(value){if(!value)throw new Error('Assertion failed');}
try{
 if(fs.existsSync(statePath))throw new Error('Earlier fixtures require cleanup before rerun');
 for(const label of ['a','b']){
  const email=`nafiis-test-${label}-${crypto.randomUUID()}@example.invalid`;
  const password=crypto.randomBytes(30).toString('base64url');
  const user=checked(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'DEMO ISOLATION TEST '+label}})).user;
  const fixture={id:user.id};fixtures.push(fixture);save();
  const guest=checked(await admin.from('guests').select('id').eq('profile_id',user.id).single());fixture.guestId=guest.id;save();
  const client=createClient(url,publicKey,options);checked(await client.auth.signInWithPassword({email,password}));fixture.client=client;
 }
 const [a,b]=fixtures;
 stage='customer booking';
 const date=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
 const rooms=checked(await a.client.rpc('available_rooms',{p_check_in:date(50),p_check_out:date(51)}));assert(rooms.length);
 const booking=checked(await a.client.from('bookings').insert({guest_id:a.guestId,room_id:rooms[0].room_id,check_in:date(50),check_out:date(51),guests_count:1}).select('id').single());bookingId=booking.id;save();
 stage='booking isolation';
 assert(checked(await a.client.from('bookings').select('id').eq('id',bookingId)).length===1);
 assert(checked(await b.client.from('bookings').select('id').eq('id',bookingId)).length===0);
 const mutation=await b.client.from('bookings').update({status:'cancelled'}).eq('id',bookingId).select('id');assert(mutation.error||mutation.data.length===0);
 process.stdout.write('PASS: customer sees own booking; another customer cannot read or cancel it.\n');
 stage='concurrent room requests';
 const raceRooms=checked(await a.client.rpc('available_rooms',{p_check_in:date(52),p_check_out:date(53)}));assert(raceRooms.length);
 const attempt=()=>a.client.from('bookings').insert({guest_id:a.guestId,room_id:raceRooms[0].room_id,check_in:date(52),check_out:date(53),guests_count:1}).select('id').single();
 const results=await Promise.all([attempt(),attempt()]);
 raceBookingId=results.find(r=>!r.error)?.data?.id;save();
 assert(results.filter(r=>!r.error).length===1&&results.filter(r=>r.error?.code==='23P01').length===1);
 process.stdout.write('PASS: simultaneous requests for the same room/stay yield one booking and one overlap rejection.\n');
 stage='receipt fixture';
 objectPath=`${a.id}/${bookingId}/demo.txt.png`;save();
 const receipt=fs.readFileSync('../../.deployment/demo-receipt.png');
 checked(await admin.storage.from('payment-proofs').upload(objectPath,receipt,{contentType:'image/png',upsert:false}));
 paymentId=checked(await admin.rpc('submit_booking_payment',{p_booking:bookingId,p_customer:a.id,p_object:objectPath,p_reference:'DEMO ISOLATION ONLY - NO PAYMENT'}));save();
 stage='receipt isolation';
 assert(checked(await a.client.from('payment_submissions').select('id').eq('id',paymentId)).length===1);
 assert(checked(await b.client.from('payment_submissions').select('id').eq('id',paymentId)).length===0);
 const download=await b.client.storage.from('payment-proofs').download(objectPath);assert(download.error);
 const directReview=await b.client.rpc('review_booking_payment',{p_payment:paymentId,p_admin:b.id,p_decision:'approved',p_note:'should be denied'});assert(directReview.error);
 process.stdout.write('PASS: another customer cannot read/download the receipt or invoke payment approval.\n');
 stage='disabled customer isolation';
 checked(await admin.from('profiles').update({is_active:false}).eq('id',a.id));
 assert(checked(await a.client.from('bookings').select('id').eq('id',bookingId)).length===0);
 assert(checked(await a.client.from('payment_submissions').select('id').eq('id',paymentId)).length===0);
 assert(checked(await a.client.rpc('current_guest_id'))===null);
 process.stdout.write('PASS: disabled customer with an existing session loses booking and receipt access.\n');
}catch{process.stderr.write(`Customer isolation check stopped at: ${stage}. No credentials logged.\n`);process.exitCode=1;}
finally{
 let clean=true;
 async function remove(table,column,id){if(!id)return;const result=await admin.from(table).delete().eq(column,id);if(result.error)clean=false;}
 for(const f of fixtures)if(f.client)await f.client.auth.signOut();
 if(objectPath){const result=await admin.storage.from('payment-proofs').remove([objectPath]);if(result.error)clean=false;}
 await remove('payment_audit','payment_id',paymentId);await remove('payment_submissions','id',paymentId);await remove('bookings','id',bookingId);
 for(const f of fixtures){await remove('bookings','guest_id',f.guestId);await remove('wallets','guest_id',f.guestId);await remove('guests','id',f.guestId);await remove('profiles','id',f.id);const result=await admin.auth.admin.deleteUser(f.id);if(result.error)clean=false;}
 if(clean&&fixtures.length){fs.unlinkSync(statePath);process.stdout.write('Temporary test accounts, receipt and booking removed.\n');}
 else if(fixtures.length){process.stderr.write('Cleanup incomplete. Fixture IDs retained locally for targeted cleanup.\n');process.exitCode=1;}
}
