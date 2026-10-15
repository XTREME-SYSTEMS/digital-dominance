/**
 * Read-only public TLS handshake audit, four existing Supabase project APIs.
 * No bearer token, credentials, SQL, user records, DNS edits or X1 job writes.
 * TLS 1.3 transport capability of this GitHub runner is not proof that older
 * customer/client runtimes in production support modern ciphers.
 */
import tls from "node:tls";
import { mkdirSync, writeFileSync } from "node:fs";
const refs=[
 {ref:"jadlpbokfdkonvnfxjzs",scope:"Strategic Intelligence"},
 {ref:"vgsmyhqqtkkluhypxyua",scope:"X1 AI Hub Production"},
 {ref:"uvdkzsbjackpjvpoxtyk",scope:"X1 AI Hub Staging"},
 {ref:"fwtchbsebygwifmmqhur",scope:"Universal Property Intelligence"}
];
const source_sha=process.env.DD_SOURCE_SHA||process.env.GITHUB_SHA||"UNVERIFIED";
function probe(item) {
  return new Promise(resolve=>{
    const host=item.ref+".supabase.co";
    let settled=false;
    const finish=(data)=>{
      if(settled)return;
      settled=true;
      resolve({project_ref:item.ref,scope:item.scope,...data});
    };
    const socket=tls.connect({host,port:443,servername:host,
      minVersion:"TLSv1.3",maxVersion:"TLSv1.3",
      rejectUnauthorized:true,timeout:8500},()=>{
      finish({transport:"TLSv1.3",cipher:socket.getCipher()?.standardName,
        certificate_valid:socket.authorized,probe_status:"PASS_PUBLIC_API_HANDSHAKE"});
      socket.end();
    });
    socket.on("error",err=>finish({transport:"UNKNOWN",probe_status:"UNKNOWN",error_code:err.code||"NETWORK_FAILURE"}));
    socket.on("timeout",()=>{finish({transport:"UNKNOWN",probe_status:"UNKNOWN_TIMEOUT"});socket.destroy()});
  });
}
const results=await Promise.all(refs.map(probe));
const complete=results.every(x=>x.probe_status==="PASS_PUBLIC_API_HANDSHAKE");
const output={
  schema:"smai.tls-readonly-audit.v1",
  source_sha,official_notice:"https://supabase.com/changelog/cbc-tls-ciphers-deprecated",
  official_publication:"2026-10-12",earliest_removal:"2026-11-10",
  result:complete?"PUBLIC_SUPABASE_APIS_SUPPORT_TLS_1_3":"PARTIAL_OR_UNKNOWN",
  runner_tls_client:process.versions.openssl,
  existing_project_refs_tested:results.length,
  api_results:results,
  x1_production_worker_client_tls_version:"NOT_TESTED",
  older_customer_devices:"NOT_TESTED",
  direct_postgres_pooler:"NOT_AFFECTED_BY_HTTP_CIPHER_NOTICE",
  no_secrets_used:true,no_database_queries:true,no_X1_heartbeat_or_jobs:true,
  changes_made:false,production_cutover_approved:false
};
mkdirSync("qa-receipts",{recursive:true});
writeFileSync("qa-receipts/tls-handshake-audit.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({status:output.result,passed:results.filter(x=>x.probe_status==="PASS_PUBLIC_API_HANDSHAKE").length,total:results.length,client_runtime_coverage:"UNKNOWN",credential_use:0,production_changes:false}));
