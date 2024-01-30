import{P as L}from"./PipyProxyService-55b9369c.js";import{_ as P,E as J,a as q,r as g,I as A,c as p,o as v,d as k,g as _,f as c,k as H,e,w,t as u,l as V,F as M,s as R,p as j,q as E}from"./index-f94225a9.js";const d=x=>(j("data-v-31cef87f"),x=x(),E(),x),D={key:0,style:{"padding-left":"0px","padding-top":"0","padding-right":"0"}},K={class:"pt-5 pl-5 pr-5"},G={class:"surface-section"},Q={class:"font-medium text-3xl text-900 mb-3"},W={class:"text-500 mb-5"},X={class:"list-none p-0 m-0"},Y={class:"flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"},Z=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"Os Name",-1)),$={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},ee={class:"flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"},te=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"Os Version",-1)),se={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},oe={class:"flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"},ae=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"Last Boot Uptime",-1)),le={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},ie={class:"flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"},ne=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"CPU Info",-1)),de={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},re={class:"flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"},ce=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"MAC",-1)),me={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},pe={class:"flex align-items-center py-3 px-2 border-top-1 border-bottom-1 surface-border flex-wrap"},ue=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"Tags",-1)),fe={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},_e={class:"flex align-items-center py-3 px-2 border-bottom-1 surface-border flex-wrap"},xe=d(()=>e("div",{class:"text-500 w-6 md:w-2 font-medium"},"CA Certificate",-1)),ge={class:"text-900 w-full md:w-8 md:flex-order-0 flex-order-1"},ve=d(()=>e("span",{class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},[e("i",{class:"pi pi-sitemap"})],-1)),he={class:"ml-2 font-medium"},we=d(()=>e("span",{class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},[e("i",{class:"pi pi-bookmark"})],-1)),ye={class:"ml-2 font-medium"},be={__name:"HostInfo",setup(x){const o=J(),y=q(),h=new L,i=g({hostname:"-",osName:"-",osVersion:"-",lastBootUptime:"-",cpuInfo:"-",ipAddress:"-",mac:"-"}),n=g({organization:"",commonName:""}),r=g([]),B=()=>{var a,s,l;R.commit("account/setClient",(a=o.params)==null?void 0:a.id),h.info({id:(s=o.params)==null?void 0:s.id}).then(t=>{i.value=t==null?void 0:t.data}).catch(t=>console.log("Request Failed",t)),h.getCa({id:(l=o.params)==null?void 0:l.id}).then(t=>{n.value=t==null?void 0:t.data}).catch(t=>console.log("Request Failed",t))},O=()=>{var a,s,l;h.renewCa({id:(a=o.params)==null?void 0:a.id,organization:(s=n.value)==null?void 0:s.organization,commonName:(l=n.value)==null?void 0:l.commonName}).then(t=>{var f;((f=t.data)==null?void 0:f.status)=="OK"?y.add({severity:"success",summary:"Tips",detail:"Modified successfully.",life:3e3}):y.add({severity:"error",summary:"Tips",detail:"Modified Failed.",life:3e3})}).catch(t=>console.log("Request Failed",t))},b=a=>{var s;(s=o.params)!=null&&s.id?localStorage.setItem("tagList",JSON.stringify(a.value)):localStorage.setItem("tags",a.value.join(","))},z=()=>{var a,s,l;if((a=o.params)!=null&&a.id){const t=localStorage.getItem("tagList")?JSON.parse(localStorage.getItem("tagList")):{};r.value=t,r.value.hasOwnProperty((s=o.params)==null?void 0:s.id)||(r.value[(l=o.params)==null?void 0:l.id]=[])}else{const t=localStorage.getItem("tags")||"";r.value=t==""?[]:t.split(",")}};A(()=>{B(),z()});const T=g({icon:"pi pi-desktop"});return(a,s)=>{var I,N;const l=p("Breadcrumb"),t=p("Chip"),f=p("ChipList"),C=p("InputText"),U=p("Button"),F=p("BlockViewer");return v(),k(M,null,[(I=_(o).params)!=null&&I.id?(v(),k("div",D,[c(l,{home:T.value,model:[{label:(N=_(o).params)==null?void 0:N.id}]},null,8,["home","model"])])):H("",!0),e("div",K,[c(F,{text:"Json",tag:"Client",header:"Host Information",code:JSON.stringify(i.value,null,"	"),containerClass:"surface-section px-4 py-7 md:px-6 lg:px-7"},{default:w(()=>{var S;return[e("div",G,[e("div",Q,u(i.value.hostname),1),e("div",W,u(i.value.ipAddress),1),e("ul",X,[e("li",Y,[Z,e("div",$,u(i.value.osName||"-"),1)]),e("li",ee,[te,e("div",se,[c(t,{label:i.value.osVersion||"0.0",class:"mr-2"},null,8,["label"])])]),e("li",oe,[ae,e("div",le,u(i.value.lastBootUptime||"-"),1)]),e("li",ie,[ne,e("div",de,u(i.value.cpuInfo||"-"),1)]),e("li",re,[ce,e("div",me,u(i.value.mac||"-"),1)]),e("li",pe,[ue,e("div",fe,[(S=_(o).params)!=null&&S.id?(v(),V(f,{key:0,list:r.value[_(o).params.id],"onUpdate:list":s[0]||(s[0]=m=>r.value[_(o).params.id]=m),onChange:b},null,8,["list"])):(v(),V(f,{key:1,list:r.value,"onUpdate:list":s[1]||(s[1]=m=>r.value=m),onChange:b},null,8,["list"]))])]),e("li",_e,[xe,e("div",ge,[c(t,{class:"pl-0 pr-3 mr-2"},{default:w(()=>[ve,e("span",he,[c(C,{placeholder:"Organization",class:"add-tag-input xl",unstyled:!0,modelValue:n.value.organization,"onUpdate:modelValue":s[2]||(s[2]=m=>n.value.organization=m),type:"text"},null,8,["modelValue"])])]),_:1}),c(t,{class:"pl-0 pr-3 mr-2"},{default:w(()=>[we,e("span",ye,[c(C,{placeholder:"Common Name",class:"add-tag-input xxl",unstyled:!0,modelValue:n.value.commonName,"onUpdate:modelValue":s[3]||(s[3]=m=>n.value.commonName=m),type:"text"},null,8,["modelValue"])])]),_:1}),c(U,{class:"min-btn",rounded:"",disabled:n.value.organization.length==0||n.value.commonName.length==0,icon:"pi pi-check","aria-label":"Submit",size:"small",onClick:O},null,8,["disabled"])])])])])]}),_:1},8,["code"])])],64)}}},Ne=P(be,[["__scopeId","data-v-31cef87f"]]);export{Ne as default};