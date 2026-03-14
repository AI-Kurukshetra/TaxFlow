import { readFile } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"
const env=Object.fromEntries((await readFile(new URL("../.env.local",import.meta.url),"utf8")).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith("#")&&l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)]}))
const url=env.NEXT_PUBLIC_SUPABASE_URL,key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if(!url||!key) throw new Error("Missing Supabase env")
const org={name:"Vertex Demo Holdings",slug:"vertex-demo-holdings",tax_registration_number:"US-TAX-2026-DEMO",base_currency:"USD",timezone:"America/New_York"}
const users=[
{key:"admin",email:"taxflow.seed.admin.20260314@gmail.com",password:"TaxFlowAdmin123!",full_name:"Alex Mercer",role:"admin",is_default:true},
{key:"tax_manager",email:"taxflow.seed.manager.20260314@gmail.com",password:"TaxFlowManager123!",full_name:"Jordan Lee",role:"tax_manager",is_default:false},
{key:"accountant",email:"taxflow.seed.accountant.20260314@gmail.com",password:"TaxFlowAccountant123!",full_name:"Morgan Patel",role:"accountant",is_default:false},
{key:"viewer",email:"taxflow.seed.viewer.20260314@gmail.com",password:"TaxFlowViewer123!",full_name:"Taylor Chen",role:"viewer",is_default:false},
]
const c=()=>createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}})
const ms=async(q,m)=>{const r=await q.maybeSingle();if(r.error) throw new Error(`${m}: ${r.error.message}`);return r.data}
async function auth(u){
 const s=c();
 let r=await s.auth.signInWithPassword({email:u.email,password:u.password})
 if(!r.error&&r.data.user) return {s,user:r.data.user}
 r=await s.auth.signUp({email:u.email,password:u.password,options:{data:{full_name:u.full_name}}})
 if(r.error) throw new Error(`signup ${u.email}: ${r.error.message}`)
 if(!r.data.session||!r.data.user) r=await s.auth.signInWithPassword({email:u.email,password:u.password})
 if(r.error||!r.data.user) throw new Error(`auth ${u.email}: ${r.error?.message||"email confirmation required"}`)
 return {s,user:r.data.user}
}
const out={organization:null,seededAccounts:{},counts:{}}
const a=await auth(users[0]),sa=a.s,adminId=a.user.id
let r=await sa.from("users").upsert({id:adminId,email:users[0].email,full_name:users[0].full_name,is_platform_admin:true,last_active_at:new Date().toISOString()},{onConflict:"id"})
if(r.error) throw new Error(`admin profile: ${r.error.message}`)
let o=await ms(sa.from("organizations").select("id,name,slug").eq("slug",org.slug),"org query")
if(!o){r=await sa.from("organizations").insert(org).select("id,name,slug").single();if(r.error) throw new Error(`org insert: ${r.error.message}`);o=r.data}
r=await sa.from("organization_memberships").upsert({organization_id:o.id,user_id:adminId,role:"admin",is_default:true},{onConflict:"organization_id,user_id"})
if(r.error) throw new Error(`admin membership: ${r.error.message}`)
r=await sa.from("users").update({is_platform_admin:false,last_active_at:new Date().toISOString()}).eq("id",adminId)
if(r.error) throw new Error(`admin downgrade: ${r.error.message}`)
out.organization=o
out.seededAccounts.admin={...users[0],userId:adminId}
for(const u of users.slice(1)){
 const x=await auth(u)
 r=await x.s.from("users").upsert({id:x.user.id,email:u.email,full_name:u.full_name,is_platform_admin:false,last_active_at:new Date().toISOString()},{onConflict:"id"})
 if(r.error) throw new Error(`profile ${u.email}: ${r.error.message}`)
 r=await sa.from("organization_memberships").upsert({organization_id:o.id,user_id:x.user.id,role:u.role,is_default:u.is_default},{onConflict:"organization_id,user_id"})
 if(r.error) throw new Error(`membership ${u.email}: ${r.error.message}`)
 out.seededAccounts[u.key]={...u,userId:x.user.id}
}
const jSeeds=[
{name:"California - San Francisco",country_code:"US",region_code:"CA",city:"San Francisco",jurisdiction_type:"state_local",filing_frequency:"monthly"},
{name:"Texas - Austin",country_code:"US",region_code:"TX",city:"Austin",jurisdiction_type:"state_local",filing_frequency:"monthly"},
{name:"United Kingdom - London",country_code:"GB",region_code:null,city:"London",jurisdiction_type:"country",filing_frequency:"quarterly"},
]
const jMap={}
for(const j of jSeeds){let x=await ms(sa.from("tax_jurisdictions").select("id,name").eq("organization_id",o.id).eq("name",j.name),`jurisdiction ${j.name}`);if(!x){r=await sa.from("tax_jurisdictions").insert({organization_id:o.id,...j,active:true}).select("id,name").single();if(r.error) throw new Error(`jurisdiction insert ${j.name}: ${r.error.message}`);x=r.data}jMap[j.name]=x.id}
const pSeeds=[
{sku:"SKU-ERP-001",name:"Global Tax Engine Subscription",product_category:"software",default_tax_code:"DIGITAL_SAAS",taxability_profile:{taxable:true,delivery:"digital"}},
{sku:"SKU-SVC-014",name:"Implementation Advisory",product_category:"services",default_tax_code:"PRO_SERVICES",taxability_profile:{taxable:true,delivery:"consulting"}},
{sku:"SKU-API-480",name:"Compliance API Add-on",product_category:"software",default_tax_code:"DIGITAL_API",taxability_profile:{taxable:true,delivery:"digital",metered:true}},
{sku:"SKU-TRN-330",name:"Tax Academy Training",product_category:"education",default_tax_code:"TRAINING",taxability_profile:{taxable:false,delivery:"virtual"}},
]
for(const p of pSeeds){r=await sa.from("products").upsert({organization_id:o.id,...p,active:true,created_by:adminId},{onConflict:"organization_id,sku"});if(r.error) throw new Error(`product ${p.sku}: ${r.error.message}`)}
const ps=await sa.from("products").select("id,sku").eq("organization_id",o.id).in("sku",pSeeds.map(v=>v.sku)); if(ps.error) throw new Error(ps.error.message)
const pMap=Object.fromEntries((ps.data||[]).map(v=>[v.sku,v.id]))
const cSeeds=[
{external_customer_id:"CUST-1001",name:"Northwind Retail",email:"northwind.ap.20260314@gmail.com",customer_type:"b2b",country_code:"US",region_code:"CA",city:"San Francisco",postal_code:"94105",address_line1:"101 Market Street",exemption_status:false},
{external_customer_id:"CUST-1002",name:"Bluebird Health Group",email:"bluebird.finance.20260314@gmail.com",customer_type:"b2b",country_code:"US",region_code:"TX",city:"Austin",postal_code:"78701",address_line1:"220 Congress Ave",exemption_status:false},
{external_customer_id:"CUST-1003",name:"Metro Public University",email:"metro.procurement.20260314@gmail.com",customer_type:"education",country_code:"US",region_code:"CA",city:"San Francisco",postal_code:"94107",address_line1:"15 Mission Bay Blvd",exemption_status:true},
{external_customer_id:"CUST-1004",name:"Britannia Commerce Ltd",email:"britannia.accounts.20260314@gmail.com",customer_type:"b2b",country_code:"GB",region_code:null,city:"London",postal_code:"EC2A 4NE",address_line1:"84 Shoreditch High Street",exemption_status:false},
]
for(const x of cSeeds){r=await sa.from("customers").upsert({organization_id:o.id,...x,created_by:adminId},{onConflict:"organization_id,external_customer_id"});if(r.error) throw new Error(`customer ${x.external_customer_id}: ${r.error.message}`)}
const cs=await sa.from("customers").select("id,external_customer_id").eq("organization_id",o.id).in("external_customer_id",cSeeds.map(v=>v.external_customer_id)); if(cs.error) throw new Error(cs.error.message)
const cMap=Object.fromEntries((cs.data||[]).map(v=>[v.external_customer_id,v.id]))
const rateSeeds=[
["California - San Francisco","sales_tax",0.0863,"2025-01-01"],
["Texas - Austin","sales_tax",0.0825,"2025-01-01"],
["United Kingdom - London","vat",0.2,"2025-01-01"],
]
for(const [jn,t,rate,from] of rateSeeds){const x=await ms(sa.from("tax_rates").select("id").eq("organization_id",o.id).eq("jurisdiction_id",jMap[jn]).eq("tax_type",t).eq("effective_from",from),`rate ${jn}`);if(!x){r=await sa.from("tax_rates").insert({organization_id:o.id,jurisdiction_id:jMap[jn],tax_type:t,rate,effective_from:from,source:"demo",created_by:adminId});if(r.error) throw new Error(`rate ${jn}: ${r.error.message}`)}}
const ruleSeeds=[
["California - San Francisco","CA digital services taxable","sales_tax",{product_tax_code_in:["DIGITAL_SAAS","DIGITAL_API"]},{apply_rate:"jurisdiction_default",taxable:true},10],
["Texas - Austin","TX professional services taxable","sales_tax",{product_tax_code_in:["PRO_SERVICES"]},{apply_rate:"jurisdiction_default",taxable:true},20],
["California - San Francisco","CA education exemption","sales_tax",{product_tax_code_in:["TRAINING"],customer_type_in:["education"]},{taxable:false,override_rate:0},5],
]
for(const [jn,name,rt,cond,res,priority] of ruleSeeds){const x=await ms(sa.from("tax_rules").select("id").eq("organization_id",o.id).eq("name",name),`rule ${name}`);if(!x){r=await sa.from("tax_rules").insert({organization_id:o.id,jurisdiction_id:jMap[jn],name,rule_type:rt,condition_expression:cond,result_expression:res,priority,active:true,valid_from:"2025-01-01",created_by:adminId});if(r.error) throw new Error(`rule ${name}: ${r.error.message}`)}}
const cert=await ms(sa.from("exemption_certificates").select("id").eq("organization_id",o.id).eq("certificate_number","CERT-EDU-2026-001"),"certificate")
if(!cert){r=await sa.from("exemption_certificates").insert({organization_id:o.id,customer_id:cMap["CUST-1003"],jurisdiction_id:jMap["California - San Francisco"],certificate_number:"CERT-EDU-2026-001",status:"active",issued_on:"2025-07-01",expires_on:"2027-06-30",document_url:"storage/exemptions/cert-edu-2026-001.pdf",metadata:{certificate_type:"education_exemption"},created_by:adminId});if(r.error) throw new Error(`certificate: ${r.error.message}`)}
const certRow=await ms(sa.from("exemption_certificates").select("id").eq("organization_id",o.id).eq("certificate_number","CERT-EDU-2026-001"),"certificate load")
const tSeeds=[
["TXN-2026-0001","ERP-884201","CUST-1001","SKU-ERP-001","California - San Francisco","2026-01-09","calculated",12,24000,24000,2071.2,"DIGITAL_SAAS",null,{channel:"direct",source:"netsuite"}],
["TXN-2026-0002","ERP-884305","CUST-1002","SKU-SVC-014","Texas - Austin","2026-01-15","filed",3,18000,18000,1485,"PRO_SERVICES",null,{channel:"partner",source:"sap"}],
["TXN-2026-0003","ERP-884418","CUST-1003","SKU-TRN-330","California - San Francisco","2026-01-18","calculated",1,9500,0,0,"TRAINING",certRow.id,{channel:"direct",source:"hubspot",exemption_applied:true}],
["TXN-2026-0004","ERP-884561","CUST-1004","SKU-API-480","United Kingdom - London","2026-01-22","pending",40000,16000,16000,3200,"DIGITAL_API",null,{channel:"self_serve",source:"stripe",usage_period:"2026-01"}],
]
for(const [num,ext,cust,sku,jn,date,status,qty,sub,taxable,tax,code,certId,meta] of tSeeds){r=await sa.from("transactions").upsert({organization_id:o.id,transaction_number:num,external_transaction_id:ext,customer_id:cMap[cust],product_id:pMap[sku],jurisdiction_id:jMap[jn],exemption_certificate_id:certId,transaction_date:date,status,currency:"USD",quantity:qty,subtotal_amount:sub,taxable_amount:taxable,tax_amount:tax,classification_code:code,metadata:meta,created_by:adminId},{onConflict:"organization_id,transaction_number"});if(r.error) throw new Error(`txn ${num}: ${r.error.message}`)}
const trSeeds=[
["California - San Francisco","2026-01-01","2026-01-31","under_review","2026-02-20",33500,24000,2071.2],
["Texas - Austin","2026-01-01","2026-01-31","approved","2026-02-20",18000,18000,1485],
]
for(const [jn,s,e,status,due,gross,taxable,dueAmt] of trSeeds){const x=await ms(sa.from("tax_returns").select("id").eq("organization_id",o.id).eq("jurisdiction_id",jMap[jn]).eq("filing_period_start",s).eq("filing_period_end",e),`return ${jn}`);if(!x){r=await sa.from("tax_returns").insert({organization_id:o.id,jurisdiction_id:jMap[jn],filing_period_start:s,filing_period_end:e,status,due_date:due,currency:"USD",gross_sales_amount:gross,taxable_sales_amount:taxable,tax_due_amount:dueAmt,submitted_by:adminId});if(r.error) throw new Error(`return ${jn}: ${r.error.message}`)}}
if(!await ms(sa.from("reports").select("id").eq("organization_id",o.id).eq("name","January 2026 Liability Summary"),"report")){r=await sa.from("reports").insert({organization_id:o.id,report_type:"liability_summary",name:"January 2026 Liability Summary",report_period_start:"2026-01-01",report_period_end:"2026-01-31",generated_by:adminId,storage_path:"reports/jan-2026-liability.csv",filters:{jurisdictions:["CA","TX","GB"]}});if(r.error) throw new Error(`report: ${r.error.message}`)}
if(!await ms(sa.from("notifications").select("id").eq("organization_id",o.id).eq("subject","California filing review due"),"notification")){r=await sa.from("notifications").insert({organization_id:o.id,user_id:adminId,channel:"in_app",status:"queued",subject:"California filing review due",message:"January California sales tax return is awaiting approval.",related_entity_type:"tax_return",related_entity_id:null});if(r.error) throw new Error(`notification: ${r.error.message}`)}
if(!await ms(sa.from("audit_logs").select("id").eq("organization_id",o.id).eq("action","transaction.calculated").eq("entity_type","transaction"),"audit")){r=await sa.from("audit_logs").insert({organization_id:o.id,actor_user_id:adminId,action:"transaction.calculated",entity_type:"transaction",entity_id:null,before_state:null,after_state:{transaction_number:"TXN-2026-0001",tax_amount:2071.2,status:"calculated"},ip_address:"127.0.0.1",user_agent:"codex-seed-script/1.0"});if(r.error) throw new Error(`audit: ${r.error.message}`)}
out.counts={jurisdictions:jSeeds.length,products:pSeeds.length,customers:cSeeds.length,certificates:1,taxRates:rateSeeds.length,taxRules:ruleSeeds.length,transactions:tSeeds.length,taxReturns:trSeeds.length,reports:1,notifications:1,auditLogs:1}
console.log(JSON.stringify(out,null,2))
