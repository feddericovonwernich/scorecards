(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();const G={PER_PAGE:25,GITHUB_BASE_URL:"https://api.github.com",ACCEPT_HEADER:"application/vnd.github.v3+json"},me={BUTTON_FEEDBACK:2e3,TOAST_DURATION:3e3,BUTTON_STATE_DURATION:3e3,ANIMATION_SHORT:100,ANIMATION_MEDIUM:300,ANIMATION_LONG:500,TAB_INIT_DELAY:100,POLLING_ACTIVE:3e4,POLLING_IDLE:6e4,WORKFLOW_POLL_DEFAULT:3e4,CACHE_SHORT:1e4,CACHE_MEDIUM:15e3,WORKFLOW_RECHECK_DELAY:5e3,LIVE_DURATION_UPDATE:1e3},Me={WIDGET_POLL_INTERVAL:"widget_poll_interval",SERVICE_WORKFLOW_POLL_INTERVAL:"service_workflow_poll_interval",THEME:"scorecards_theme"},tn=["platinum","gold","silver","bronze"],qa={IN_PROGRESS:"in_progress",QUEUED:"queued",COMPLETED:"completed"},za={SUCCESS:"success",FAILURE:"failure",CANCELLED:"cancelled"},Ua=Object.freeze(Object.defineProperty({__proto__:null,API_CONFIG:G,RANKS:tn,STORAGE_KEYS:Me,TIMING:me,WORKFLOW_CONCLUSION:za,WORKFLOW_STATUS:qa},Symbol.toStringTag,{value:"Module"})),co={github:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>`,refresh:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
    </svg>`,checkmark:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
    </svg>`,xMark:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
    </svg>`,externalLink:`<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
    </svg>`,pullRequest:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
    </svg>`,download:`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path>
        <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path>
    </svg>`,arrowLeft:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"></path>
    </svg>`,arrowRight:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"></path>
    </svg>`,chevronDown:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`};function P(e,t={}){const n=co[e];if(!n)return console.warn(`Icon "${e}" not found`),"";let o=n;return t.size&&(o=o.replace(/width="\d+"/,`width="${t.size}"`).replace(/height="\d+"/,`height="${t.size}"`)),t.className&&(o=o.replace("<svg",`<svg class="${t.className}"`)),o}const Ga=Object.freeze(Object.defineProperty({__proto__:null,ICONS:co,getIcon:P},Symbol.toStringTag,{value:"Module"}));function it(e){if(!e)return"Unknown";const t=new Date,n=new Date(e),o=Math.floor((t.getTime()-n.getTime())/1e3);if(o<60)return"Just now";if(o<3600){const a=Math.floor(o/60);return`${a} minute${a!==1?"s":""} ago`}if(o<86400){const a=Math.floor(o/3600);return`${a} hour${a!==1?"s":""} ago`}if(o<604800){const a=Math.floor(o/86400);return`${a} day${a!==1?"s":""} ago`}return n.toLocaleDateString()}function xe(e){const t=new Date(e),o=new Date().getTime()-t.getTime(),a=Math.floor(o/(1e3*60*60*24));return a===0?"Today":a===1?"Yesterday":a<7?`${a} days ago`:a<30?`${Math.floor(a/7)} weeks ago`:t.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}function Z(e){const t=Math.floor(e/1e3),n=Math.floor(t/60),o=Math.floor(n/60);return o>0?`${o}h ${n%60}m ago`:n>0?`${n}m ago`:`${t}s ago`}function ct(e){if(e===0)return"Off";if(e<6e4)return`${e/1e3} second${e!==1e3?"s":""}`;{const t=e/6e4;return`${t} minute${t!==1?"s":""}`}}function m(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function le(e){return e?e.charAt(0).toUpperCase()+e.slice(1):""}const Za=Object.freeze(Object.defineProperty({__proto__:null,capitalize:le,escapeHtml:m,formatDate:xe,formatDuration:Z,formatInterval:ct,formatRelativeTime:it},Symbol.toStringTag,{value:"Module"}));function nn(e){function t(u,k){return u<<k|u>>>32-k}function n(u,k){const $=u&2147483648,L=k&2147483648,C=u&1073741824,E=k&1073741824,A=(u&1073741823)+(k&1073741823);return C&E?A^2147483648^$^L:C|E?A&1073741824?A^3221225472^$^L:A^1073741824^$^L:A^$^L}function o(u,k,$){return u&k|~u&$}function a(u,k,$){return u&$|k&~$}function s(u,k,$){return u^k^$}function r(u,k,$){return k^(u|~$)}function i(u,k,$,L,C,E,A){return u=n(u,n(n(o(k,$,L),C),A)),n(t(u,E),k)}function c(u,k,$,L,C,E,A){return u=n(u,n(n(a(k,$,L),C),A)),n(t(u,E),k)}function l(u,k,$,L,C,E,A){return u=n(u,n(n(s(k,$,L),C),A)),n(t(u,E),k)}function f(u,k,$,L,C,E,A){return u=n(u,n(n(r(k,$,L),C),A)),n(t(u,E),k)}function v(u){const k=u.length,$=k+8,C=(($-$%64)/64+1)*16,E=new Array(C-1);let A=0,Y=0;for(;Y<k;){const ao=(Y-Y%4)/4;A=Y%4*8,E[ao]=E[ao]|u.charCodeAt(Y)<<A,Y++}const oo=(Y-Y%4)/4;return A=Y%4*8,E[oo]=E[oo]|128<<A,E[C-2]=k<<3,E[C-1]=k>>>29,E}function S(u){let k="";for(let $=0;$<=3;$++){const C="0"+(u>>>$*8&255).toString(16);k=k+C.substr(C.length-2,2)}return k}const d=v(e),_=7,b=12,M=17,x=22,J=5,F=9,ae=14,ze=20,Ue=4,Ge=11,Ze=16,Ve=23,Ke=6,Qe=10,Je=15,Ye=21;let p=1732584193,g=4023233417,h=2562383102,w=271733878;for(let u=0;u<d.length;u+=16){const k=p,$=g,L=h,C=w;p=i(p,g,h,w,d[u+0],_,3614090360),w=i(w,p,g,h,d[u+1],b,3905402710),h=i(h,w,p,g,d[u+2],M,606105819),g=i(g,h,w,p,d[u+3],x,3250441966),p=i(p,g,h,w,d[u+4],_,4118548399),w=i(w,p,g,h,d[u+5],b,1200080426),h=i(h,w,p,g,d[u+6],M,2821735955),g=i(g,h,w,p,d[u+7],x,4249261313),p=i(p,g,h,w,d[u+8],_,1770035416),w=i(w,p,g,h,d[u+9],b,2336552879),h=i(h,w,p,g,d[u+10],M,4294925233),g=i(g,h,w,p,d[u+11],x,2304563134),p=i(p,g,h,w,d[u+12],_,1804603682),w=i(w,p,g,h,d[u+13],b,4254626195),h=i(h,w,p,g,d[u+14],M,2792965006),g=i(g,h,w,p,d[u+15],x,1236535329),p=c(p,g,h,w,d[u+1],J,4129170786),w=c(w,p,g,h,d[u+6],F,3225465664),h=c(h,w,p,g,d[u+11],ae,643717713),g=c(g,h,w,p,d[u+0],ze,3921069994),p=c(p,g,h,w,d[u+5],J,3593408605),w=c(w,p,g,h,d[u+10],F,38016083),h=c(h,w,p,g,d[u+15],ae,3634488961),g=c(g,h,w,p,d[u+4],ze,3889429448),p=c(p,g,h,w,d[u+9],J,568446438),w=c(w,p,g,h,d[u+14],F,3275163606),h=c(h,w,p,g,d[u+3],ae,4107603335),g=c(g,h,w,p,d[u+8],ze,1163531501),p=c(p,g,h,w,d[u+13],J,2850285829),w=c(w,p,g,h,d[u+2],F,4243563512),h=c(h,w,p,g,d[u+7],ae,1735328473),g=c(g,h,w,p,d[u+12],ze,2368359562),p=l(p,g,h,w,d[u+5],Ue,4294588738),w=l(w,p,g,h,d[u+8],Ge,2272392833),h=l(h,w,p,g,d[u+11],Ze,1839030562),g=l(g,h,w,p,d[u+14],Ve,4259657740),p=l(p,g,h,w,d[u+1],Ue,2763975236),w=l(w,p,g,h,d[u+4],Ge,1272893353),h=l(h,w,p,g,d[u+7],Ze,4139469664),g=l(g,h,w,p,d[u+10],Ve,3200236656),p=l(p,g,h,w,d[u+13],Ue,681279174),w=l(w,p,g,h,d[u+0],Ge,3936430074),h=l(h,w,p,g,d[u+3],Ze,3572445317),g=l(g,h,w,p,d[u+6],Ve,76029189),p=l(p,g,h,w,d[u+9],Ue,3654602809),w=l(w,p,g,h,d[u+12],Ge,3873151461),h=l(h,w,p,g,d[u+15],Ze,530742520),g=l(g,h,w,p,d[u+2],Ve,3299628645),p=f(p,g,h,w,d[u+0],Ke,4096336452),w=f(w,p,g,h,d[u+7],Qe,1126891415),h=f(h,w,p,g,d[u+14],Je,2878612391),g=f(g,h,w,p,d[u+5],Ye,4237533241),p=f(p,g,h,w,d[u+12],Ke,1700485571),w=f(w,p,g,h,d[u+3],Qe,2399980690),h=f(h,w,p,g,d[u+10],Je,4293915773),g=f(g,h,w,p,d[u+1],Ye,2240044497),p=f(p,g,h,w,d[u+8],Ke,1873313359),w=f(w,p,g,h,d[u+15],Qe,4264355552),h=f(h,w,p,g,d[u+6],Je,2734768916),g=f(g,h,w,p,d[u+13],Ye,1309151649),p=f(p,g,h,w,d[u+4],Ke,4149444226),w=f(w,p,g,h,d[u+11],Qe,3174756917),h=f(h,w,p,g,d[u+2],Je,718787259),g=f(g,h,w,p,d[u+9],Ye,3951481745),p=n(p,k),g=n(g,$),h=n(h,L),w=n(w,C)}return(S(p)+S(g)+S(h)+S(w)).toLowerCase()}const Va=Object.freeze(Object.defineProperty({__proto__:null,md5:nn},Symbol.toStringTag,{value:"Module"}));function N(e){const t=e.startsWith("--")?e:`--${e}`;return getComputedStyle(document.documentElement).getPropertyValue(t).trim()}function Ka(e,t){const n=e.startsWith("--")?e:`--${e}`;document.documentElement.style.setProperty(n,t)}const Qa=Object.freeze(Object.defineProperty({__proto__:null,getCssVar:N,setCssVar:Ka},Symbol.toStringTag,{value:"Module"}));function Ja(e){const t=document.createElement("textarea");t.value=e,t.style.position="fixed",t.style.left="-999999px",t.style.top="-999999px",document.body.appendChild(t),t.focus(),t.select();try{const n=document.execCommand("copy");return document.body.removeChild(t),n}catch{return document.body.removeChild(t),!1}}async function lo(e,t){const n=document.getElementById(e);if(!n)return;const o=n.textContent||"",a=(t==null?void 0:t.currentTarget)||(t==null?void 0:t.target);try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(o);else if(!Ja(o))throw new Error("Fallback copy failed");if(a){const s=a.textContent||"";a.textContent="Copied!",a.style.background=N("--color-copy-success"),setTimeout(()=>{a.textContent=s,a.style.background=N("--color-copy-default")},me.BUTTON_FEEDBACK)}}catch(s){console.error("Failed to copy:",s);let r="Failed to copy to clipboard. ";window.isSecureContext?s instanceof Error&&s.name==="NotAllowedError"?r+="Please allow clipboard access in your browser.":r+="Please select and copy the text manually.":r+="This page must be served over HTTPS.",alert(r)}}const Ya=Object.freeze(Object.defineProperty({__proto__:null,copyBadgeCode:lo},Symbol.toStringTag,{value:"Module"}));function Xa(e,t={},n=[]){const o=document.createElement(e);return Object.entries(t).forEach(([s,r])=>{s==="className"&&typeof r=="string"?o.className=r:s==="style"&&typeof r=="object"&&r!==null?Object.assign(o.style,r):s.startsWith("on")&&typeof r=="function"?o.addEventListener(s.substring(2).toLowerCase(),r):s==="dataset"&&typeof r=="object"&&r!==null?Object.entries(r).forEach(([i,c])=>{o.dataset[i]=c}):(typeof r=="string"||typeof r=="number")&&o.setAttribute(s,String(r))}),(Array.isArray(n)?n:[n]).forEach(s=>{typeof s=="string"?o.appendChild(document.createTextNode(s)):s instanceof HTMLElement&&o.appendChild(s)}),o}function es(e){const t=typeof e=="string"?document.querySelector(e):e;t&&(t.style.display="")}function ts(e){const t=typeof e=="string"?document.querySelector(e):e;t&&(t.style.display="none")}function ns(e){const t=typeof e=="string"?document.querySelector(e):e;t&&(t.style.display=t.style.display==="none"?"":"none")}function os(e,t,n,o){e.addEventListener(n,a=>{const s=a.target.closest(t);s&&o.call(s,a)})}function as(e,t,n){const o=typeof e=="string"?document.querySelector(e):e;o&&(n?o.classList.add(t):o.classList.remove(t))}function ss(e,t){const n=typeof e=="string"?document.querySelector(e):e;n&&(n.innerHTML=t)}const rs=Object.freeze(Object.defineProperty({__proto__:null,createElement:Xa,delegateEvent:os,hide:ts,setHTML:ss,show:es,toggle:ns,toggleClass:as},Symbol.toStringTag,{value:"Module"}));function lt(e){if(!e)return;const t=e.tagName==="svg"?e:e.querySelector("svg");t&&(t.style.animation="spin 1s linear infinite")}function on(e){if(!e)return;const t=e.tagName==="svg"?e:e.querySelector("svg");t&&(t.style.animation="")}function is(e){if(!e)return;const t=e.tagName==="svg"?e:e.querySelector("svg");t&&t.classList.add("spinning")}function cs(e){if(!e)return;const t=e.tagName==="svg"?e:e.querySelector("svg");t&&t.classList.remove("spinning")}const ls=Object.freeze(Object.defineProperty({__proto__:null,addSpinningClass:is,removeSpinningClass:cs,startButtonSpin:lt,stopButtonSpin:on},Symbol.toStringTag,{value:"Module"}));function ve(e){const t={platinum:0,gold:0,silver:0,bronze:0};return tn.forEach(n=>{t[n]=e.filter(o=>o.rank===n).length}),t}function De(e){if(!e||e.length===0)return 0;const t=e.reduce((n,o)=>n+(o.score||0),0);return Math.round(t/e.length)}function ds(e,t,n){return{total:e.length,avgScore:De(e),ranks:ve(e),apiCount:e.filter(o=>o.has_api).length,staleCount:t?e.filter(o=>t(o,n)).length:0,installedCount:e.filter(o=>o.installed).length}}const us=Object.freeze(Object.defineProperty({__proto__:null,calculateAverageScore:De,calculateServiceStats:ds,countByRank:ve},Symbol.toStringTag,{value:"Module"}));function B(e){var t;return e.team?typeof e.team=="string"?e.team:e.team.primary||((t=e.team.all)==null?void 0:t[0])||null:null}function uo(e){return e.team?typeof e.team=="string"?[e.team]:e.team.all||(e.team.primary?[e.team.primary]:[]):[]}function Oe(e){const t=new Set;return e.forEach(n=>{const o=B(n);o&&t.add(o)}),Array.from(t).sort((n,o)=>n.localeCompare(o))}function mo(e){return Oe(e).length}function fo(e,t,n){return{serviceCount:e.length,averageScore:De(e),rankDistribution:ve(e),staleCount:t?e.filter(o=>t(o,n)).length:0,installedCount:e.filter(o=>o.installed).length}}function Pe(e,t=null,n=null){const o={},a={};e.forEach(r=>{const i=B(r);i&&(o[i]||(o[i]=[],r.team&&typeof r.team=="object"&&(a[i]={github_org:r.team.github_org||null,github_slug:r.team.github_slug||null})),o[i].push(r))});const s={};return Object.entries(o).forEach(([r,i])=>{var c,l;s[r]={name:r,...fo(i,t,n),github_org:((c=a[r])==null?void 0:c.github_org)||null,github_slug:((l=a[r])==null?void 0:l.github_slug)||null}}),s}function po(e,t="serviceCount",n="desc"){const o=Object.values(e),a={name:(i,c)=>i.name.localeCompare(c.name),serviceCount:(i,c)=>i.serviceCount-c.serviceCount,averageScore:(i,c)=>i.averageScore-c.averageScore,staleCount:(i,c)=>i.staleCount-c.staleCount},s=a[t]||a.serviceCount,r=n==="asc"?1:-1;return o.sort((i,c)=>s(i,c)*r)}function ms(e,t){return e.filter(n=>uo(n).includes(t))}function fs(e){return e.filter(t=>!B(t))}function an(e,t){const n={};return e&&e.teams&&Object.entries(e.teams).forEach(([o,a])=>{const s=a.name||o,r=t[s]||{serviceCount:0,averageScore:0,rankDistribution:{platinum:0,gold:0,silver:0,bronze:0},staleCount:0,installedCount:0};n[o]={id:o,name:s,description:a.description||null,aliases:a.aliases||[],metadata:a.metadata||{},statistics:r}}),Object.entries(t).forEach(([o,a])=>{const s=o.toLowerCase().replace(/\s+/g,"-");n[s]||(n[s]={id:s,name:o,description:null,aliases:[],metadata:{},statistics:a})}),n}function go(e){if(!e)return"";const t=[];return tn.forEach(n=>{const o=e[n]||0;o>0&&t.push(`${o} ${n.charAt(0).toUpperCase()+n.slice(1)}`)}),t.join(", ")}function pe(e){const t=e.averageScore||0;return t>=90?"platinum":t>=75?"gold":t>=50?"silver":"bronze"}const ps=Object.freeze(Object.defineProperty({__proto__:null,buildRankSummary:go,calculateSingleTeamStats:fo,calculateTeamStats:Pe,getAllTeams:uo,getRank:pe,getServicesForTeam:ms,getServicesWithoutTeam:fs,getTeamCount:mo,getTeamName:B,getUniqueTeams:Oe,mergeTeamDataWithStats:an,sortTeamStats:po},Symbol.toStringTag,{value:"Module"}));function dt(e,t){var n;return((n=e.excluded_checks)==null?void 0:n.some(o=>o.check===t))??!1}function sn(e,t){var n,o;return((o=(n=e.excluded_checks)==null?void 0:n.find(a=>a.check===t))==null?void 0:o.reason)??null}function gs(e,t){return e.filter(n=>dt(n,t)).map(n=>({org:n.org,repo:n.repo,name:n.name,score:n.score,rank:n.rank,exclusionReason:sn(n,t)}))}function ut(e,t){var l;let n=0,o=0,a=0,s=0;for(const f of e){if(dt(f,t)){a++;continue}const v=(l=f.check_results)==null?void 0:l[t];v==="pass"?n++:v==="fail"?o++:s++}const r=e.length,i=r-a,c=i>0?Math.round(n/i*100):0;return{total:r,activeTotal:i,passing:n,failing:o,excluded:a,unknown:s,percentage:c}}function rn(e,t){var o;const n={};for(const a of e){const s=B(a)||"No Team";n[s]||(n[s]={total:0,activeTotal:0,passing:0,failing:0,excluded:0,unknown:0,percentage:0,services:[]});const r=n[s];if(r.total++,dt(a,t)){r.excluded++,r.services.push({org:a.org,repo:a.repo,name:a.name,score:a.score,rank:a.rank,checkStatus:"excluded",exclusionReason:sn(a,t)});continue}const c=(o=a.check_results)==null?void 0:o[t];c==="pass"?r.passing++:c==="fail"?r.failing++:r.unknown++,r.services.push({org:a.org,repo:a.repo,name:a.name,score:a.score,rank:a.rank,checkStatus:c||"unknown"})}for(const a of Object.keys(n)){const s=n[a];s.activeTotal=s.total-s.excluded,s.percentage=s.activeTotal>0?Math.round(s.passing/s.activeTotal*100):0,s.services.sort((r,i)=>{const c={pass:0,fail:1,excluded:2,unknown:3},l=c[r.checkStatus||"unknown"]??3,f=c[i.checkStatus||"unknown"]??3;return l!==f?l-f:i.score-r.score})}return n}function ho(e,t){return!t||t.size===0?e:e.filter(n=>{var o;for(const[a,s]of t){if(s==null)continue;const r=(o=n.check_results)==null?void 0:o[a];if(s==="pass"&&r!=="pass"||s==="fail"&&r!=="fail")return!1}return!0})}function hs(e,t){return e.filter(n=>{var o;return((o=n.check_results)==null?void 0:o[t])==="pass"})}function ws(e,t){return e.filter(n=>{var o;return((o=n.check_results)==null?void 0:o[t])==="fail"})}function vs(e,t){return t.map(n=>{const o=ut(e,n.id);return{checkId:n.id,name:n.name,category:n.category,weight:n.weight,...o}})}function wo(e,t="desc"){const n=Object.entries(e).map(([o,a])=>({teamName:o,...a}));return n.sort((o,a)=>{const s=o.percentage-a.percentage;return t==="desc"?-s:s}),n}function Be(e){if(!e)return 0;let t=0;for(const[,n]of e)n!=null&&t++;return t}const bs=Object.freeze(Object.defineProperty({__proto__:null,calculateCheckAdoptionByTeam:rn,calculateOverallCheckAdoption:ut,filterByCheckCriteria:ho,getActiveCheckFilterCount:Be,getAllChecksAdoptionStats:vs,getExcludedServicesForCheck:gs,getExclusionReason:sn,getServicesFailingCheck:ws,getServicesPassingCheck:hs,isCheckExcluded:dt,sortTeamsByAdoption:wo},Symbol.toStringTag,{value:"Module"})),Ee=new Map;function vo(e,t="default"){if(ot(t),!document.querySelector(e))return null;const o=setInterval(()=>{const a=document.querySelector(e);if(!a){ot(t);return}ks(a)},me.LIVE_DURATION_UPDATE);return Ee.set(t,o),o}function ot(e="default"){const t=Ee.get(e);t&&(clearInterval(t),Ee.delete(e))}function ys(){Ee.forEach(e=>{clearInterval(e)}),Ee.clear()}function ks(e){e.querySelectorAll(".widget-run-duration").forEach(n=>{const o=n.dataset.started,a=n.dataset.status;if(o){const s=new Date(o),i=new Date().getTime()-s.getTime(),c=Z(i);let l;a==="in_progress"?l="Running for":a==="queued"?l="Queued":l="Completed",n.textContent=`${l} ${c}`}})}const Ss=Object.freeze(Object.defineProperty({__proto__:null,startLiveDurationUpdates:vo,stopAllDurationUpdates:ys,stopLiveDurationUpdates:ot},Symbol.toStringTag,{value:"Module"}));function y(e,t="info"){let n=document.getElementById("toast-container");n||(n=document.createElement("div"),n.id="toast-container",document.body.appendChild(n));const o=document.createElement("div");o.className=`toast toast-${t}`;let a="";switch(t){case"success":a="✓";break;case"error":a="✗";break;case"warning":a="⚠";break;case"info":default:a="ℹ";break}o.innerHTML=`
        <span class="toast-icon">${a}</span>
        <span class="toast-message">${m(e)}</span>
    `,n.appendChild(o),setTimeout(()=>{o.classList.add("show")},10),setTimeout(()=>{o.classList.remove("show"),setTimeout(()=>{n==null||n.removeChild(o)},300)},5e3)}const $s=Object.freeze(Object.defineProperty({__proto__:null,showToast:y},Symbol.toStringTag,{value:"Module"}));function oe(e){const t=document.getElementById(e);t&&(t.classList.remove("hidden"),document.body.style.overflow="hidden")}function te(e){const t=document.getElementById(e);t&&(t.classList.add("hidden"),document.body.style.overflow="")}function Ts(e){const t=document.getElementById(e);t&&(t.classList.contains("hidden")?oe(e):te(e))}function bo(){document.querySelectorAll('[id$="-modal"]').forEach(t=>{t.classList.add("hidden")}),document.body.style.overflow=""}function be(e,t=null){const n=document.getElementById(e);n&&(n.addEventListener("click",o=>{o.target===n&&(te(e),t&&t())}),document.addEventListener("keydown",o=>{o.key==="Escape"&&!n.classList.contains("hidden")&&(te(e),t&&t())}))}function yo(e,t,n=null){confirm(e)?t():n&&n()}function Cs(e,t,n){const o=document.getElementById(e);if(!o)return;const a=o.querySelector(t);a&&(typeof n=="string"?a.innerHTML=n:n instanceof HTMLElement&&(a.innerHTML="",a.appendChild(n)))}function _s(e,t){const n=document.getElementById(e);if(!n)return;const o=n.querySelector("h2, .modal-title, [data-modal-title]");o&&(o.textContent=t)}const Es=Object.freeze(Object.defineProperty({__proto__:null,closeAllModals:bo,hideModal:te,setModalTitle:_s,setupModalHandlers:be,showConfirmation:yo,showModal:oe,toggleModal:Ts,updateModalContent:Cs},Symbol.toStringTag,{value:"Module"}));function j(e,t){return t?e.checks_hash?e.checks_hash!==t:!0:!1}function As(e,t){const n=j(e,t);return{isStale:n,message:n?"Score may be outdated (checks have been updated)":"Score is current",serviceHash:e.checks_hash||"unknown",currentHash:t||"unknown"}}function ko(e,t){return e.filter(n=>j(n,t))}function Ls(e,t){const n=ko(e,t);return{total:e.length,stale:n.length,upToDate:e.length-n.length,percentage:e.length>0?Math.round(n.length/e.length*100):0}}function Is(e,t){return e.filter(n=>j(n,t)&&n.installed).length}const Ms=Object.freeze(Object.defineProperty({__proto__:null,countStaleInstalled:Is,filterStaleServices:ko,getStalenessInfo:As,getStalenessStats:Ls,isServiceStale:j},Symbol.toStringTag,{value:"Module"}));function cn(e,t,n,o){return e.filter(a=>{var s;if(t&&t.size>0)for(const[r,i]of t){let c=!1;if(r==="has-api"?c=a.has_api:r==="stale"?c=j(a,o):r==="installed"?c=a.installed:(r==="platinum"||r==="gold"||r==="silver"||r==="bronze")&&(c=a.rank===r),i==="include"){if(!c)return!1}else if(i==="exclude"&&c)return!1}if(n){const r=typeof a.team=="string"?a.team:((s=a.team)==null?void 0:s.primary)||"";if(!`${a.name} ${a.org} ${a.repo} ${r}`.toLowerCase().includes(n))return!1}return!0})}function ln(e,t){return e.sort((n,o)=>{switch(t){case"score-desc":return o.score-n.score;case"score-asc":return n.score-o.score;case"name-asc":return n.name.localeCompare(o.name);case"name-desc":return o.name.localeCompare(n.name);case"updated-desc":return new Date(o.last_updated).getTime()-new Date(n.last_updated).getTime();case"updated-asc":return new Date(n.last_updated).getTime()-new Date(o.last_updated).getTime();default:return 0}}),e}function So(e,t,n,o,a){const s=cn(e,t,n,a);return ln(s,o)}function $o(e,t,n){const o=e.filter(r=>j(r,n)).length,a=e.filter(r=>r.installed).length,s=e.filter(r=>r.has_api).length;return{total:e.length,filtered:t.length,stale:o,installed:a,hasApi:s,ranks:ve(e)}}const xs=Object.freeze(Object.defineProperty({__proto__:null,filterAndSort:So,filterServices:cn,getFilterStats:$o,sortServices:ln},Symbol.toStringTag,{value:"Module"}));function dn(e){const t=e.status==="completed"?e.conclusion==="success"?"success":e.conclusion==="failure"?"failure":"neutral":e.status,n=un(e.status,e.conclusion||null),o=mn(e);return`
        <div class="widget-run-item" data-run-id="${e.id}">
            <div class="widget-run-header">
                <span class="widget-run-status status-${t}">${n}</span>
                <div class="widget-run-info">
                    <div class="widget-run-name">${m(e.name)}</div>
                    <div class="widget-run-repo">${m(e.org||"")}/${m(e.repo||"")}</div>
                </div>
            </div>
            <div class="widget-run-meta">
                <span class="widget-run-duration" data-started="${e.run_started_at||e.created_at}" data-status="${e.status}">
                    ${o.label} ${o.time}
                </span>
                <a href="${e.html_url}" target="_blank" rel="noopener noreferrer" class="widget-run-link" onclick="event.stopPropagation()">
                    View
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                    </svg>
                </a>
            </div>
        </div>
    `}function un(e,t){return e==="in_progress"?'<span class="spinner-small"></span>':e==="queued"?"⏳":e==="completed"?t==="success"?"✓":t==="failure"?"✗":t==="cancelled"?"⊘":"●":"●"}function mn(e){const t=new Date;if(e.status==="completed"){const n=new Date(e.updated_at),o=t.getTime()-n.getTime();return{label:"Completed",time:Z(o)}}else if(e.status==="in_progress"){const n=new Date(e.run_started_at||e.created_at),o=t.getTime()-n.getTime();return{label:"Running for",time:Z(o)}}else{const n=new Date(e.created_at),o=t.getTime()-n.getTime();return{label:"Queued",time:Z(o)}}}const Ds=Object.freeze(Object.defineProperty({__proto__:null,calculateDuration:mn,getStatusIcon:un,renderWorkflowRun:dn},Symbol.toStringTag,{value:"Module"}));function Os(e){const t=B(e);return t?`<div class="service-team">Team: <span class="service-team-link" onclick="event.stopPropagation(); window.showTeamDetail && window.showTeamDetail('${m(t)}')">${m(t)}</span></div>`:""}function fn(){const e=document.getElementById("services-grid");if(!e)return;const t=window.filteredServices||filteredServices,n=window.currentChecksHash??currentChecksHash;if(t.length===0){e.innerHTML='<div class="empty-state"><h3>No services match your criteria</h3></div>';return}e.innerHTML=t.map(o=>{const a=j(o,n),s=a&&o.installed;return`
        <div class="service-card rank-${o.rank}" onclick="showServiceDetail('${o.org}', '${o.repo}')">
            <div class="service-header">
                <div>
                    <div class="service-title-wrapper">
                        <div class="service-name">${m(o.name)}</div>
                        <div class="service-badges">
                            ${o.has_api?'<span class="badge-api">API</span>':""}
                            ${a?'<span class="badge-stale">STALE</span>':""}
                            ${o.installed?'<span class="badge-installed">INSTALLED</span>':""}
                        </div>
                    </div>
                    <div class="service-org">${m(o.org)}/${m(o.repo)}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${s?`
                    <button
                        class="trigger-btn trigger-btn-icon"
                        onclick="event.stopPropagation(); triggerServiceWorkflow('${m(o.org)}', '${m(o.repo)}', this)"
                        title="Re-run scorecard workflow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                        </svg>
                    </button>
                    `:""}
                    <a href="https://github.com/${m(o.org)}/${m(o.repo)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="github-icon-link"
                       onclick="event.stopPropagation()"
                       title="View on GitHub">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                    ${!o.installed&&o.installation_pr?`
                    <a href="${m(o.installation_pr.url)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="pr-icon-link pr-icon-${o.installation_pr.state.toLowerCase()}"
                       onclick="event.stopPropagation()"
                       title="${o.installation_pr.state==="OPEN"?"Open installation PR":"Closed installation PR"} #${o.installation_pr.number}">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                        </svg>
                    </a>
                    `:""}
                    <div class="score-badge">${o.score}</div>
                </div>
            </div>
            <div class="rank-badge ${o.rank}">${le(o.rank)}</div>
            ${Os(o)}
            <div class="service-meta">
                <div>Last updated: ${xe(o.last_updated)}</div>
                ${o.installation_pr&&o.installation_pr.updated_at?`
                <div class="pr-status-timestamp" title="PR status last fetched at ${new Date(o.installation_pr.updated_at).toLocaleString()}">
                    PR status: ${it(o.installation_pr.updated_at)}
                </div>
                `:""}
            </div>
        </div>
    `}).join("")}const Ps=Object.freeze(Object.defineProperty({__proto__:null,renderServices:fn},Symbol.toStringTag,{value:"Module"}));let mt=null;function T(){return mt}function ft(){return!!mt}function pt(e){mt=e?e.trim():null}function ye(){mt=null}async function pn(e){try{return(await fetch("https://api.github.com/user",{headers:{Authorization:`token ${e}`,Accept:"application/vnd.github.v3+json"}})).ok}catch(t){return console.error("Error validating PAT:",t),!1}}async function Bs(e){return!e||!e.trim()?!1:await pn(e.trim())?(pt(e.trim()),!0):!1}function Rs(){return T()}const Hs=Object.freeze(Object.defineProperty({__proto__:null,clearToken:ye,getToken:T,getTokenForAuth:Rs,hasToken:ft,setToken:pt,validateAndSaveToken:Bs,validateToken:pn},Symbol.toStringTag,{value:"Module"}));var Xe={};function js(){if(typeof process<"u"&&(Xe!=null&&Xe.SCORECARD_REPO_OWNER))return Xe.SCORECARD_REPO_OWNER;if(typeof window<"u"){const e=window.location.hostname;return e==="localhost"||e==="127.0.0.1"||e.startsWith("192.168.")?window.SCORECARD_REPO_OWNER||"feddericovonwernich":e.split(".")[0]||"feddericovonwernich"}return"feddericovonwernich"}const ke={repoOwner:js(),repoName:"scorecards",catalogBranch:"catalog",ports:{devServer:8080,testServer:8080},api:{githubBase:"https://api.github.com",version:"2022-11-28",acceptHeader:"application/vnd.github.v3+json"},git:{botName:"scorecard-bot",botEmail:"scorecard-bot@users.noreply.github.com"}},gt=ke.repoOwner,ht=ke.repoName,wt=ke.catalogBranch,gn=`https://raw.githubusercontent.com/${gt}/${ht}/${wt}`;let et=null,so=0;const Fs=10*1e3;async function V(e,t={}){const n=T();let o,a=!1;if(n)try{const s=`https://api.github.com/repos/${gt}/${ht}/contents/${e}?ref=${wt}`;o=await fetch(s,{...t,cache:"no-cache",headers:{...t.headers,Accept:"application/vnd.github.raw",Authorization:`token ${n}`}}),a=!0,o.status===403||o.status===429||o.status===401?(console.warn(`API fetch failed with status ${o.status}, falling back to CDN`),a=!1):o.ok||(console.warn(`API fetch failed with status ${o.status}, falling back to CDN`),a=!1)}catch(s){console.error("Error with API fetch, falling back to CDN:",s),a=!1}if(!a){const s=`${gn}/${e}?t=${Date.now()}`;o=await fetch(s,{...t,cache:"no-cache"})}return{response:o,usedAPI:a}}async function vt(){const e=Date.now();if(et&&e-so<Fs)return console.log("Using cached checks hash:",et),et;console.log("Fetching current checks hash from catalog...");try{const t=`${gn}/current-checks.json?t=${Date.now()}`,n=await fetch(t,{cache:"no-cache"});if(!n.ok)return console.error("Failed to fetch current checks hash:",n.status),null;const o=await n.json(),a=o.checks_hash;return et=a,so=e,console.log("Current checks hash:",a),console.log("Checks count:",o.checks_count),console.log("Generated at:",o.generated_at),a}catch(t){return console.error("Error fetching current checks hash:",t),null}}async function bt(){let e=!1,t=!1,n=[];try{console.log("Attempting to load consolidated registry...");const{response:o,usedAPI:a}=await V("registry/all-services.json");if(t=a,o.ok){const s=await o.json();s.services&&Array.isArray(s.services)&&(n=s.services,e=!0,console.log(`Loaded ${n.length} services from consolidated registry (generated at ${s.generated_at})`))}}catch(o){console.warn("Failed to load consolidated registry, falling back to tree API:",o)}if(!e){console.log("Loading services via tree API...");const o=`https://api.github.com/repos/${gt}/${ht}/git/trees/${wt}?recursive=1`,a=await fetch(o);if(!a.ok)throw new Error(`Failed to fetch repository tree: ${a.status}`);const r=(await a.json()).tree.filter(l=>l.path.startsWith("registry/")&&l.path.endsWith(".json")&&l.path!=="registry/all-services.json").map(l=>l.path);if(r.length===0)throw new Error("No services registered yet");const i=r.map(async l=>{const{response:f,usedAPI:v}=await V(l);return v&&(t=!0),f.ok?f.json():null});n=(await Promise.all(i)).filter(l=>l!==null),console.log(`Loaded ${n.length} services via tree API`)}return{services:n,usedAPI:t}}let tt=null,Nt=0;const Ws=60*1e3;async function yt(e=!1){const t=Date.now();if(!e&&tt&&t-Nt<Ws)return console.log("Using cached teams data"),{teams:tt,usedAPI:!1};console.log("Loading teams from registry...");try{const{response:n,usedAPI:o}=await V("teams/all-teams.json");if(!n.ok)return console.warn("Failed to load teams registry:",n.status),{teams:null,usedAPI:o};const a=await n.json();return tt=a,Nt=t,console.log(`Loaded ${a.count||0} teams from registry (generated at ${a.generated_at})`),{teams:a,usedAPI:o}}catch(n){return console.error("Error loading teams:",n),{teams:null,usedAPI:!1}}}async function To(e){try{const{response:t}=await V(`teams/${e}.json`);return t.ok?t.json():(console.warn(`Failed to load team ${e}:`,t.status),null)}catch(t){return console.error(`Error loading team ${e}:`,t),null}}function Ns(){tt=null,Nt=0}function de(){return gt}function ue(){return ht}function qs(){return wt}function hn(){return gn}const zs=Object.freeze(Object.defineProperty({__proto__:null,clearTeamsCache:Ns,fetchCurrentChecksHash:vt,fetchWithHybridAuth:V,getBranch:qs,getRawBaseUrl:hn,getRepoName:ue,getRepoOwner:de,loadServices:bt,loadTeamById:To,loadTeams:yt},Symbol.toStringTag,{value:"Module"}));function Us(e,t,n,o){return e?`
        <div class="stale-warning">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div style="flex: 1;">
                    <strong class="stale-warning-text">Scorecard is Stale</strong>
                    <p class="stale-warning-text" style="margin: 5px 0 0 0;">
                        This scorecard was generated with an older version of the check suite.
                        New checks may have been added or existing checks may have been modified.
                        ${t?'Click the "Re-run Scorecard" button to get up-to-date results.':"Re-run the scorecard workflow to get up-to-date results."}
                    </p>
                </div>
                ${t?`
                <button
                    id="modal-trigger-btn"
                    class="trigger-btn"
                    onclick="triggerServiceWorkflow('${m(n)}', '${m(o)}', this)"
                    style="margin-left: auto;">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                        <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                    </svg>
                    Re-run Scorecard
                </button>
                `:""}
            </div>
        </div>
    `:""}function Gs(e,t,n,o){return!e||t?"":`
        <button
            id="modal-trigger-btn"
            class="trigger-btn trigger-btn-neutral"
            onclick="triggerServiceWorkflow('${m(n)}', '${m(o)}', this)"
            title="Run scorecard workflow on-demand">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
            </svg>
            Run Scorecard
        </button>
    `}function Zs(e,t,n,o,a){return`
        <div class="rank-badge modal-header-badge ${e.rank}">
            ${le(e.rank)}
        </div>

        <h2>${m(e.service.name)}</h2>
        <p class="tab-section-description">
            ${m(e.service.org)}/${m(e.service.repo)}
        </p>
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <a href="https://github.com/${m(e.service.org)}/${m(e.service.repo)}"
               target="_blank"
               rel="noopener noreferrer"
               class="github-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                View on GitHub
            </a>
            <button
                id="modal-refresh-btn"
                class="github-button"
                onclick="refreshServiceData('${m(t)}', '${m(n)}')"
                title="Refresh service data">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                </svg>
                Refresh Data
            </button>
            ${Gs(o,a,t,n)}
            ${!e.installed&&e.installation_pr&&e.installation_pr.state==="OPEN"?`
            <a href="${m(e.installation_pr.url)}"
               target="_blank"
               rel="noopener noreferrer"
               class="pr-button pr-button-open">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                </svg>
                Open Installation PR #${e.installation_pr.number}
            </a>
            `:""}
            ${!e.installed&&(!e.installation_pr||e.installation_pr.state==="MERGED"||e.installation_pr.state==="CLOSED")?`
            <button
                id="install-btn"
                class="install-button"
                onclick="installService('${m(t)}', '${m(n)}', this)"
                title="${e.installation_pr?`Previous PR #${e.installation_pr.number} was ${e.installation_pr.state.toLowerCase()}`:"Create installation PR"}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path>
                    <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path>
                </svg>
                ${e.installation_pr?"Re-create":"Install"} Scorecards
            </button>
            `:""}
        </div>
    `}function Vs(e){const t=e.checks?e.checks.filter(n=>n.status==="excluded").length:0;return`
        <div class="modal-stats-container">
            <div class="modal-stat-item">
                <div class="modal-stat-value">${e.score}</div>
                <div class="modal-stat-label">Score</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-value">${e.passed_checks}/${e.total_checks}</div>
                <div class="modal-stat-label">Checks Passed</div>
            </div>
            ${t>0?`
            <div class="modal-stat-item">
                <div class="modal-stat-value modal-stat-excluded">${t}</div>
                <div class="modal-stat-label">Excluded</div>
            </div>
            `:""}
        </div>

        ${B(e.service)?`<p><strong>Team:</strong> ${m(B(e.service))}</p>`:""}
        <p><strong>Last Run:</strong> ${xe(e.timestamp)}</p>
        ${e.commit_sha?`<p><strong>Commit:</strong> <code>${e.commit_sha.substring(0,7)}</code></p>`:""}
        ${e.recent_contributors&&e.recent_contributors.length>0&&e.recent_contributors[0].last_commit_hash?`<p><strong>Last Commit:</strong> <code>${e.recent_contributors[0].last_commit_hash}</code></p>`:""}
        ${e.installation_pr&&e.installation_pr.updated_at?`
        <p><strong>PR Status Updated:</strong> ${it(e.installation_pr.updated_at)}
            <span class="tab-section-description" style="font-size: 0.9em;" title="${new Date(e.installation_pr.updated_at).toLocaleString()}">(${new Date(e.installation_pr.updated_at).toLocaleString()})</span>
        </p>
        `:""}
    `}function Ks(e){if(!e)return null;const t=e.match(/Title: (.+)/),n=e.match(/OpenAPI version: ([\d.]+)/),o=e.match(/Endpoints: (\d+) paths?, (\d+) operations?/);return!t&&!n&&!o?null:{title:t?t[1].trim():null,openApiVersion:n?n[1]:null,paths:o?parseInt(o[1]):null,operations:o?parseInt(o[2]):null}}function Co(e){var o,a;const t=(o=e.checks)==null?void 0:o.find(s=>s.check_id==="06-openapi-spec"),n=(t==null?void 0:t.status)==="pass"?Ks(t.stdout||""):null;if(e.service.openapi)return{hasSpec:!0,specInfo:e.service.openapi,fromConfig:!0,summary:n};if(t&&t.status==="pass"){const s=(a=t.stdout)==null?void 0:a.match(/found and validated: (.+)/);return{hasSpec:!0,specInfo:{spec_file:s?s[1].trim():"openapi.yaml"},fromConfig:!1,summary:n}}return{hasSpec:!1,specInfo:null,fromConfig:!1,summary:null}}function Qs(e,t,n,o){if(!e.hasSpec)return"";const{specInfo:a,fromConfig:s,summary:r}=e,i=(a==null?void 0:a.spec_file)||"openapi.yaml",c=o,l=`https://github.com/${t}/${n}/blob/${c}/${i}`;return`
        <div class="tab-content" id="api-tab">
            <div class="api-tab-content">
                <!-- Structured Summary Card -->
                <div class="api-summary-card">
                    ${r!=null&&r.title?`
                        <div class="api-summary-title">${m(r.title)}</div>
                    `:""}

                    <div class="api-summary-meta">
                        <span class="api-meta-item">
                            <strong>File:</strong>
                            <code>${m(i)}</code>
                        </span>
                        ${r!=null&&r.openApiVersion?`
                            <span class="api-meta-item">
                                <strong>OpenAPI:</strong> ${m(r.openApiVersion)}
                            </span>
                        `:""}
                        ${r!=null&&r.paths?`
                            <span class="api-meta-item">
                                <strong>Endpoints:</strong> ${r.paths} path${r.paths!==1?"s":""}, ${r.operations} operation${r.operations!==1?"s":""}
                            </span>
                        `:""}
                    </div>

                    <div class="api-actions">
                        <a href="${l}" target="_blank" rel="noopener noreferrer" class="github-link-button">
                            ${P("github")} View on GitHub
                        </a>
                    </div>
                </div>

                <!-- Collapsible Raw Spec -->
                <details class="spec-details" data-repo="${t}/${n}" data-branch="${c}" data-spec-file="${i}">
                    <summary class="spec-summary">View Raw Specification</summary>
                    <div class="spec-content" id="spec-content-${t}-${n}">
                        <div class="spec-loading">Loading specification...</div>
                    </div>
                </details>

                <!-- Environments section (if configured) -->
                ${a!=null&&a.environments?`
                    <h4 class="api-section-header">Environments</h4>
                    <div class="environments-grid">
                        ${Object.entries(a.environments).map(([f,v])=>`
                            <div class="environment-card">
                                <div class="environment-card-name">${m(f)}</div>
                                <div class="environment-card-url">${m(v.base_url)}</div>
                                ${v.description?`<div class="environment-card-description">${m(v.description)}</div>`:""}
                            </div>
                        `).join("")}
                    </div>

                    <div class="api-explorer-section">
                        <button
                            onclick="openApiExplorer('${m(t)}', '${m(n)}')"
                            class="api-explorer-button"
                        >
                            Open API Explorer
                        </button>
                        <p class="environment-card-description">
                            Explore and test the API with an interactive Swagger UI interface
                        </p>
                    </div>
                `:""}

                <!-- Hint when no environments configured -->
                ${s?"":`
                    <p class="environment-card-description api-hint">
                        Configure environments in <code>.scorecard/config.yml</code> to enable the interactive API Explorer.
                    </p>
                `}
            </div>
        </div>
    `}async function Js(e,t,n,o){const a=`spec-content-${e}-${t}`,s=document.getElementById(a);if(!s||s.dataset.loaded==="true")return;const r=`https://raw.githubusercontent.com/${e}/${t}/${n}/${o}`;try{const i=await fetch(r);if(!i.ok)throw new Error(`HTTP ${i.status}`);const c=await i.text();s.innerHTML=`
            <div class="spec-toolbar">
                <button onclick="copySpecContent('${a}')" class="copy-spec-button">
                    Copy
                </button>
            </div>
            <pre class="spec-code"><code id="spec-code-${a}">${m(c)}</code></pre>
        `,s.dataset.loaded="true"}catch(i){s.innerHTML=`
            <div class="spec-error">
                <p>Failed to load spec: ${m(i instanceof Error?i.message:String(i))}</p>
                <a href="${r}" target="_blank" rel="noopener noreferrer" class="spec-error-link">View raw file on GitHub</a>
            </div>
        `}}async function Ys(e){const t=document.getElementById(`spec-code-${e}`);if(t)try{await navigator.clipboard.writeText(t.textContent||"");const n=document.getElementById(e),o=n==null?void 0:n.querySelector(".copy-spec-button");if(o){const a=o.textContent;o.textContent="Copied!",o.classList.add("copied"),setTimeout(()=>{o.textContent=a,o.classList.remove("copied")},2e3)}}catch(n){console.error("Failed to copy:",n)}}function ro(e){const t=e.target;if(t.open){const n=t.dataset.repo,o=t.dataset.branch,a=t.dataset.specFile;if(n&&o&&a){const[s,r]=n.split("/");Js(s,r,o,a)}}}function _o(){document.querySelectorAll(".spec-details").forEach(e=>{e.removeEventListener("toggle",ro),e.addEventListener("toggle",ro)})}typeof window<"u"&&(window.copySpecContent=Ys);function Xs(e){return`
        <div class="tabs-container">
            <button class="tabs-scroll-btn tabs-scroll-left" onclick="scrollTabs('left')" aria-label="Scroll tabs left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab(event, 'checks')">Check Results</button>
                ${Co(e).hasSpec?`<button class="tab-btn" onclick="switchTab(event, 'api')">API Specification</button>`:""}
                ${e.service.links&&e.service.links.length>0?`<button class="tab-btn" onclick="switchTab(event, 'links')">Links</button>`:""}
                ${e.recent_contributors&&e.recent_contributors.length>0?`<button class="tab-btn" onclick="switchTab(event, 'contributors')">Contributors</button>`:""}
                <button class="tab-btn" onclick="switchTab(event, 'workflows')">Workflow Runs</button>
                <button class="tab-btn" onclick="switchTab(event, 'badges')">Badges</button>
            </div>
            <button class="tabs-scroll-btn tabs-scroll-right" onclick="scrollTabs('right')" aria-label="Scroll tabs right">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </div>
    `}function Eo(e,t){var n;document.querySelectorAll(".tab-btn").forEach(o=>o.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(o=>o.classList.remove("active")),e.target.classList.add("active"),(n=document.getElementById(`${t}-tab`))==null||n.classList.add("active"),t==="workflows"&&!window.serviceWorkflowLoaded&&window.loadWorkflowRunsForService()}function Ao(e){const t=document.querySelector(".tabs");if(!t)return;const n=150,o=e==="left"?t.scrollLeft-n:t.scrollLeft+n;t.scrollTo({left:o,behavior:"smooth"})}function io(){const e=document.querySelector(".tabs"),t=document.querySelector(".tabs-scroll-left"),n=document.querySelector(".tabs-scroll-right");if(!e||!t||!n)return;const o=e.scrollLeft,a=e.scrollWidth-e.clientWidth;o>5?t.classList.add("visible"):t.classList.remove("visible"),o<a-5?n.classList.add("visible"):n.classList.remove("visible")}function er(){const e=document.querySelector(".tabs");e&&(e.addEventListener("scroll",io),setTimeout(io,100))}function tr(e){const t={};e.forEach(a=>{const s=a.category||"Other";t[s]||(t[s]=[]),t[s].push(a)});const n=["Scorecards Setup","Documentation","Testing & CI","Configuration & Compliance","Other"],o={};return n.forEach(a=>{const s=Object.keys(t).find(r=>r.toLowerCase()===a.toLowerCase());s&&(o[a]=t[s])}),o}function nr(e){switch(e){case"pass":return"✓";case"excluded":return"⊘";default:return"✗"}}function or(e){const t=e.status==="excluded";return`
        <div class="check-result ${e.status}">
            <div class="check-name">
                ${nr(e.status)} ${m(e.name)}
            </div>
            <div class="check-description">${m(e.description)}</div>
            ${t?`
                <div class="check-excluded-notice">
                    <em>Excluded from scoring</em>
                </div>
            `:""}
            ${e.stdout&&e.stdout.trim()?`
                <div class="check-output">
                    <strong>Output:</strong><br>
                    ${m(e.stdout.trim())}
                </div>
            `:""}
            ${e.stderr&&e.stderr.trim()&&e.status==="fail"?`
                <div class="check-output check-output-error">
                    <strong>Error:</strong><br>
                    ${m(e.stderr.trim())}
                </div>
            `:""}
            <div class="check-meta">
                Weight: ${e.weight} | Duration: ${e.duration}s
            </div>
        </div>
    `}function ar(e){const t=tr(e);return`
        <div class="tab-content active" id="checks-tab">
            <div class="check-categories">
                ${Object.entries(t).map(([n,o])=>{const a=o.filter(c=>c.status==="pass").length,s=o.filter(c=>c.status==="excluded").length,r=o.length-s,i=a===r&&r>0;return`
                        <details class="check-category" open>
                            <summary class="check-category-header">
                                <span class="category-arrow">▼</span>
                                <span class="category-name">${n}</span>
                                <span class="category-stats ${i?"all-passed":"has-failures"}">
                                    ${a}/${r} passed${s>0?` <span class="excluded-count">(${s} excluded)</span>`:""}
                                </span>
                            </summary>
                            <div class="check-category-content">
                                ${o.map(c=>or(c)).join("")}
                            </div>
                        </details>
                    `}).join("")}
            </div>
        </div>
    `}function sr(e){return!e||e.length===0?"":`
        <div class="tab-content" id="links-tab">
            <ul class="link-list">
                ${e.map(t=>`
                    <li class="link-item">
                        <a href="${m(t.url)}" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink: 0; margin-right: 8px;">
                                <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path>
                            </svg>
                            <div class="link-content">
                                <strong class="link-name">${m(t.name)}</strong>
                                ${t.description?`<p class="link-description">${m(t.description)}</p>`:""}
                            </div>
                        </a>
                    </li>
                `).join("")}
            </ul>
        </div>
    `}function rr(e){return!e||e.length===0?"":`
        <div class="tab-content" id="contributors-tab">
            <h4 class="tab-section-header">
                Recent Contributors (Last 20 Commits)
            </h4>
            <p class="tab-section-description" style="margin-bottom: 20px;">
                Contributors who have committed to this repository recently, ordered by commit count.
            </p>
            <div class="contributors-list">
                ${e.map(t=>{const o=`https://www.gravatar.com/avatar/${nn(t.email.toLowerCase().trim())}?d=identicon&s=48`,a=t.email.split("@")[0].replace(/[^a-zA-Z0-9-]/g,""),s=t.email.includes("github")||t.email.includes("users.noreply.github.com");return`
                        <div class="contributor-item">
                            <img src="${o}"
                                 alt="${m(t.name)}"
                                 class="contributor-avatar"
                                 onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=48'"
                            >
                            <div class="contributor-info">
                                <div class="contributor-name">
                                    <strong>${m(t.name)}</strong>
                                    ${s?`<a href="https://github.com/${a}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="contributor-github-link"
                                            title="View GitHub profile">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                            </svg>
                                        </a>`:""}
                                </div>
                                <div class="contributor-email">${m(t.email)}</div>
                                <div class="contributor-meta">
                                    <span class="contributor-commits" title="${t.commit_count} commit${t.commit_count!==1?"s":""}">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;">
                                            <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5h6.792a.25.25 0 0 1 .177.427L6.357 3.143a.25.25 0 0 1-.177.073H1.82a.25.25 0 0 1-.177-.073ZM2.976 7.5A2.5 2.5 0 0 1 0 7.5v-2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v2a2.5 2.5 0 0 1-2.024 0Zm1.524-.5h-3v.25a1.5 1.5 0 0 0 3 0V7ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                                        </svg>
                                        ${t.commit_count} commit${t.commit_count!==1?"s":""}
                                    </span>
                                    <span class="contributor-date" title="${new Date(t.last_commit_date).toLocaleString()}">
                                        Last commit: ${xe(t.last_commit_date)}
                                    </span>
                                    <span class="contributor-hash">
                                        <code>${t.last_commit_hash}</code>
                                    </span>
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `}function ir(){return`
        <div class="tab-content" id="workflows-tab">
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="widget-filters" style="margin: 0;">
                        <button class="widget-filter-btn active" data-status="all" onclick="filterServiceWorkflows('all')">
                            All <span class="filter-count" id="service-filter-count-all">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="in_progress" onclick="filterServiceWorkflows('in_progress')">
                            In Progress <span class="filter-count" id="service-filter-count-in_progress">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="queued" onclick="filterServiceWorkflows('queued')">
                            Queued <span class="filter-count" id="service-filter-count-queued">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="completed" onclick="filterServiceWorkflows('completed')">
                            Completed <span class="filter-count" id="service-filter-count-completed">0</span>
                        </button>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="service-workflow-interval-select" class="widget-interval-select" onchange="changeServicePollingInterval()" title="Auto-refresh interval">
                            <option value="5000">5s</option>
                            <option value="10000">10s</option>
                            <option value="15000">15s</option>
                            <option value="30000" selected>30s</option>
                            <option value="60000">1m</option>
                            <option value="120000">2m</option>
                            <option value="300000">5m</option>
                            <option value="0">Off</option>
                        </select>
                        <button id="service-workflow-refresh" class="widget-refresh-btn" onclick="refreshServiceWorkflowRuns()" title="Refresh" style="padding: 6px 10px;">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div id="service-workflows-content">
                <div class="loading">Click to load workflow runs...</div>
            </div>
        </div>
    `}function cr(e,t){const n=hn();return`
        <div class="tab-content" id="badges-tab">
            <h4 class="tab-section-header">Badge Preview</h4>
            <div class="badge-preview-container">
                <img src="https://img.shields.io/endpoint?url=${n}/badges/${e}/${t}/score.json" alt="Score Badge" style="height: 20px;">
                <img src="https://img.shields.io/endpoint?url=${n}/badges/${e}/${t}/rank.json" alt="Rank Badge" style="height: 20px;">
            </div>

            <h4 class="tab-section-header" style="margin-bottom: 10px;">Add to Your README</h4>
            <p class="tab-section-description">
                Copy the markdown below:
            </p>

            <div style="position: relative; margin-bottom: 15px;">
                <button onclick="copyBadgeCode('score-badge-${e}-${t}', event)" class="copy-button">Copy</button>
                <pre id="score-badge-${e}-${t}" class="badge-code-block">![Score](https://img.shields.io/endpoint?url=${n}/badges/${e}/${t}/score.json)</pre>
            </div>

            <div style="position: relative;">
                <button onclick="copyBadgeCode('rank-badge-${e}-${t}', event)" class="copy-button">Copy</button>
                <pre id="rank-badge-${e}-${t}" class="badge-code-block">![Rank](https://img.shields.io/endpoint?url=${n}/badges/${e}/${t}/rank.json)</pre>
            </div>
        </div>
    `}function Lo(e,t,n,o,a){const s=Co(e),r=e.default_branch||"main";return Zs(e,t,n,e.installed,o)+Us(o,a,t,n)+Vs(e)+Xs(e)+ar(e.checks)+Qs(s,t,n,r)+sr(e.service.links)+rr(e.recent_contributors)+ir()+cr(t,n)}function Io(){const e=localStorage.getItem(Me.SERVICE_WORKFLOW_POLL_INTERVAL);if(e!==null){window.serviceWorkflowPollIntervalTime=parseInt(e);const t=document.getElementById("service-workflow-interval-select");t&&(t.value=e)}}async function Mo(e,t){const n=document.getElementById("service-modal"),o=document.getElementById("service-detail");if(!(!n||!o)){window.currentServiceOrg=e,window.currentServiceRepo=t,window.serviceWorkflowLoaded=!1,n.classList.remove("hidden"),o.innerHTML='<div class="loading">Loading service details...</div>';try{const a=`results/${e}/${t}/results.json`,s=`registry/${e}/${t}.json`,[r,i]=await Promise.all([V(a),V(s)]),c=r.response,l=i.response;if(!c.ok)throw new Error(`Failed to fetch results: ${c.status}`);const f=await c.json();if(l.ok){const d=await l.json();d.installation_pr&&(f.installation_pr=d.installation_pr),d.default_branch&&(f.default_branch=d.default_branch)}const v=j(f,window.currentChecksHash),S=v&&f.installed;o.innerHTML=Lo(f,e,t,v,S),Io(),er(),_o()}catch(a){console.error("Error loading service details:",a),o.innerHTML=`
            <h3>Error Loading Details</h3>
            <p>Could not load details for ${e}/${t}</p>
            <p class="tab-section-description">${a instanceof Error?a.message:String(a)}</p>
        `}}}async function xo(e,t){var r;const n=document.getElementById("modal-refresh-btn");if(!n)return;const o=document.querySelector(".tab-btn.active"),a=o&&((r=o.textContent)==null?void 0:r.trim().toLowerCase().replace(/\s+/g,"-"))||"check-results",s=n.innerHTML;lt(n),n.disabled=!0;try{const i=`results/${e}/${t}/results.json`,c=`registry/${e}/${t}.json`,[l,f]=await Promise.all([V(i),V(c)]),v=l.response,S=f.response;if(!v.ok)throw new Error(`Failed to fetch results: ${v.status}`);const d=await v.json();if(S.ok){const x=await S.json();x.installation_pr&&(d.installation_pr=x.installation_pr),x.default_branch&&(d.default_branch=x.default_branch)}const _=document.getElementById("service-detail");if(!_)return;window.currentServiceOrg=e,window.currentServiceRepo=t;const b=j(d,window.currentChecksHash),M=b&&d.installed;_.innerHTML=Lo(d,e,t,b,M),Io(),_o(),window.showToast("Service data refreshed","success"),setTimeout(()=>{var J;const x=document.querySelectorAll(".tab-btn");for(const F of x)if((((J=F.textContent)==null?void 0:J.trim().toLowerCase().replace(/\s+/g,"-"))||"")===a){F.click();break}},100)}catch(i){console.error("Error refreshing service data:",i),window.showToast(`Failed to refresh service data: ${i instanceof Error?i.message:String(i)}`,"error")}finally{n&&(n.disabled=!1,n.innerHTML=s)}}function Do(){const e=document.getElementById("service-modal");e&&e.classList.add("hidden"),window.serviceWorkflowPollInterval&&(clearInterval(window.serviceWorkflowPollInterval),window.serviceWorkflowPollInterval=null),window.serviceDurationUpdateInterval&&(clearInterval(window.serviceDurationUpdateInterval),window.serviceDurationUpdateInterval=null),window.currentServiceOrg=null,window.currentServiceRepo=null,window.serviceWorkflowRuns=[],window.serviceWorkflowLoaded=!1,window.serviceWorkflowFilterStatus="all"}const lr=Object.freeze(Object.defineProperty({__proto__:null,closeModal:Do,refreshServiceData:xo,scrollTabs:Ao,showServiceDetail:Mo,switchTab:Eo},Symbol.toStringTag,{value:"Module"})),dr=()=>window.currentServiceOrg,ur=()=>window.currentServiceRepo;async function kt(){const e=dr(),t=ur();if(!e||!t)return;if(!T()){const o=document.getElementById("service-workflows-content");if(!o)return;const a=N("--color-link-btn"),s=N("--color-link-btn-hover"),r=N("--color-text-secondary");o.innerHTML=`
            <div class="widget-empty">
                <p style="margin-bottom: 15px;">GitHub Personal Access Token required to view workflow runs.</p>
                <button
                    onclick="openSettings()"
                    style="background: ${a}; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;"
                    onmouseover="this.style.background='${s}'"
                    onmouseout="this.style.background='${a}'">
                    Set GitHub PAT
                </button>
                <p style="margin-top: 10px; font-size: 0.85rem; color: ${r};">
                    Need a PAT with <code>workflow</code> scope to view workflow runs.
                </p>
            </div>
        `;return}const n=document.getElementById("service-workflows-content");if(n){window.serviceWorkflowLoaded||(n.innerHTML='<div class="loading">Loading workflow runs...</div>');try{const o=await fetch(`${G.GITHUB_BASE_URL}/repos/${e}/${t}/actions/runs?per_page=${G.PER_PAGE}&_t=${Date.now()}`,{headers:{Authorization:`token ${T()}`,Accept:G.ACCEPT_HEADER},cache:"no-cache"});if(!o.ok)throw new Error(`Failed to fetch workflow runs: ${o.status}`);const a=await o.json();window.serviceWorkflowRuns=a.workflow_runs.map(s=>({...s,org:e,repo:t})),window.serviceWorkflowLoaded=!0,$t(),St()}catch(o){console.error("Error fetching service workflow runs:",o);const a=N("--color-text-error"),s=N("--color-text-secondary");n.innerHTML=`
            <div class="widget-empty">
                <p style="color: ${a}; margin-bottom: 10px;">Error loading workflow runs</p>
                <p style="font-size: 0.9rem; color: ${s};">${m(o instanceof Error?o.message:String(o))}</p>
            </div>
        `}}}function St(){window.serviceWorkflowPollInterval&&(clearInterval(window.serviceWorkflowPollInterval),window.serviceWorkflowPollInterval=null),window.serviceWorkflowPollIntervalTime>0&&T()&&(window.serviceWorkflowPollInterval=setInterval(()=>{kt()},window.serviceWorkflowPollIntervalTime))}function Oo(){const e=document.getElementById("service-workflow-interval-select");if(!e)return;const t=parseInt(e.value);if(localStorage.setItem(Me.SERVICE_WORKFLOW_POLL_INTERVAL,String(t)),window.serviceWorkflowPollIntervalTime=t,St(),t===0)y("Auto-refresh disabled. Use refresh button for manual updates.","info");else{const n=ct(t);y(`Auto-refresh set to ${n}`,"success")}}async function Po(){const e=document.getElementById("service-workflow-refresh");if(e){lt(e),window.serviceWorkflowLoaded=!1;try{await kt(),y("Workflow runs refreshed","success")}catch{y("Failed to refresh workflow runs","error")}finally{on(e)}}}function $t(){const e=document.getElementById("service-workflows-content");if(!e)return;let t=window.serviceWorkflowRuns;if(window.serviceWorkflowFilterStatus!=="all"&&(t=window.serviceWorkflowRuns.filter(n=>n.status===window.serviceWorkflowFilterStatus)),wn(),t.length===0){const n=window.serviceWorkflowFilterStatus==="all"?"":window.serviceWorkflowFilterStatus.replace("_"," ");e.innerHTML=`
            <div class="widget-empty">
                <p>No ${n} workflow runs found</p>
            </div>
        `;return}e.innerHTML=t.map(n=>dn(n)).join(""),(window.serviceWorkflowFilterStatus==="all"||window.serviceWorkflowFilterStatus==="in_progress")&&vn()}function wn(){const e=window.serviceWorkflowRuns.length,t=window.serviceWorkflowRuns.filter(s=>s.status==="in_progress").length,n=window.serviceWorkflowRuns.filter(s=>s.status==="queued").length,o=window.serviceWorkflowRuns.filter(s=>s.status==="completed").length,a=(s,r)=>{const i=document.getElementById(s);i&&(i.textContent=String(r))};a("service-filter-count-all",e),a("service-filter-count-in_progress",t),a("service-filter-count-queued",n),a("service-filter-count-completed",o)}function Bo(e){window.serviceWorkflowFilterStatus=e;const t=document.getElementById("workflows-tab");if(t){t.querySelectorAll(".widget-filter-btn").forEach(o=>{o.classList.remove("active")});const n=t.querySelector(`[data-status="${e}"]`);n&&n.classList.add("active")}$t()}function vn(){window.serviceDurationUpdateInterval&&clearInterval(window.serviceDurationUpdateInterval),window.serviceDurationUpdateInterval=setInterval(()=>{const e=document.getElementById("service-workflows-content");if(!e){window.serviceDurationUpdateInterval&&clearInterval(window.serviceDurationUpdateInterval);return}e.querySelectorAll(".widget-run-duration").forEach(n=>{const o=n.dataset.started,a=n.dataset.status;if(o){const s=new Date(o),i=new Date().getTime()-s.getTime(),c=Z(i),l=a==="in_progress"?"Running for":a==="queued"?"Queued":"Completed";n.textContent=`${l} ${c}`}})},1e3)}const mr=Object.freeze(Object.defineProperty({__proto__:null,changeServicePollingInterval:Oo,filterServiceWorkflows:Bo,loadWorkflowRunsForService:kt,refreshServiceWorkflowRuns:Po,renderServiceWorkflowRuns:$t,startServiceLiveDurationUpdates:vn,startServiceWorkflowPolling:St,updateServiceFilterCounts:wn},Symbol.toStringTag,{value:"Module"}));let Ft=!1,ee=[],se="all",re=null,qt=0,Ce=me.POLLING_ACTIVE;const fr=me.CACHE_MEDIUM;function Ro(){const e=localStorage.getItem(Me.WIDGET_POLL_INTERVAL);if(e!==null){Ce=parseInt(e);const n=document.getElementById("widget-interval-select");n&&(n.value=e)}const t=document.getElementById("widget-actions-link");t&&(t.href=`https://github.com/${de()}/${ue()}/actions`),T()&&Re()}function Ho(){Ft=!Ft;const e=document.getElementById("widget-sidebar"),t=document.getElementById("widget-toggle");Ft?(e==null||e.classList.add("open"),t==null||t.classList.add("active"),T()&&ge()):(e==null||e.classList.remove("open"),t==null||t.classList.remove("active"))}function Re(){if(re&&(clearInterval(re),re=null),ge(),Ce===0){console.log("Widget auto-refresh disabled by user preference");return}re=setInterval(()=>{ge()},Ce),console.log(`Widget polling started with ${Ce}ms interval`)}function bn(){re&&(clearInterval(re),re=null)}async function ge(){if(!T()){zt("no-pat");return}const e=Date.now();if(e-qt<fr&&ee.length>0){console.log("Using cached workflow runs");return}try{const t=await fetch(`${G.GITHUB_BASE_URL}/repos/${de()}/${ue()}/actions/runs?per_page=${G.PER_PAGE}&_t=${Date.now()}`,{headers:{Authorization:`token ${T()}`,Accept:G.ACCEPT_HEADER},cache:"no-cache"});if(!t.ok)throw new Error(`Failed to fetch workflow runs: ${t.status}`);const o=(await t.json()).workflow_runs.map(s=>({...s,org:de(),repo:ue(),service_name:"Scorecards"})),a=new Date(Date.now()-24*60*60*1e3);ee=o.filter(s=>new Date(s.created_at)>a).sort((s,r)=>new Date(r.created_at).getTime()-new Date(s.created_at).getTime()),qt=e,Tt(),Ct()}catch(t){console.error("Error fetching workflow runs:",t),zt("error",t instanceof Error?t.message:String(t))}}function Tt(){const e=document.getElementById("widget-badge");if(!e)return;const t=ee.filter(n=>n.status==="in_progress"||n.status==="queued");e.textContent=String(t.length),e.style.display=t.length>0?"flex":"none"}function Ct(){const e=document.getElementById("widget-content");if(!e)return;let t=ee;if(se!=="all"&&(t=ee.filter(n=>n.status===se)),vr(),t.length===0){e.innerHTML=`
            <div class="widget-empty">
                <p>No ${se==="all"?"":se} workflow runs in the last 24 hours</p>
            </div>
        `;return}e.innerHTML=t.map(n=>pr(n)).join(""),(se==="all"||se==="in_progress")&&wr()}function pr(e){const t=e.status==="completed"?e.conclusion==="success"?"success":e.conclusion==="failure"?"failure":"neutral":e.status,n=gr(e.status,e.conclusion||null),o=hr(e);return`
        <div class="widget-run-item" data-run-id="${e.id}">
            <div class="widget-run-header">
                <span class="widget-run-status status-${t}">${n}</span>
                <div class="widget-run-info">
                    <div class="widget-run-name">${m(e.name)}</div>
                    <div class="widget-run-repo">${m(e.org||"")}/${m(e.repo||"")}</div>
                </div>
            </div>
            <div class="widget-run-meta">
                <span class="widget-run-duration" data-started="${e.run_started_at||e.created_at}" data-status="${e.status}">
                    ${o.label} ${o.time}
                </span>
                <a href="${e.html_url}" target="_blank" rel="noopener noreferrer" class="widget-run-link" onclick="event.stopPropagation()">
                    View
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                    </svg>
                </a>
            </div>
        </div>
    `}function gr(e,t){return e==="in_progress"?'<span class="spinner-small"></span>':e==="queued"?"⏳":e==="completed"?t==="success"?"✓":t==="failure"?"✗":t==="cancelled"?"⊘":"●":"●"}function hr(e){const t=new Date;if(e.status==="completed"){const n=new Date(e.updated_at),o=t.getTime()-n.getTime();return{label:"Completed",time:Z(o)}}else if(e.status==="in_progress"){const n=new Date(e.run_started_at||e.created_at),o=t.getTime()-n.getTime();return{label:"Running for",time:Z(o)}}else{const n=new Date(e.created_at),o=t.getTime()-n.getTime();return{label:"Queued",time:Z(o)}}}function wr(){setInterval(()=>{document.querySelectorAll(".widget-run-duration").forEach(t=>{const n=t.dataset.started,o=t.dataset.status;if(n){const a=new Date(n),r=new Date().getTime()-a.getTime(),i=Z(r),c=o==="in_progress"?"Running for":o==="queued"?"Queued":"Completed";t.textContent=`${c} ${i}`}})},1e3)}function vr(){const e=ee.length,t=ee.filter(s=>s.status==="in_progress").length,n=ee.filter(s=>s.status==="queued").length,o=ee.filter(s=>s.status==="completed").length,a=(s,r)=>{const i=document.getElementById(s);i&&(i.textContent=String(r))};a("count-all",e),a("count-running",t),a("count-queued",n),a("count-completed",o)}function jo(e){var t;se=e,document.querySelectorAll(".widget-filter-btn").forEach(n=>{n.classList.remove("active")}),(t=document.querySelector(`[data-status="${e}"]`))==null||t.classList.add("active"),Ct()}async function Fo(){const e=document.getElementById("widget-refresh");e==null||e.classList.add("spinning"),qt=0,await ge(),setTimeout(()=>{e==null||e.classList.remove("spinning")},500),y("GitHub Actions refreshed","success")}function Wo(){const e=document.getElementById("widget-interval-select");if(!e)return;const t=parseInt(e.value);if(localStorage.setItem(Me.WIDGET_POLL_INTERVAL,String(t)),Ce=t,T()&&Re(),t===0)y("Auto-refresh disabled. Use refresh button for manual updates.","info");else{const n=ct(t);y(`Auto-refresh set to ${n}`,"success")}}function zt(e,t=""){const n=document.getElementById("widget-content");if(!n)return;e==="no-pat"?n.innerHTML=`
            <div class="widget-empty">
                <p>Configure GitHub PAT in settings to view workflow runs</p>
                <button onclick="openSettings()" class="widget-empty-btn">Open Settings</button>
            </div>
        `:e==="error"&&(n.innerHTML=`
            <div class="widget-empty">
                <p>Error loading workflow runs</p>
                <p class="widget-error-msg">${m(t)}</p>
            </div>
        `),Tt();const o=a=>{const s=document.getElementById(a);s&&(s.textContent="0")};o("count-all"),o("count-running"),o("count-queued"),o("count-completed")}function yn(){T()&&Re()}function kn(){bn(),zt("no-pat")}const br=Object.freeze(Object.defineProperty({__proto__:null,changePollingInterval:Wo,fetchWorkflowRuns:ge,filterActions:jo,handlePATCleared:kn,handlePATSaved:yn,initializeActionsWidget:Ro,refreshActionsWidget:Fo,renderWidgetContent:Ct,startWidgetPolling:Re,stopWidgetPolling:bn,toggleActionsWidget:Ho,updateWidgetBadge:Tt},Symbol.toStringTag,{value:"Module"}));function Sn(){const e=document.getElementById("settings-modal");e==null||e.classList.remove("hidden"),He(),je()}function No(){const e=document.getElementById("settings-modal");e==null||e.classList.add("hidden")}async function $n(e){try{return(await fetch("https://api.github.com/user",{headers:{Authorization:`token ${e}`,Accept:"application/vnd.github.v3+json"}})).ok}catch(t){return console.error("Error testing PAT:",t),!1}}async function qo(){const e=document.getElementById("github-pat-input"),t=e==null?void 0:e.value.trim();if(!t){y("Please enter a valid PAT","error");return}y("Validating token...","info"),await $n(t)?(pt(t),_t(),He(),yn(),y("PAT saved successfully! Using GitHub API mode.","success"),je()):y("Invalid PAT. Please check and try again.","error")}function zo(){ye();const e=document.getElementById("github-pat-input");e&&(e.value=""),_t(),He(),kn(),y("PAT cleared. Using public CDN mode.","info"),je()}function _t(){const e=document.getElementById("settings-btn"),t=document.querySelector(".unlocked-icon"),n=document.querySelector(".locked-icon");T()?(e==null||e.classList.add("has-token"),t&&(t.style.display="none"),n&&(n.style.display="block"),e==null||e.setAttribute("title","Settings (PAT loaded)"),e==null||e.setAttribute("aria-label","Settings (PAT loaded)")):(e==null||e.classList.remove("has-token"),t&&(t.style.display="block"),n&&(n.style.display="none"),e==null||e.setAttribute("title","Settings"),e==null||e.setAttribute("aria-label","Settings"))}function He(){const e=document.getElementById("mode-indicator"),t=document.querySelector(".current-mode");T()?(e&&(e.textContent="GitHub API (fast, authenticated)"),t==null||t.classList.add("api-mode")):(e&&(e.textContent="Public CDN (slower, no rate limits)"),t==null||t.classList.remove("api-mode"))}async function je(){try{const e=T(),t=e?{Authorization:`token ${e}`}:{},o=await(await fetch("https://api.github.com/rate_limit",{headers:t})).json(),a=(s,r)=>{const i=document.getElementById(s);i&&(i.textContent=String(r))};a("rate-limit-remaining",o.rate.remaining),a("rate-limit-limit",o.rate.limit),a("rate-limit-reset",new Date(o.rate.reset*1e3).toLocaleTimeString()),o.rate.remaining<10&&y("Warning: Low rate limit remaining!","warning")}catch(e){console.error("Error checking rate limit:",e);const t=(n,o)=>{const a=document.getElementById(n);a&&(a.textContent=o)};t("rate-limit-remaining","Error"),t("rate-limit-limit","-"),t("rate-limit-reset","-")}}const yr=Object.freeze(Object.defineProperty({__proto__:null,checkRateLimit:je,clearPAT:zo,closeSettings:No,openSettings:Sn,savePAT:qo,testPAT:$n,updateModeIndicator:He,updateWidgetState:_t},Symbol.toStringTag,{value:"Module"}));function Et(){const e=window.allServices||allServices,t=window.currentChecksHash??currentChecksHash,n=e.length,o=De(e),a=ve(e),s=e.filter(l=>l.has_api).length,r=e.filter(l=>j(l,t)).length,i=e.filter(l=>l.installed).length,c=(l,f)=>{const v=document.getElementById(l);v&&(v.textContent=String(f))};c("total-services",n),c("avg-score",o),c("api-count",s),c("stale-count",r),c("installed-count",i),c("platinum-count",a.platinum),c("gold-count",a.gold),c("silver-count",a.silver),c("bronze-count",a.bronze)}const kr=Object.freeze(Object.defineProperty({__proto__:null,updateStats:Et},Symbol.toStringTag,{value:"Module"}));function At(e,t="Loading..."){if(!e)return;e.disabled=!0,e.dataset.originalHTML=e.innerHTML,e.dataset.originalTitle=e.title||"";const n=e.querySelector("svg");n&&n.classList.add("spinning"),e.title=t}function Tn(e,t,n=me.BUTTON_STATE_DURATION){return e?(e.dataset.originalHTML||(e.dataset.originalHTML=e.innerHTML,e.dataset.originalTitle=e.title||""),e.dataset.originalBackground=e.style.background||"",e.dataset.originalColor=e.style.color||"",e.innerHTML=P("checkmark"),e.style.background=N("--color-success-btn"),e.style.color="white",e.title=t,new Promise(o=>{setTimeout(()=>{K(e),o()},n)})):Promise.resolve()}function nt(e,t,n=me.BUTTON_STATE_DURATION){return e?(e.dataset.originalHTML||(e.dataset.originalHTML=e.innerHTML,e.dataset.originalTitle=e.title||""),e.dataset.originalBackground=e.style.background||"",e.dataset.originalColor=e.style.color||"",e.innerHTML=P("xMark"),e.style.background=N("--color-error-btn"),e.style.color="white",e.title=t,new Promise(o=>{setTimeout(()=>{K(e),o()},n)})):Promise.resolve()}function K(e){if(!e)return;e.disabled=!1,e.dataset.originalHTML&&(e.innerHTML=e.dataset.originalHTML,delete e.dataset.originalHTML),e.dataset.originalTitle!==void 0&&(e.title=e.dataset.originalTitle,delete e.dataset.originalTitle),e.style.background=e.dataset.originalBackground||"",e.style.color=e.dataset.originalColor||"";const t=e.querySelector("svg");t&&t.classList.remove("spinning")}const Sr=Object.freeze(Object.defineProperty({__proto__:null,resetButton:K,setButtonError:nt,setButtonLoading:At,setButtonSuccess:Tn},Symbol.toStringTag,{value:"Module"}));let O=new Set,Cn=[],R=!1,Ut=null;function _n(e,t){Ut=t,Cn=Oe(e),O.clear(),R=!1,Lt()}function En(e){Cn=Oe(e),Lt()}function Lt(){const e=document.getElementById("team-filter-container");if(!e)return;const t=O.size+(R?1:0),n=t>0;e.innerHTML=`
        <div class="team-filter-dropdown">
            <button class="team-filter-toggle ${n?"active":""}" onclick="window.toggleTeamDropdown()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75h-3A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM7 6.75A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path>
                </svg>
                Teams${n?` (${t})`:""}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-left: 6px;">
                    <path d="M4.427 7.427a.75.75 0 0 1 1.06 0L8 9.94l2.513-2.513a.75.75 0 0 1 1.06 1.06l-3.043 3.043a.75.75 0 0 1-1.06 0L4.427 8.487a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </button>
            <div class="team-dropdown-menu" id="team-dropdown-menu">
                <div class="team-dropdown-header">
                    <span>Filter by Team</span>
                    ${n?'<button class="team-clear-btn" onclick="window.clearTeamFilter(event)">Clear</button>':""}
                </div>
                <div class="team-dropdown-search">
                    <input type="text" placeholder="Search teams..." id="team-search-input" oninput="window.filterTeamOptions(this.value)">
                </div>
                <div class="team-dropdown-options" id="team-dropdown-options">
                    <label class="team-option ${R?"selected":""}">
                        <input type="checkbox" ${R?"checked":""} onchange="window.toggleNoTeamFilter(this.checked)">
                        <span class="team-name no-team">No Team Assigned</span>
                    </label>
                    ${Cn.map(o=>`
                        <label class="team-option ${O.has(o)?"selected":""}" data-team="${o}">
                            <input type="checkbox" ${O.has(o)?"checked":""} onchange="window.toggleTeamSelection('${o}', this.checked)">
                            <span class="team-name">${o}</span>
                        </label>
                    `).join("")}
                </div>
            </div>
        </div>
    `}function Uo(){const e=document.getElementById("team-dropdown-menu");if(e)if(e.classList.toggle("open"),e.classList.contains("open")){const t=document.getElementById("team-search-input");t&&t.focus(),setTimeout(()=>{document.addEventListener("click",Gt)},0)}else document.removeEventListener("click",Gt)}function Gt(e){const t=document.querySelector(".team-filter-dropdown");if(t&&!t.contains(e.target)){const n=document.getElementById("team-dropdown-menu");n&&n.classList.remove("open"),document.removeEventListener("click",Gt)}}function Go(e,t){t?O.add(e):O.delete(e),$r(e,t),An(),Fe()}function Zo(e){R=e,An(),Fe()}function $r(e,t){const n=document.querySelector(`.team-option[data-team="${e}"]`);n&&n.classList.toggle("selected",t)}function An(){const e=document.querySelector(".team-filter-toggle"),t=O.size+(R?1:0);e&&(e.classList.toggle("active",t>0),e.innerHTML=e.innerHTML.replace(/Teams(\s*\(\d+\))?/,`Teams${t>0?` (${t})`:""}`));const n=document.querySelector(".team-dropdown-header");if(n){const o=n.querySelector(".team-clear-btn");if(t>0&&!o){const a=document.createElement("button");a.className="team-clear-btn",a.textContent="Clear",a.onclick=s=>window.clearTeamFilter(s),n.appendChild(a)}else t===0&&o&&o.remove()}}function Vo(e){const t=document.querySelectorAll(".team-option"),n=e.toLowerCase();t.forEach(o=>{var r;const a=o.querySelector(".team-name"),s=((r=a==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"";o.style.display=s.includes(n)?"":"none"})}function Ln(e){e&&e.stopPropagation(),O.clear(),R=!1,document.querySelectorAll('#team-dropdown-options input[type="checkbox"]').forEach(n=>{var o;n.checked=!1,(o=n.closest(".team-option"))==null||o.classList.remove("selected")}),An(),Fe()}function Fe(){Ut&&Ut({teams:Array.from(O),includeNoTeam:R})}function Tr(){return{teams:Array.from(O),includeNoTeam:R}}function Cr(e,t=!1){O=new Set(e),R=t,Lt(),Fe()}function In(e){return O.size>0||R?e.filter(n=>{const o=B(n);return o?O.has(o):R}):e}function It(e){O.clear(),R=!1,e&&O.add(e),Lt(),Fe()}window.toggleTeamDropdown=Uo;window.toggleTeamSelection=Go;window.toggleNoTeamFilter=Zo;window.filterTeamOptions=Vo;window.clearTeamFilter=Ln;window.selectTeam=It;const _r=Object.freeze(Object.defineProperty({__proto__:null,clearTeamFilter:Ln,filterByTeam:In,filterTeamOptions:Vo,getTeamFilterState:Tr,initTeamFilter:_n,selectTeam:It,setTeamFilterState:Cr,toggleNoTeamFilter:Zo,toggleTeamDropdown:Uo,toggleTeamSelection:Go,updateTeamFilter:En},Symbol.toStringTag,{value:"Module"}));let at=[],st=null,D={by:"serviceCount",direction:"desc"},Se="",Mn=null,Ko=null;const Mt="team-dashboard-modal";function xn(e){Ko=e,be(Mt)}async function Dn(e,t){at=e,Mn=t;try{const{teams:n}=await yt();st=n}catch(n){console.error("Failed to load teams:",n),st=null}oe(Mt),Dt()}function xt(){te(Mt)}function Dt(){const e=document.getElementById("team-dashboard-content");if(!e)return;const t=Pe(at,Ko,Mn),n=st?an(st,t):Object.fromEntries(Object.entries(t).map(([l,f])=>[l.toLowerCase().replace(/\s+/g,"-"),{id:l.toLowerCase().replace(/\s+/g,"-"),name:l,description:null,aliases:[],metadata:{},statistics:f}]));let o=Object.values(n);if(Se){const l=Se.toLowerCase();o=o.filter(f=>{var v,S;return f.name.toLowerCase().includes(l)||((v=f.description)==null?void 0:v.toLowerCase().includes(l))||((S=f.aliases)==null?void 0:S.some(d=>d.toLowerCase().includes(l)))})}const a=o.map(l=>({...l,...l.statistics}));o=po(a,D.by,D.direction).map(l=>o.find(f=>f.id===l.id));const r=Object.values(t).reduce((l,f)=>l+f.serviceCount,0),i=Object.keys(t).length,c=at.filter(l=>!l.team).length;e.innerHTML=`
        <div class="team-dashboard-header">
            <div class="team-dashboard-summary">
                <div class="summary-stat">
                    <span class="summary-value">${i}</span>
                    <span class="summary-label">Teams</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-value">${r}</span>
                    <span class="summary-label">Services with Team</span>
                </div>
                ${c>0?`
                <div class="summary-stat warning">
                    <span class="summary-value">${c}</span>
                    <span class="summary-label">Without Team</span>
                </div>
                `:""}
            </div>
            <div class="team-dashboard-controls">
                <input
                    type="text"
                    class="team-search"
                    placeholder="Search teams..."
                    value="${Se}"
                    oninput="window.searchTeamsDashboard(this.value)"
                >
                <select class="team-sort-select" onchange="window.sortTeamsDashboard(this.value)">
                    <option value="serviceCount-desc" ${D.by==="serviceCount"&&D.direction==="desc"?"selected":""}>Services: High to Low</option>
                    <option value="serviceCount-asc" ${D.by==="serviceCount"&&D.direction==="asc"?"selected":""}>Services: Low to High</option>
                    <option value="averageScore-desc" ${D.by==="averageScore"&&D.direction==="desc"?"selected":""}>Score: High to Low</option>
                    <option value="averageScore-asc" ${D.by==="averageScore"&&D.direction==="asc"?"selected":""}>Score: Low to High</option>
                    <option value="name-asc" ${D.by==="name"&&D.direction==="asc"?"selected":""}>Name: A to Z</option>
                    <option value="name-desc" ${D.by==="name"&&D.direction==="desc"?"selected":""}>Name: Z to A</option>
                </select>
                <button class="team-create-btn" onclick="window.openCreateTeamModal && window.openCreateTeamModal()" title="Create new team">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
                    </svg>
                    Create Team
                </button>
            </div>
        </div>

        <div class="team-cards-grid">
            ${o.length===0?`
                <div class="team-empty-state">
                    ${Se?"No teams match your search.":"No teams found."}
                </div>
            `:o.map(l=>Er(l)).join("")}
        </div>
    `}function Er(e){var a;const t=e.statistics,n=go(t.rankDistribution),o=t.serviceCount>0?Math.round(t.installedCount/t.serviceCount*100):0;return`
        <div class="team-card" data-team-id="${e.id}">
            <div class="team-card-header">
                <h3 class="team-card-name">${e.name}</h3>
                ${(a=e.metadata)!=null&&a.slack_channel?`
                    <span class="team-slack" title="Slack channel">${e.metadata.slack_channel}</span>
                `:""}
            </div>

            ${e.description?`
                <p class="team-card-description">${e.description}</p>
            `:""}

            <div class="team-card-stats">
                <div class="team-stat">
                    <span class="team-stat-value">${t.serviceCount}</span>
                    <span class="team-stat-label">Services</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${t.averageScore}</span>
                    <span class="team-stat-label">Avg Score</span>
                </div>
                ${t.staleCount>0?`
                <div class="team-stat warning">
                    <span class="team-stat-value">${t.staleCount}</span>
                    <span class="team-stat-label">Stale</span>
                </div>
                `:""}
            </div>

            ${n?`
                <div class="team-card-ranks">
                    ${Ar(t.rankDistribution)}
                </div>
            `:""}

            <div class="team-card-progress">
                <div class="progress-label">
                    <span>Installed</span>
                    <span>${t.installedCount}/${t.serviceCount} (${o}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${o}%"></div>
                </div>
            </div>

            <div class="team-card-actions">
                <button class="team-filter-btn" onclick="window.filterCatalogByTeam('${e.name}')">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
                    </svg>
                    Filter
                </button>
                <button class="team-edit-btn" onclick="window.openTeamEditModal && window.openTeamEditModal('${e.id}')" title="Edit team">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
                    </svg>
                    Edit
                </button>
            </div>
        </div>
    `}function Ar(e){return["platinum","gold","silver","bronze"].filter(n=>e[n]>0).map(n=>`
            <span class="mini-rank-badge rank-${n}">${e[n]}</span>
        `).join("")}function Qo(e){Se=e,Dt()}function Jo(e){const[t,n]=e.split("-");D={by:t,direction:n},Dt()}function Yo(e){xt(),It(e)}function Xo(e,t){at=e,Mn=t;const n=document.getElementById(Mt);n&&!n.classList.contains("hidden")&&Dt()}window.searchTeamsDashboard=Qo;window.sortTeamsDashboard=Jo;window.filterCatalogByTeam=Yo;window.openTeamDashboard=Dn;window.closeTeamDashboard=xt;const Lr=Object.freeze(Object.defineProperty({__proto__:null,closeTeamDashboard:xt,filterCatalogByTeam:Yo,initTeamDashboard:xn,openTeamDashboard:Dn,searchTeamsDashboard:Qo,sortTeamsDashboard:Jo,updateDashboardServices:Xo},Symbol.toStringTag,{value:"Module"})),he="team-edit-modal";let z=null,U=!1,Zt=null;function ea(e){Zt=e,On(),be(he)}function On(){if(document.getElementById(he))return;const e=`
        <div id="${he}" class="modal hidden">
            <div class="modal-content team-edit-modal-content">
                <div class="modal-header">
                    <h2 id="team-edit-title">Edit Team</h2>
                    <button class="modal-close" onclick="window.closeTeamEditModal()">&times;</button>
                </div>
                <div class="modal-body" id="team-edit-body">
                    <!-- Form rendered dynamically -->
                </div>
            </div>
        </div>
    `;document.body.insertAdjacentHTML("beforeend",e)}async function Pn(e){if(!ft()){y("GitHub PAT required to edit teams. Please configure in Settings.","error");return}On(),U=!1;try{const n=await To(e);if(!n)throw new Error("Team not found");z={id:n.id||e,name:n.name||"",description:n.description||"",aliases:n.aliases||[],metadata:n.metadata||{}}}catch(n){console.error("Failed to load team:",n),y(`Failed to load team: ${n instanceof Error?n.message:String(n)}`,"error");return}const t=document.getElementById("team-edit-title");t&&(t.textContent="Edit Team"),oe(he),ta()}function Bn(){if(!ft()){y("GitHub PAT required to create teams. Please configure in Settings.","error");return}On(),U=!0,z={id:"",name:"",description:"",aliases:[],metadata:{}};const e=document.getElementById("team-edit-title");e&&(e.textContent="Create Team"),oe(he),ta()}function Ot(){te(he),z=null}function ta(){var n,o;const e=document.getElementById("team-edit-body");if(!e||!z)return;const t=z.aliases?z.aliases.join(", "):"";e.innerHTML=`
        <form id="team-edit-form" class="team-edit-form" onsubmit="window.submitTeamEdit(event)">
            <div class="form-group">
                <label for="team-id">Team ID</label>
                <input
                    type="text"
                    id="team-id"
                    name="team_id"
                    value="${m(z.id||"")}"
                    ${U?"":"readonly"}
                    placeholder="e.g., platform-engineering"
                    pattern="^[a-z0-9-]+$"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                >
                ${U?'<small class="form-hint">Lowercase letters, numbers, and hyphens only</small>':""}
            </div>

            <div class="form-group">
                <label for="team-name">Display Name</label>
                <input
                    type="text"
                    id="team-name"
                    name="name"
                    value="${m(z.name||"")}"
                    placeholder="e.g., Platform Engineering"
                    required
                >
            </div>

            <div class="form-group">
                <label for="team-description">Description</label>
                <textarea
                    id="team-description"
                    name="description"
                    rows="3"
                    placeholder="Brief description of the team's responsibilities"
                >${m(z.description||"")}</textarea>
            </div>

            <div class="form-group">
                <label for="team-aliases">Aliases</label>
                <input
                    type="text"
                    id="team-aliases"
                    name="aliases"
                    value="${m(t)}"
                    placeholder="e.g., platform, plat-eng (comma-separated)"
                >
                <small class="form-hint">Alternative names that map to this team (comma-separated)</small>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="team-slack">Slack Channel</label>
                    <input
                        type="text"
                        id="team-slack"
                        name="slack_channel"
                        value="${m(((n=z.metadata)==null?void 0:n.slack_channel)||"")}"
                        placeholder="#platform-eng"
                    >
                </div>

                <div class="form-group">
                    <label for="team-oncall">On-Call Rotation</label>
                    <input
                        type="text"
                        id="team-oncall"
                        name="oncall_rotation"
                        value="${m(((o=z.metadata)==null?void 0:o.oncall_rotation)||"")}"
                        placeholder="platform-oncall"
                    >
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="window.closeTeamEditModal()">
                    Cancel
                </button>
                <button type="submit" class="btn-primary" id="team-save-btn">
                    ${U?"Create Team":"Save Changes"}
                </button>
            </div>
        </form>

        <div class="team-edit-info">
            <p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
                </svg>
                Changes are submitted via GitHub workflow and may take a few moments to appear.
            </p>
        </div>
    `}function na(){if(!U)return;const e=document.getElementById("team-name"),t=document.getElementById("team-id");e&&t&&!t.value&&(t.value=e.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))}async function oa(e){e.preventDefault();const t=e.target,n=document.getElementById("team-save-btn"),o=new FormData(t),a=o.get("team_id"),s=o.get("name"),r=o.get("description"),i=o.get("aliases"),c=o.get("slack_channel"),l=o.get("oncall_rotation");if(!a||!a.match(/^[a-z0-9-]+$/)){y("Team ID must be lowercase letters, numbers, and hyphens only","error");return}if(!s){y("Display name is required","error");return}n&&(n.disabled=!0,n.innerHTML='<span class="spinner"></span> Saving...');try{await Ir({team_id:a,action:U?"create":"update",name:s,description:r,aliases:i,slack_channel:c,oncall_rotation:l}),y(U?`Team "${s}" creation workflow triggered. Changes will appear shortly.`:`Team "${s}" update workflow triggered. Changes will appear shortly.`,"success"),Ot(),Zt&&Zt(a,U)}catch(f){console.error("Failed to update team:",f),y(`Failed to ${U?"create":"update"} team: ${f instanceof Error?f.message:String(f)}`,"error")}finally{n&&(n.disabled=!1,n.innerHTML=U?"Create Team":"Save Changes")}}async function Ir(e){const t=T();if(!t)throw new Error("GitHub PAT required");const n=Mr(),o=xr(),s=`${G.GITHUB_BASE_URL}/repos/${n}/${o}/actions/workflows/update-team-registry.yml/dispatches`,r={team_id:e.team_id,action:e.action};e.name&&(r.name=e.name),e.description&&(r.description=e.description),e.aliases&&(r.aliases=e.aliases),e.slack_channel&&(r.slack_channel=e.slack_channel),e.oncall_rotation&&(r.oncall_rotation=e.oncall_rotation);const i=await fetch(s,{method:"POST",headers:{Authorization:`token ${t}`,Accept:"application/vnd.github.v3+json","Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:r})});if(!i.ok){const c=await i.text();let l=`HTTP ${i.status}`;if(i.status===404)l="Workflow not found or insufficient permissions";else if(i.status===403)l="PAT does not have workflow dispatch permissions";else if(c)try{l=JSON.parse(c).message||l}catch{l=c}throw new Error(l)}}function Mr(){var o;const t=window.location.hostname.match(/^([^.]+)\.github\.io$/);if(t)return t[1];const n=(o=document.querySelector('meta[name="github-repo-owner"]'))==null?void 0:o.content;return n||localStorage.getItem("scorecards-repo-owner")||"openscorecard"}function xr(){var o;const t=window.location.pathname.split("/").filter(Boolean);if(t.length>0&&t[0]!=="index.html")return t[0];const n=(o=document.querySelector('meta[name="github-repo-name"]'))==null?void 0:o.content;return n||localStorage.getItem("scorecards-repo-name")||"scorecards"}window.openTeamEditModal=Pn;window.openCreateTeamModal=Bn;window.closeTeamEditModal=Ot;window.submitTeamEdit=oa;window.autoGenerateTeamId=na;const Dr=Object.freeze(Object.defineProperty({__proto__:null,autoGenerateTeamId:na,closeTeamEditModal:Ot,initTeamEditModal:ea,openCreateTeamModal:Bn,openTeamEditModal:Pn,submitTeamEdit:oa},Symbol.toStringTag,{value:"Module"}));async function We(e,t={}){const n=T(),o={Accept:G.ACCEPT_HEADER,...t.headers};return n&&(o.Authorization=`token ${n}`),await fetch(`${G.GITHUB_BASE_URL}${e}`,{...t,headers:o})}async function aa(){try{const t=await(await We("/rate_limit")).json();return{remaining:t.rate.remaining,limit:t.rate.limit,reset:new Date(t.rate.reset*1e3)}}catch(e){return console.error("Error checking rate limit:",e),{remaining:null,limit:null,reset:null,error:e instanceof Error?e.message:String(e)}}}async function sa(e,t,n={}){const o=n.per_page||G.PER_PAGE,a=`/repos/${e}/${t}/actions/runs?per_page=${o}&_t=${Date.now()}`;try{const s=await We(a,{cache:"no-cache"});if(!s.ok)throw new Error(`Failed to fetch workflow runs: ${s.status}`);return(await s.json()).workflow_runs.map(i=>({...i,org:e,repo:t}))}catch(s){throw console.error(`Error fetching workflow runs for ${e}/${t}:`,s),s}}async function Pt(e,t,n,o={},a="main"){const s=T();if(!s)throw new Error("GitHub token required to trigger workflows");try{return(await fetch(`https://api.github.com/repos/${e}/${t}/actions/workflows/${n}/dispatches`,{method:"POST",headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${s}`,"X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},body:JSON.stringify({ref:a,inputs:o})})).status===204}catch(r){throw console.error("Error triggering workflow:",r),r}}async function ra(e,t){const n=de(),o=ue();return Pt(n,o,"trigger-service-workflow.yml",{org:e,repo:t})}async function ia(e){const t=de(),n=ue(),o=e.map(a=>({org:a.org,repo:a.repo}));return Pt(t,n,"trigger-service-workflow.yml",{services:JSON.stringify(o)})}async function ca(e,t){const n=de(),o=ue();return Pt(n,o,"create-installation-pr.yml",{org:e,repo:t})}async function Or(){const e=await We("/user");if(!e.ok)throw new Error("Failed to fetch user info");return e.json()}const Pr=Object.freeze(Object.defineProperty({__proto__:null,checkRateLimit:aa,createInstallationPR:ca,fetchWorkflowRuns:sa,getUserInfo:Or,githubApiRequest:We,triggerBulkScorecardWorkflows:ia,triggerScorecardWorkflow:ra,triggerWorkflowDispatch:Pt},Symbol.toStringTag,{value:"Module"})),Wt=new Map;async function Br(e,t){if(!T())return null;const o=`${e}/${t}`;if(Wt.has(o))return Wt.get(o);try{const a=await We(`/orgs/${e}/teams/${t}/members`);if(!a.ok)return console.warn(`Failed to fetch team members for ${e}/${t}: ${a.status}`),[];const r=(await a.json()).map(i=>({login:i.login,id:i.id,avatar_url:i.avatar_url,html_url:i.html_url}));return Wt.set(o,r),r}catch(a){return console.error(`Error fetching team members for ${e}/${t}:`,a),[]}}function Rr(e,t){return`https://github.com/orgs/${e}/teams/${t}`}let I=null,Vt=0;const Hr=5*60*1e3;async function Ne(){const e=Date.now();if(I&&e-Vt<Hr)return I;try{const{response:t}=await V("all-checks.json");if(!t.ok)throw new Error(`Failed to fetch all-checks.json: ${t.status}`);return I=await t.json(),Vt=e,I}catch(t){return console.warn("Failed to load checks metadata:",t),{version:"1.0.0",checks:[],categories:[],count:0}}}function jr(e){return I&&I.checks.find(t=>t.id===e)||null}function Fr(){return(I==null?void 0:I.checks)||[]}function la(){if(!I)return{};const e={};for(const o of I.checks){const a=o.category||"Other";e[a]||(e[a]=[]),e[a].push(o)}const t=I.categories||[],n={};for(const o of t)e[o]&&(n[o]=e[o]);for(const o of Object.keys(e))n[o]||(n[o]=e[o]);return n}function Wr(){return(I==null?void 0:I.categories)||[]}function Nr(){I=null,Vt=0}const qr=Object.freeze(Object.defineProperty({__proto__:null,clearChecksCache:Nr,getAllChecks:Fr,getCategories:Wr,getCheckById:jr,getChecksByCategory:la,loadChecks:Ne},Symbol.toStringTag,{value:"Module"}));function zr(e){const{containerId:t,tabButtonSelector:n=".tab-btn",tabContentSelector:o=".tab-content",activeClass:a="active",getTabContentId:s=f=>`${f}-tab`,onActivate:r={}}=e,i=document.getElementById(t);if(!i)throw new Error(`Container not found: ${t}`);function c(f,v){if(i.querySelectorAll(n).forEach(d=>{d.classList.remove(a)}),i.querySelectorAll(o).forEach(d=>{d.classList.remove(a)}),v!=null&&v.target)v.target.classList.add(a);else{const d=i.querySelector(`${n}[data-tab="${f}"]`);d&&d.classList.add(a)}const S=document.getElementById(s(f));S&&S.classList.add(a),r[f]&&r[f]()}function l(){const f=i.querySelector(`${n}.${a}`);return(f==null?void 0:f.dataset.tab)||null}return{switchTab:c,getActiveTab:l}}let da=[],ce=null,$e=!1,Kt=null;function Ur(e,t){const n=Rr(e.github_org,e.github_slug);if(t===null)return`
            <div class="team-github-section">
                <a href="${m(n)}" target="_blank" class="team-github-link">
                    ${P("github")} ${m(e.github_slug)}
                    ${P("externalLink")}
                </a>
                <div class="team-github-signin">
                    <button class="btn-link" onclick="window.openSettingsForTeam()">
                        Sign in to view team members
                    </button>
                </div>
            </div>
        `;if(!t||t.length===0)return`
            <div class="team-github-section">
                <a href="${m(n)}" target="_blank" class="team-github-link">
                    ${P("github")} ${m(e.github_slug)}
                    ${P("externalLink")}
                </a>
                <div class="team-members-empty">No members found or unable to access team</div>
            </div>
        `;const o=t.map(a=>`
        <a href="${m(a.html_url)}" target="_blank" class="team-member" title="${m(a.login)}">
            <img src="${m(a.avatar_url)}&s=48" alt="${m(a.login)}" class="team-member-avatar">
            <span class="team-member-name">@${m(a.login)}</span>
        </a>
    `).join("");return`
        <div class="team-github-section">
            <a href="${m(n)}" target="_blank" class="team-github-link">
                ${P("github")} ${m(e.github_slug)}
                ${P("externalLink")}
            </a>
            <div class="team-members">
                <span class="members-label">Members (${t.length}):</span>
                <div class="members-grid">
                    ${o}
                </div>
            </div>
        </div>
    `}async function ua(e){var f;if(!window.allTeams||window.allTeams.length===0){const v=window.allServices||[];if(v.length>0){const S=Pe(v);window.allTeams=Object.values(S)}}const t=(f=window.allTeams)==null?void 0:f.find(v=>v.name===e);if(!t){console.error("Team not found:",e);return}const n=(window.allServices||[]).filter(v=>B(v)===t.name),o=document.getElementById("team-modal"),a=document.getElementById("team-detail");if(!o||!a)return;const s=pe(t),r=t.rankDistribution||{platinum:0,gold:0,silver:0,bronze:0},i=["platinum","gold","silver","bronze"].map(v=>{const S=r[v]||0,d=t.serviceCount>0?Math.round(S/t.serviceCount*100):0;return`
            <div class="rank-dist-row">
                <span class="rank-dist-label">${le(v)}</span>
                <div class="rank-dist-bar-container">
                    <div class="rank-dist-bar rank-${v}" style="width: ${d}%"></div>
                </div>
                <span class="rank-dist-count">${S}</span>
            </div>
        `}).join(""),c=n.map(v=>{const S=v.score,d=v.rank,_=S!=null?Math.round(S):"-",b=d?`rank-${d}`:"";return`
            <div class="team-service-item" onclick="window.showServiceDetail && window.showServiceDetail('${v.org}', '${v.repo}')">
                <span class="service-name">${m(v.repo)}</span>
                <span class="service-score ${b}">${_}</span>
            </div>
        `}).join(""),l=t.id||t.name.toLowerCase().replace(/\s+/g,"-");if(a.innerHTML=`
        <div class="rank-badge modal-header-badge ${s}">${le(s)}</div>
        <h2>${m(t.name)} <button class="edit-icon-btn" onclick="window.openTeamEditModal && window.openTeamEditModal('${m(l)}')" title="Edit Team"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"></path></svg></button></h2>
        <div class="team-metadata">
            <span class="team-id">ID: ${m(l)}</span>
            ${t.description?`<p class="team-description">${m(t.description)}</p>`:""}
            ${t.aliases&&t.aliases.length>0?`
            <div class="team-aliases">
                <span class="aliases-label">Also known as:</span>
                ${t.aliases.map(v=>`<span class="alias-tag">${m(v)}</span>`).join("")}
            </div>
            `:""}
        </div>

        <div class="team-modal-stats">
            <div class="team-modal-stat">
                <span class="stat-value">${Math.round(t.averageScore||0)}</span>
                <span class="stat-label">Average Score</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${t.serviceCount}</span>
                <span class="stat-label">Services</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${t.installedCount}</span>
                <span class="stat-label">Installed</span>
            </div>
            <div class="team-modal-stat ${t.staleCount>0?"warning":""}">
                <span class="stat-value">${t.staleCount||0}</span>
                <span class="stat-label">Stale</span>
            </div>
        </div>

        ${t.slack_channel||t.oncall_rotation?`
        <div class="team-modal-contact">
            ${t.slack_channel?`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.2 8.4a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0zm6 0a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0z"/></svg> ${m(t.slack_channel)}</span>`:""}
            ${t.oncall_rotation?`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg> ${m(t.oncall_rotation)}</span>`:""}
        </div>
        `:""}

        <div class="tabs">
            <button class="tab-btn active" data-tab="services" onclick="switchTeamModalTab('services')">Services</button>
            <button class="tab-btn" data-tab="distribution" onclick="switchTeamModalTab('distribution')">Distribution</button>
            <button class="tab-btn" data-tab="adoption" onclick="switchTeamModalTab('adoption')">Check Adoption</button>
            <button class="tab-btn" data-tab="github" onclick="switchTeamModalTab('github')">GitHub</button>
        </div>

        <div class="team-tab-content tab-content active" id="team-tab-services">
            <div class="team-services-list">
                ${c||'<div class="empty-state">No services in this team</div>'}
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-distribution">
            <div class="rank-distribution-detail">
                ${i}
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-adoption">
            <div class="check-adoption-loading">
                <span class="loading-spinner"></span> Loading check data...
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-github">
            ${t.github_org&&t.github_slug?`
                <div class="team-github-section team-github-loading">
                    <span class="loading-spinner"></span> Loading GitHub team...
                </div>
            `:`
                <div class="team-not-linked">
                    Not linked to a GitHub team
                </div>
            `}
        </div>
    `,da=n,Kt=zr({containerId:"team-modal",tabButtonSelector:".tab-btn",tabContentSelector:".team-tab-content",getTabContentId:v=>`team-tab-${v}`,onActivate:{adoption:Rn}}),o.classList.remove("hidden"),t.github_org&&t.github_slug){const v=await Br(t.github_org,t.github_slug),S=document.getElementById("team-tab-github");S&&(S.innerHTML=Ur(t,v))}}function ma(e){Kt&&Kt.switchTab(e)}async function Rn(){const e=document.getElementById("team-tab-adoption");if(e)try{const n=(await Ne()).checks||[];if(n.length===0){e.innerHTML='<div class="empty-state">No check metadata available</div>';return}ce||(ce=n[0].id),Gr(e,n)}catch(t){console.error("Failed to load check adoption:",t),e.innerHTML='<div class="empty-state">Failed to load check data</div>'}}function Gr(e,t){const n=da,o=t.find(b=>b.id===ce)||t[0],a=rn(n,ce),s=n[0]&&B(n[0])||"No Team",r=a[s]||{passing:0,excluded:0,total:0,activeTotal:0,percentage:0,services:[]},i=t.map(b=>`
        <div class="check-selector-option ${b.id===ce?"selected":""}"
             data-check-id="${b.id}"
             onclick="window.selectTeamCheck('${b.id}')">
            ${m(b.name)}
        </div>
    `).join(""),c=r.services.filter(b=>b.checkStatus==="pass"),l=r.services.filter(b=>b.checkStatus==="fail"),f=r.services.filter(b=>b.checkStatus==="excluded"),v=c.length>0?c.map(b=>`
            <div class="adoption-service-item passing" onclick="window.showServiceDetail && window.showServiceDetail('${b.org}', '${b.repo}')">
                <span class="service-name">${m(b.name)}</span>
                <span class="service-score rank-${b.rank}">${Math.round(b.score)}</span>
            </div>
        `).join(""):'<div class="empty-list">No passing services</div>',S=l.length>0?l.map(b=>`
            <div class="adoption-service-item failing" onclick="window.showServiceDetail && window.showServiceDetail('${b.org}', '${b.repo}')">
                <span class="service-name">${m(b.name)}</span>
                <span class="service-score rank-${b.rank}">${Math.round(b.score)}</span>
            </div>
        `).join(""):'<div class="empty-list">No failing services</div>',d=f.length>0?f.map(b=>`
            <div class="adoption-service-item excluded" onclick="window.showServiceDetail && window.showServiceDetail('${b.org}', '${b.repo}')">
                <span class="service-name">${m(b.name)}</span>
                <span class="exclusion-reason" title="${m(b.exclusionReason||"Excluded")}">${m(b.exclusionReason||"Excluded")}</span>
            </div>
        `).join(""):'<div class="empty-list">No excluded services</div>',_=r.activeTotal||r.total-(r.excluded||0);e.innerHTML=`
        <div class="check-adoption-content">
            <div class="check-selector">
                <label>Select Check:</label>
                <div class="check-selector-dropdown">
                    <button class="check-selector-toggle" onclick="window.toggleTeamCheckDropdown()">
                        <span class="check-selector-text">${m(o.name)}</span>
                        ${P("chevronDown",{size:16})}
                    </button>
                    <div class="check-selector-menu" id="team-check-selector-menu">
                        <div class="check-selector-search">
                            <input type="text" placeholder="Search checks..."
                                   oninput="window.filterTeamCheckOptions(this.value)">
                        </div>
                        <div class="check-selector-options">
                            ${i}
                        </div>
                    </div>
                </div>
            </div>

            <div class="check-info">
                <p class="check-description">${m(o.description||"")}</p>
            </div>

            <div class="adoption-progress">
                <div class="progress-header">
                    <span class="progress-label">Adoption Rate</span>
                    <span class="progress-value">
                        ${r.percentage}% (${r.passing}/${_} active)
                        ${f.length>0?`<span class="excluded-note">${f.length} excluded</span>`:""}
                    </span>
                </div>
                <div class="progress-bar-large">
                    <div class="progress-fill ${r.percentage>=80?"high":r.percentage>=50?"medium":"low"}" style="width: ${r.percentage}%"></div>
                </div>
            </div>

            <div class="adoption-lists ${f.length>0?"three-columns":""}">
                <div class="adoption-column passing">
                    <h4>Passing (${c.length})</h4>
                    <div class="adoption-service-list">
                        ${v}
                    </div>
                </div>
                <div class="adoption-column failing">
                    <h4>Failing (${l.length})</h4>
                    <div class="adoption-service-list">
                        ${S}
                    </div>
                </div>
                ${f.length>0?`
                <div class="adoption-column excluded">
                    <h4>Excluded (${f.length})</h4>
                    <div class="adoption-service-list excluded-list">
                        ${d}
                    </div>
                </div>
                `:""}
            </div>
        </div>
    `}function fa(e){ce=e,Rn()}function pa(){const e=document.getElementById("team-check-selector-menu");if(e)if($e=!$e,e.classList.toggle("open",$e),$e){const t=e.querySelector("input");t&&(t.value="",t.focus()),Hn(""),setTimeout(()=>{document.addEventListener("click",Qt)},0)}else document.removeEventListener("click",Qt)}function Qt(e){var n;const t=(n=document.querySelector("#team-check-selector-menu"))==null?void 0:n.closest(".check-selector-dropdown");t&&!t.contains(e.target)&&ga()}function ga(){const e=document.getElementById("team-check-selector-menu");e&&(e.classList.remove("open"),$e=!1),document.removeEventListener("click",Qt)}function ha(e){ce=e,ga(),Rn()}function Hn(e){const t=document.querySelectorAll("#team-check-selector-menu .check-selector-option"),n=e.toLowerCase();t.forEach(o=>{var s;const a=((s=o.textContent)==null?void 0:s.toLowerCase())||"";o.style.display=a.includes(n)?"":"none"})}window.changeTeamCheck=fa;window.toggleTeamCheckDropdown=pa;window.selectTeamCheck=ha;window.filterTeamCheckOptions=Hn;function wa(){const e=document.getElementById("team-modal");e&&e.classList.add("hidden")}window.showTeamDetail=ua;window.closeTeamModal=wa;window.switchTeamModalTab=ma;window.openSettingsForTeam=Sn;const Zr=Object.freeze(Object.defineProperty({__proto__:null,changeTeamCheck:fa,closeTeamModal:wa,filterTeamCheckOptions:Hn,selectTeamCheck:ha,showTeamModal:ua,switchTeamModalTab:ma,toggleTeamCheckDropdown:pa},Symbol.toStringTag,{value:"Module"})),_e="check-filter-modal";let H=new Map,Q=null,Jt=null,X="",Ae=[];const we=new Map;async function jn(e){Jt=e,H.clear(),X="",we.clear();try{Q=await Ne()}catch(t){console.error("Failed to load checks for filter:",t),Q={checks:[],categories:[],version:"",count:0}}va(),qe()}async function Fn(){try{Q=await Ne(),we.clear(),qe()}catch(e){console.error("Failed to update checks filter:",e)}}function Bt(e){Ae=e||[],we.clear()}function va(){if(document.getElementById(_e))return;const e=document.createElement("div");e.id=_e,e.className="modal hidden",e.innerHTML=`
        <div class="modal-content check-filter-modal-content">
            <div class="check-filter-modal-header">
                <h2>Filter by Check</h2>
                <button class="modal-close" onclick="window.closeCheckFilterModal()">&times;</button>
            </div>
            <div class="check-filter-modal-body">
                <div id="check-filter-modal-content"></div>
            </div>
        </div>
    `,document.body.appendChild(e),be(_e,()=>{})}function qe(){const e=document.getElementById("check-filter-container");if(!e)return;const t=Be(H),n=t>0;e.innerHTML=`
        <div class="check-filter-dropdown">
            <button class="check-filter-toggle ${n?"active":""}" onclick="window.openCheckFilterModal()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
                </svg>
                Check Filter${n?` (${t})`:""}
            </button>
        </div>
    `}function Wn(){va(),Vr(),Kr(),oe(_e),setTimeout(()=>{const e=document.getElementById("check-filter-search");e&&e.focus()},100)}function Nn(){te(_e)}function Vr(){if(!(!Ae.length||!(Q!=null&&Q.checks))){we.clear();for(const e of Q.checks){const t=ut(Ae,e.id);we.set(e.id,t)}}}function ba(e){return we.get(e)||{passing:0,failing:0,total:0,percentage:0}}function Kr(){const e=document.getElementById("check-filter-modal-content");if(!e)return;const t=Be(H),n=la();e.innerHTML=`
        <div class="check-filter-search-section">
            <input
                type="text"
                id="check-filter-search"
                placeholder="Search checks by name or description..."
                value="${m(X)}"
                oninput="window.filterCheckOptions(this.value)"
            >
            ${t>0?`
                <div class="check-filter-summary">
                    <span class="check-filter-summary-count">
                        <strong>${t}</strong> filter${t!==1?"s":""} active
                    </span>
                    <button class="check-clear-btn" onclick="window.clearCheckFilter(event)">Clear all</button>
                </div>
            `:""}
        </div>
        <div id="check-filter-categories">
            ${Qr(n)}
        </div>
    `}function Qr(e){const t=Object.keys(e);return t.length===0?'<div class="check-filter-empty">No checks available</div>':t.map(n=>{const o=e[n],a=n.toLowerCase().replace(/\s+/g,"-");let s=0,r=0;o.forEach(c=>{const l=ba(c.id);s+=l.passing,r+=l.total});const i=r>0?Math.round(s/r*100):0;return`
            <div class="check-category-section" data-category="${a}">
                <div class="check-category-header" onclick="window.toggleCheckCategory('${a}')">
                    <div class="check-category-header-left">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                        </svg>
                        <span class="check-category-header-title">${m(n)}</span>
                        <span class="check-category-header-count">(${o.length})</span>
                    </div>
                    ${Ae.length>0?`
                        <span class="check-category-header-stats">${i}% avg adoption</span>
                    `:""}
                </div>
                <div class="check-category-content" id="check-category-${a}">
                    ${o.map(c=>Jr(c)).join("")}
                </div>
            </div>
        `}).join("")}function Jr(e){const t=H.get(e.id)||null,n=ba(e.id),o=X.toLowerCase(),s=!X||e.name.toLowerCase().includes(o)||e.id.toLowerCase().includes(o)||(e.description||"").toLowerCase().includes(o)?"":"display: none;";let r="low";return n.percentage>=75?r="high":n.percentage>=40&&(r="medium"),`
        <div class="check-option-card" data-check-id="${e.id}" style="${s}">
            <div class="check-option-info">
                <div class="check-option-name">${m(e.name)}</div>
                ${e.description?`
                    <div class="check-option-description">${m(e.description)}</div>
                `:""}
                ${Ae.length>0?`
                    <div class="check-option-stats">
                        <span class="check-option-stat passing">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                            </svg>
                            <span class="check-option-stat-value">${n.passing}</span> passing
                        </span>
                        <span class="check-option-stat failing">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                            </svg>
                            <span class="check-option-stat-value">${n.failing}</span> failing
                        </span>
                        ${n.excluded&&n.excluded>0?`
                        <span class="check-option-stat excluded">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                <line x1="3" y1="13" x2="13" y2="3" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            <span class="check-option-stat-value">${n.excluded}</span> excluded
                        </span>
                        `:""}
                        <span class="check-option-progress">
                            <span class="check-option-progress-bar">
                                <span class="check-option-progress-fill ${r}" style="width: ${n.percentage}%"></span>
                            </span>
                            <span class="check-option-progress-text">${n.percentage}%</span>
                        </span>
                    </div>
                `:""}
            </div>
            <div class="check-state-toggle">
                <button
                    class="state-btn state-any ${t===null?"active":""}"
                    onclick="window.setCheckState('${e.id}', null)"
                    title="Any status">
                    Any
                </button>
                <button
                    class="state-btn state-pass ${t==="pass"?"active":""}"
                    onclick="window.setCheckState('${e.id}', 'pass')"
                    title="Must pass">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                </button>
                <button
                    class="state-btn state-fail ${t==="fail"?"active":""}"
                    onclick="window.setCheckState('${e.id}', 'fail')"
                    title="Must fail">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `}function ya(e){const t=document.querySelector(`.check-category-section[data-category="${e}"]`);t&&t.classList.toggle("collapsed")}function ka(e,t){t===null?H.delete(e):H.set(e,t),Yr(e,t),Sa(),qe(),qn()}function Yr(e,t){const n=document.querySelector(`.check-option-card[data-check-id="${e}"]`);if(n){n.querySelectorAll(".state-btn").forEach(a=>{a.classList.remove("active")});const o=n.querySelector(`.state-${t||"any"}`);o&&o.classList.add("active")}}function Sa(){const e=document.querySelector(".check-filter-search-section");if(!e)return;const t=Be(H),n=e.querySelector(".check-filter-summary");if(t>0){const o=`
            <div class="check-filter-summary">
                <span class="check-filter-summary-count">
                    <strong>${t}</strong> filter${t!==1?"s":""} active
                </span>
                <button class="check-clear-btn" onclick="window.clearCheckFilter(event)">Clear all</button>
            </div>
        `;n?n.outerHTML=o:e.insertAdjacentHTML("beforeend",o)}else n&&n.remove()}function $a(e){X=e.toLowerCase(),document.querySelectorAll(".check-option-card").forEach(n=>{var r;const o=n.dataset.checkId,a=(r=Q==null?void 0:Q.checks)==null?void 0:r.find(i=>i.id===o);if(!a)return;const s=!X||a.name.toLowerCase().includes(X)||a.id.toLowerCase().includes(X)||(a.description||"").toLowerCase().includes(X);n.style.display=s?"":"none"}),document.querySelectorAll(".check-category-section").forEach(n=>{const o=n.querySelectorAll('.check-option-card:not([style*="display: none"])');n.style.display=o.length>0?"":"none"})}function Ta(e){e&&e.stopPropagation(),H.clear(),document.querySelectorAll(".check-option-card").forEach(t=>{var n;t.querySelectorAll(".state-btn").forEach(o=>{o.classList.remove("active")}),(n=t.querySelector(".state-any"))==null||n.classList.add("active")}),Sa(),qe(),qn()}function qn(){Jt&&Jt(new Map(H))}function zn(e){return ho(e,H)}function Ca(){return new Map(H)}function _a(e){H=new Map(e),qe(),qn()}function Ea(){return Be(H)}window.openCheckFilterModal=Wn;window.closeCheckFilterModal=Nn;window.toggleCheckCategory=ya;window.setCheckState=ka;window.filterCheckOptions=$a;window.clearCheckFilter=Ta;const Xr=Object.freeze(Object.defineProperty({__proto__:null,clearCheckFilter:Ta,closeCheckFilterModal:Nn,filterByChecks:zn,filterCheckOptions:$a,getActiveFilterCount:Ea,getCheckFilterState:Ca,initCheckFilter:jn,openCheckFilterModal:Wn,setCheckFilterState:_a,setCheckState:ka,setServicesForStats:Bt,toggleCheckCategory:ya,updateCheckFilter:Fn},Symbol.toStringTag,{value:"Module"})),Le="check-adoption-modal";let Yt=[],ne=null;const W={by:"percentage",direction:"desc"};let ie=null,Te=!1;function Un(){ei(),be(Le)}function ei(){if(document.getElementById(Le))return;const e=document.createElement("div");e.id=Le,e.className="modal hidden",e.innerHTML=`
        <div class="modal-content check-adoption-modal-content">
            <div class="modal-header">
                <h2>Check Adoption Dashboard</h2>
                <button class="modal-close" aria-label="Close" onclick="window.closeCheckAdoptionDashboard()">
                    ${P("xMark",{size:20})}
                </button>
            </div>
            <div class="modal-body">
                <div id="check-adoption-dashboard-content"></div>
            </div>
        </div>
    `,document.body.appendChild(e)}async function Gn(e){Yt=e;try{ie=await Ne(),!ne&&ie.checks.length>0&&(ne=ie.checks[0].id)}catch(t){console.error("Failed to load checks:",t),ie={checks:[],categories:[],version:"",count:0}}oe(Le),Rt()}function Zn(){te(Le)}function Rt(){const e=document.getElementById("check-adoption-dashboard-content");if(!e)return;const t=(ie==null?void 0:ie.checks)||[];if(t.length===0){e.innerHTML='<div class="empty-state">No check metadata available</div>';return}const n=t.find(d=>d.id===ne)||t[0],o=rn(Yt,ne),a=wo(o,W.direction);W.by==="name"&&a.sort((d,_)=>{const b=d.teamName.localeCompare(_.teamName);return W.direction==="desc"?-b:b});const s=t.map(d=>`
        <div class="check-selector-option ${d.id===ne?"selected":""}"
             data-check-id="${d.id}"
             onclick="window.selectCheckFromDropdown('${d.id}')">
            ${m(d.name)}
        </div>
    `).join(""),r=a.map(d=>{const _=d.percentage>=80?"high":d.percentage>=50?"medium":"low",M=d.teamName==="No Team"?"adoption-row no-team":"adoption-row",x=d.percentage===0?"0":d.percentage,J=d.percentage===0?"progress-fill none":`progress-fill ${_}`,F=d.excluded||0,ae=d.activeTotal||d.total-F;return`
            <tr class="${M}" onclick="window.showTeamDetail && window.showTeamDetail('${m(d.teamName)}')">
                <td class="team-name-cell">${m(d.teamName)}</td>
                <td class="adoption-cell">${d.percentage}%</td>
                <td class="progress-cell">
                    <div class="progress-bar-inline">
                        <div class="${J}" style="width: ${x}%"></div>
                    </div>
                </td>
                <td class="count-cell">${d.passing}/${ae}</td>
                <td class="excluded-cell ${F>0?"has-excluded":""}">${F>0?F:"-"}</td>
            </tr>
        `}).join(""),i=ut(Yt,ne),{total:c,activeTotal:l,passing:f,excluded:v,percentage:S}=i;e.innerHTML=`
        <div class="adoption-dashboard-header">
            <div class="check-selector-large">
                <label>Select Check:</label>
                <div class="check-selector-dropdown">
                    <button class="check-selector-toggle" onclick="window.toggleCheckSelectorDropdown()">
                        <span class="check-selector-text">${m(n.name)}</span>
                        ${P("chevronDown",{size:16})}
                    </button>
                    <div class="check-selector-menu" id="check-selector-menu">
                        <div class="check-selector-search">
                            <input type="text" placeholder="Search checks..."
                                   oninput="window.filterCheckSelectorOptions(this.value)">
                        </div>
                        <div class="check-selector-options">
                            ${s}
                        </div>
                    </div>
                </div>
            </div>
            <div class="adoption-stats-row">
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${S}%</span>
                    <span class="adoption-stat-label">Overall Adoption</span>
                </div>
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${f}/${l}</span>
                    <span class="adoption-stat-label">Services Passing</span>
                </div>
                ${v>0?`
                <div class="adoption-stat-card excluded">
                    <span class="adoption-stat-value">${v}</span>
                    <span class="adoption-stat-label">Excluded</span>
                </div>
                `:""}
            </div>
        </div>

        <div class="check-description-box">
            <strong>${m(n.name)}</strong>
            <p>${m(n.description||"No description available")}</p>
        </div>

        <div class="adoption-table-container">
            <table class="adoption-table">
                <thead>
                    <tr>
                        <th class="sortable" onclick="window.sortAdoptionTable('name')">
                            Team
                            <span class="sort-indicator">${W.by==="name"?W.direction==="asc"?"↑":"↓":""}</span>
                        </th>
                        <th class="sortable" onclick="window.sortAdoptionTable('percentage')">
                            Adoption
                            <span class="sort-indicator">${W.by==="percentage"?W.direction==="asc"?"↑":"↓":""}</span>
                        </th>
                        <th>Progress</th>
                        <th>Passing</th>
                        <th>Excl.</th>
                    </tr>
                </thead>
                <tbody>
                    ${r||'<tr><td colspan="5" class="empty-row">No teams found</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function Aa(){const e=document.getElementById("check-selector-menu");if(e)if(Te=!Te,e.classList.toggle("open",Te),Te){const t=e.querySelector("input");t&&(t.value="",t.focus()),Vn(""),setTimeout(()=>{document.addEventListener("click",Xt)},0)}else document.removeEventListener("click",Xt)}function Xt(e){const t=document.querySelector(".check-selector-dropdown");t&&!t.contains(e.target)&&La()}function La(){const e=document.getElementById("check-selector-menu");e&&(e.classList.remove("open"),Te=!1),document.removeEventListener("click",Xt)}function Ia(e){ne=e,La(),Rt()}function Vn(e){const t=document.querySelectorAll(".check-selector-option"),n=e.toLowerCase();t.forEach(o=>{var s;const a=((s=o.textContent)==null?void 0:s.toLowerCase())||"";o.style.display=a.includes(n)?"":"none"})}function Ma(e){ne=e,Rt()}function xa(e){W.by===e?W.direction=W.direction==="desc"?"asc":"desc":(W.by=e,W.direction=e==="name"?"asc":"desc"),Rt()}window.openCheckAdoptionDashboard=Gn;window.closeCheckAdoptionDashboard=Zn;window.changeAdoptionCheck=Ma;window.sortAdoptionTable=xa;window.toggleCheckSelectorDropdown=Aa;window.selectCheckFromDropdown=Ia;window.filterCheckSelectorOptions=Vn;const ti=Object.freeze(Object.defineProperty({__proto__:null,changeAdoptionCheck:Ma,closeCheckAdoptionDashboard:Zn,filterCheckSelectorOptions:Vn,initCheckAdoptionDashboard:Un,openCheckAdoptionDashboard:Gn,selectCheckFromDropdown:Ia,sortAdoptionTable:xa,toggleCheckSelectorDropdown:Aa},Symbol.toStringTag,{value:"Module"})),Kn={files:{triggerService:"trigger-service-workflow.yml",createInstallPR:"create-installation-pr.yml",scorecard:"scorecard.yml"},polling:{default:3e4,min:1e4,max:12e4}};function Qn(e,t,n){return`https://api.github.com/repos/${e}/${t}/actions/workflows/${n}/dispatches`}const Jn=()=>{const{getRepoOwner:e,getRepoName:t}=window.ScorecardModules.registry;return{owner:e(),name:t()}};async function Da(e,t,n){const o=T();if(!o)return y("Please configure a GitHub PAT in Settings to trigger workflows","warning"),window.openSettings(),!1;At(n,"Triggering...");try{const{owner:a,name:s}=Jn(),r=await fetch(Qn(a,s,Kn.files.triggerService),{method:"POST",headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${o}`,"X-GitHub-Api-Version":ke.api.version,"Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{org:e,repo:t}})});if(r.status===204)return y(`Scorecard workflow triggered for ${e}/${t}`,"success"),await Tn(n,"✓ Triggered Successfully"),!0;if(r.status===401)return ye(),y("Invalid GitHub token. Please enter a valid token in Settings.","error"),await nt(n,"✗ Trigger Failed"),!1;{const i=await r.json().catch(()=>({}));return console.error("Failed to trigger workflow:",r.status,i),y(`Failed to trigger workflow: ${i.message||r.statusText}`,"error"),await nt(n,"✗ Trigger Failed"),!1}}catch(a){return console.error("Error triggering workflow:",a),y(`Error triggering workflow: ${a instanceof Error?a.message:String(a)}`,"error"),await nt(n,"✗ Trigger Failed"),!1}}async function Oa(e,t,n){const o=T();if(!o)return y("GitHub token is required to create installation PRs","error"),!1;At(n,"Creating PR...");try{const{owner:a,name:s}=Jn(),r=await fetch(Qn(a,s,Kn.files.createInstallPR),{method:"POST",headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${o}`,"X-GitHub-Api-Version":ke.api.version,"Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{org:e,repo:t}})});if(r.status===204)return y(`Installation PR creation started for ${e}/${t}`,"success"),setTimeout(()=>{y("Note: PR status will appear in the catalog in 3-5 minutes due to GitHub Pages deployment.","info")},2e3),n&&(n.innerHTML="⏳ PR Creating...",setTimeout(async()=>{try{await new Promise(c=>setTimeout(c,5e3)),y("Installation PR created! Refreshing...","success");const i=document.getElementById("service-modal");i==null||i.classList.add("hidden"),setTimeout(()=>window.showServiceDetail(e,t),500)}catch(i){console.error("Error checking PR status:",i),K(n)}},1e3)),!0;if(r.status===401)return ye(),y("Invalid GitHub token. Please enter a valid token with workflow permissions.","error"),K(n),!1;{const i=await r.json().catch(()=>({}));return console.error("Failed to create installation PR:",r.status,i),y(`Failed to create installation PR: ${i.message||r.statusText}`,"error"),K(n),!1}}catch(a){return console.error("Error creating installation PR:",a),y(`Error creating installation PR: ${a instanceof Error?a.message:String(a)}`,"error"),K(n),!1}}async function Ht(e,t){const n=T();if(!n)return y("GitHub token is required to trigger workflows","error"),!1;At(t,"Triggering...");try{const o=e.map(i=>({org:i.org,repo:i.repo})),{owner:a,name:s}=Jn(),r=await fetch(Qn(a,s,Kn.files.triggerService),{method:"POST",headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${n}`,"X-GitHub-Api-Version":ke.api.version,"Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{services:JSON.stringify(o)}})});if(r.status===204){const i=e.length;return y(`Triggered workflows for ${i} service${i!==1?"s":""}`,"success"),await Tn(t,`✓ Triggered ${i} service${i!==1?"s":""}`),!0}else{if(r.status===401)return ye(),y("Invalid GitHub token. Please enter a valid token in Settings.","error"),K(t),!1;{const i=await r.json().catch(()=>({}));return console.error("Failed to trigger bulk workflows:",r.status,i),y(`Failed to trigger workflows: ${i.message||r.statusText}`,"error"),K(t),!1}}}catch(o){return console.error("Error triggering bulk workflows:",o),y(`Error triggering workflows: ${o instanceof Error?o.message:String(o)}`,"error"),K(t),!1}}function Pa(e){e.preventDefault();const{isServiceStale:t}=window.ScorecardModules.staleness,n=window.allServices.filter(o=>t(o,window.currentChecksHash)&&o.installed);if(n.length===0){y("No stale services to trigger","info");return}confirm(`This will trigger scorecard workflows for ${n.length} stale service${n.length!==1?"s":""}.

Continue?`)&&Ht(n,e.currentTarget)}function Ba(e){e.preventDefault();const t=window.allServices.filter(n=>n.installed);if(t.length===0){y("No installed services to trigger","info");return}confirm(`This will trigger scorecard workflows for ALL ${t.length} installed service${t.length!==1?"s":""}.

This may take a while. Continue?`)&&Ht(t,e.currentTarget)}const ni=Object.freeze(Object.defineProperty({__proto__:null,handleBulkTrigger:Pa,handleBulkTriggerAll:Ba,installService:Oa,triggerBulkWorkflows:Ht,triggerServiceWorkflow:Da},Symbol.toStringTag,{value:"Module"})),Yn="theme",q={LIGHT:"light",DARK:"dark"};function oi(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?q.DARK:q.LIGHT}function ai(){const e=localStorage.getItem(Yn);return e===q.DARK||e===q.LIGHT?e:oi()}function rt(e){document.documentElement.setAttribute("data-theme",e)}function Ra(e){localStorage.setItem(Yn,e)}function jt(){return document.documentElement.getAttribute("data-theme")||q.LIGHT}function Xn(){const e=ai();rt(e),window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",t=>{if(!localStorage.getItem(Yn)){const o=t.matches?q.DARK:q.LIGHT;rt(o)}})}function Ha(){const t=jt()===q.DARK?q.LIGHT:q.DARK;return rt(t),Ra(t),t}function ja(e){(e===q.DARK||e===q.LIGHT)&&(rt(e),Ra(e))}const si=Object.freeze(Object.defineProperty({__proto__:null,getCurrentTheme:jt,initTheme:Xn,setTheme:ja,toggleTheme:Ha},Symbol.toStringTag,{value:"Module"}));function fe(){let e=[...window.allServices];e=In(e),e=zn(e),window.filteredServices=e.filter(t=>{if(window.activeFilters.size>0)for(const[n,o]of window.activeFilters){let a=!1;if(n==="has-api"?a=t.has_api:n==="stale"?a=j(t,window.currentChecksHash):n==="installed"?a=t.installed:(n==="platinum"||n==="gold"||n==="silver"||n==="bronze")&&(a=t.rank===n),o==="include"){if(!a)return!1}else if(o==="exclude"&&a)return!1}if(window.searchQuery){const n=B(t)||"";if(!`${t.name} ${t.org} ${t.repo} ${n}`.toLowerCase().includes(window.searchQuery))return!1}return!0}),window.filteredServices.sort((t,n)=>{switch(window.currentSort){case"score-desc":return n.score-t.score;case"score-asc":return t.score-n.score;case"name-asc":return t.name.localeCompare(n.name);case"name-desc":return n.name.localeCompare(t.name);case"updated-desc":return new Date(n.last_updated).getTime()-new Date(t.last_updated).getTime();default:return 0}}),fn()}async function eo(){const e=document.getElementById("refresh-btn");if(!e)return;const t=e.innerHTML;e.disabled=!0,e.innerHTML='<span class="spinner"></span> Refreshing...';try{y("Refreshing service data...","info"),window.currentChecksHash=null,window.checksHashTimestamp=0;const{services:n,usedAPI:o}=await bt();window.allServices=n,window.filteredServices=[...n],window.currentChecksHash=await vt(),window.checksHashTimestamp=Date.now(),En(n),Fn(),Bt(n),Et(),fe();const a=new Date().toLocaleTimeString();y(o?`Data refreshed successfully from GitHub API at ${a}. (Fresh data, bypassed cache)`:`Data refreshed from CDN at ${a}. (Note: CDN cache may be up to 5 minutes old. Use GitHub PAT in settings for real-time data)`,"success")}catch(n){console.error("Error refreshing data:",n),y(`Failed to refresh data: ${n instanceof Error?n.message:String(n)}`,"error")}finally{setTimeout(()=>{e.disabled=!1,e.innerHTML=t},1e3)}}function ri(e){const t=document.getElementById("theme-icon-sun"),n=document.getElementById("theme-icon-moon");t&&n&&(e==="dark"?(t.style.display="none",n.style.display="block"):(t.style.display="block",n.style.display="none"))}async function Fa(){try{Xn(),ri(jt());const{services:e}=await bt();window.allServices=e,window.filteredServices=[...e],window.currentChecksHash=await vt(),window.checksHashTimestamp=Date.now(),_n(e,()=>{fe()}),jn(()=>{fe()}),Bt(e),xn(j),Un(),Et(),fe(),window.location.hash==="#teams"&&window.initTeamsView&&window.initTeamsView()}catch(e){console.error("Error loading services:",e);const t=N("--color-text-muted"),n=document.getElementById("services-grid");n&&(n.innerHTML=`
            <div class="empty-state">
                <h3>No Services Found</h3>
                <p>No services have run scorecards yet, or the registry is not available.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: ${t};">
                    Error: ${e instanceof Error?e.message:String(e)}
                </p>
            </div>
        `)}}const ii=Object.freeze(Object.defineProperty({__proto__:null,filterAndRenderServices:fe,initializeApp:Fa,refreshData:eo},Symbol.toStringTag,{value:"Module"})),ci={constants:Ua,icons:Ga,formatting:Za,crypto:Va,clipboard:Ya,dom:rs,cssUtils:Qa,animation:ls,statistics:us,teamStatistics:ps,checkStatistics:bs,durationTracker:Ss,toast:$s,modals:Es,filters:xs,workflowRun:Ds,serviceCard:Ps,serviceModal:lr,serviceWorkflows:mr,actionsWidget:br,settings:yr,stats:kr,buttonStates:Sr,teamFilter:_r,teamDashboard:Lr,teamEditModal:Dr,teamModal:Zr,checkFilter:Xr,checkAdoptionDashboard:ti,registry:zs,github:Pr,workflowTriggers:ni,checks:qr,auth:Hs,staleness:Ms,theme:si,appInit:ii};window.ScorecardModules=ci;window.formatRelativeTime=it;window.formatDate=xe;window.formatDuration=Z;window.formatInterval=ct;window.escapeHtml=m;window.capitalize=le;window.md5=nn;window.getCssVar=N;window.startButtonSpin=lt;window.stopButtonSpin=on;window.countByRank=ve;window.calculateAverageScore=De;window.startLiveDurationUpdates=vo;window.stopLiveDurationUpdates=ot;window.getIcon=P;window.copyBadgeCode=lo;window.showToast=y;window.showModal=oe;window.hideModal=te;window.closeAllModals=bo;window.showConfirmation=yo;window.getGitHubToken=T;window.hasGitHubToken=ft;window.setGitHubToken=pt;window.clearGitHubToken=ye;window.validateGitHubToken=pn;window.isServiceStale=j;window.initTheme=Xn;window.toggleTheme=Ha;window.getCurrentTheme=jt;window.setTheme=ja;window.loadServicesData=bt;window.fetchCurrentChecksHash=vt;window.fetchWithHybridAuth=V;window.getRawBaseUrl=hn;window.fetchWorkflowRuns=sa;window.triggerScorecardWorkflow=ra;window.triggerBulkScorecardWorkflows=ia;window.createInstallationPR=ca;window.checkGitHubRateLimit=aa;window.filterServices=cn;window.sortServices=ln;window.filterAndSort=So;window.getFilterStats=$o;window.renderWorkflowRun=dn;window.getStatusIcon=un;window.calculateDuration=mn;window.renderServices=fn;window.showServiceDetail=Mo;window.refreshServiceData=xo;window.closeModal=Do;window.switchTab=Eo;window.scrollTabs=Ao;window.loadWorkflowRunsForService=kt;window.startServiceWorkflowPolling=St;window.changeServicePollingInterval=Oo;window.refreshServiceWorkflowRuns=Po;window.renderServiceWorkflowRuns=$t;window.updateServiceFilterCounts=wn;window.filterServiceWorkflows=Bo;window.startServiceLiveDurationUpdates=vn;window.initializeActionsWidget=Ro;window.toggleActionsWidget=Ho;window.startWidgetPolling=Re;window.stopWidgetPolling=bn;window.fetchWorkflowRuns=ge;window.updateWidgetBadge=Tt;window.renderWidgetContent=Ct;window.filterActions=jo;window.refreshActionsWidget=Fo;window.changePollingInterval=Wo;window.handlePATSaved=yn;window.handlePATCleared=kn;window.openSettings=Sn;window.closeSettings=No;window.testPAT=$n;window.savePAT=qo;window.clearPAT=zo;window.updateWidgetState=_t;window.updateModeIndicator=He;window.checkRateLimit=je;window.updateStats=Et;window.getTeamName=B;window.getTeamCount=mo;window.getUniqueTeams=Oe;window.calculateTeamStats=Pe;window.initTeamFilter=_n;window.updateTeamFilter=En;window.filterByTeam=In;window.selectTeam=It;window.clearTeamFilter=Ln;window.initTeamDashboard=xn;window.openTeamDashboard=Dn;window.closeTeamDashboard=xt;window.updateDashboardServices=Xo;window.initTeamEditModal=ea;window.openTeamEditModal=Pn;window.openCreateTeamModal=Bn;window.closeTeamEditModal=Ot;window.initCheckFilter=jn;window.updateCheckFilter=Fn;window.filterByChecks=zn;window.getCheckFilterState=Ca;window.setCheckFilterState=_a;window.getActiveFilterCount=Ea;window.setServicesForStats=Bt;window.openCheckFilterModal=Wn;window.closeCheckFilterModal=Nn;window.initCheckAdoptionDashboard=Un;window.openCheckAdoptionDashboard=Gn;window.closeCheckAdoptionDashboard=Zn;window.loadTeams=yt;window.triggerServiceWorkflow=Da;window.installService=Oa;window.triggerBulkWorkflows=Ht;window.handleBulkTrigger=Pa;window.handleBulkTriggerAll=Ba;window.filterAndRenderServices=fe;window.refreshData=eo;function to(e){e!=="services"&&e!=="teams"||e!==window.currentView&&(window.currentView=e,document.querySelectorAll(".view-tab").forEach(t=>{const n=t;n.classList.toggle("active",n.dataset.view===e)}),document.querySelectorAll(".view-content").forEach(t=>{t.classList.toggle("active",t.id===`${e}-view`)}),history.replaceState(null,"",`#${e}`),e==="teams"&&no())}async function no(){const e=document.getElementById("teams-grid");if(e){e.innerHTML='<div class="loading">Loading teams...</div>';try{const t=window.allServices||[];let n=null;try{const{teams:s}=await yt();n=s}catch(s){console.warn("Failed to load teams registry:",s)}const o=Pe(t);let a;n?a=an(n,o):a=Object.fromEntries(Object.entries(o).map(([s,r])=>[s.toLowerCase().replace(/\s+/g,"-"),{id:s.toLowerCase().replace(/\s+/g,"-"),name:s,statistics:r}])),window.allTeams=Object.values(a).map(s=>{var r;return{...s,...s.statistics||{},slack_channel:((r=s.metadata)==null?void 0:r.slack_channel)||null}}),li(window.allTeams,t),Ie(window.allTeams,t)}catch(t){console.error("Failed to initialize teams view:",t),e.innerHTML=`<div class="error">Failed to load teams: ${t instanceof Error?t.message:String(t)}</div>`}}}function li(e,t){const n=document.getElementById("teams-total-teams");n&&(n.textContent=String(e.length));const o=document.getElementById("teams-avg-score");if(o&&e.length>0){const b=e.reduce((M,x)=>M+(x.averageScore||0),0)/e.length;o.textContent=String(Math.round(b))}const a=document.getElementById("teams-total-services");a&&(a.textContent=String(t.length));const s=t.filter(b=>!B(b)).length,r=document.getElementById("teams-no-team");r&&(r.textContent=String(s));let i=0,c=0,l=0,f=0;e.forEach(b=>{const M=pe(b);M==="platinum"?i++:M==="gold"?c++:M==="silver"?l++:M==="bronze"&&f++});const v=document.getElementById("teams-platinum-count"),S=document.getElementById("teams-gold-count"),d=document.getElementById("teams-silver-count"),_=document.getElementById("teams-bronze-count");v&&(v.textContent=String(i)),S&&(S.textContent=String(c)),d&&(d.textContent=String(l)),_&&(_.textContent=String(f))}function Ie(e,t){const n=document.getElementById("teams-grid");if(!n)return;if(e.length===0){n.innerHTML='<div class="team-empty-state">No teams found</div>';return}const o=di([...e],window.teamsSort);let a=o;if(window.teamsSearchQuery){const s=window.teamsSearchQuery.toLowerCase();a=o.filter(r=>r.name.toLowerCase().includes(s)||r.description&&r.description.toLowerCase().includes(s))}n.innerHTML=a.map(s=>ui(s)).join(""),window.filteredTeams=a}function di(e,t){switch(t){case"services-desc":return e.sort((n,o)=>{const a=o.serviceCount-n.serviceCount;return a!==0?a:(o.averageScore||0)-(n.averageScore||0)});case"services-asc":return e.sort((n,o)=>{const a=n.serviceCount-o.serviceCount;return a!==0?a:(o.averageScore||0)-(n.averageScore||0)});case"score-desc":return e.sort((n,o)=>(o.averageScore||0)-(n.averageScore||0));case"score-asc":return e.sort((n,o)=>(n.averageScore||0)-(o.averageScore||0));case"name-asc":return e.sort((n,o)=>{const a=n.name.localeCompare(o.name);return a!==0?a:(o.averageScore||0)-(n.averageScore||0)});case"name-desc":return e.sort((n,o)=>{const a=o.name.localeCompare(n.name);return a!==0?a:(o.averageScore||0)-(n.averageScore||0)});default:return e}}function ui(e,t){const n=pe(e),o=e.rankDistribution||{},a=["platinum","gold","silver","bronze"].filter(r=>o[r]>0).map(r=>`<span class="mini-rank-badge rank-${r}">${o[r]}</span>`).join(""),s=e.serviceCount>0?Math.round(e.installedCount/e.serviceCount*100):0;return`
        <div class="team-card rank-${n}" onclick="showTeamDetail('${m(e.name)}')">
            <div class="team-card-header">
                <h3 class="team-card-name">${m(e.name)}</h3>
                ${e.slack_channel?`<span class="team-slack">${m(e.slack_channel)}</span>`:""}
            </div>
            <div class="rank-badge ${n}">${le(n)}</div>
            ${e.description?`<p class="team-card-description">${m(e.description)}</p>`:""}
            <div class="team-card-stats">
                <div class="team-stat">
                    <span class="team-stat-value">${Math.round(e.averageScore||0)}</span>
                    <span class="team-stat-label">Avg Score</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${e.serviceCount}</span>
                    <span class="team-stat-label">Services</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${e.installedCount}</span>
                    <span class="team-stat-label">Installed</span>
                </div>
                ${e.staleCount>0?`
                <div class="team-stat warning">
                    <span class="team-stat-value">${e.staleCount}</span>
                    <span class="team-stat-label">Stale</span>
                </div>
                `:""}
            </div>
            <div class="team-card-ranks">${a||'<span class="mini-rank-badge rank-bronze">0</span>'}</div>
            <div class="team-card-progress">
                <div class="progress-label">
                    <span>Installed</span>
                    <span>${s}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${s}%"></div>
                </div>
            </div>
        </div>
    `}async function mi(){await eo(),await no()}function Wa(){let e=[...window.allTeams];window.teamsActiveFilters.forEach((t,n)=>{["platinum","gold","silver","bronze"].includes(n)&&(t==="include"?e=e.filter(o=>pe(o)===n):t==="exclude"&&(e=e.filter(o=>pe(o)!==n)))}),Ie(e)}function en(){const e=window.location.hash.replace("#","");(e==="teams"||e==="services")&&to(e)}window.switchView=to;window.initTeamsView=no;window.refreshTeamsView=mi;window.renderTeamsGrid=Ie;window.filterAndRenderTeams=Wa;window.handleHashChange=en;function fi(e){const t=document.getElementById("theme-icon-sun"),n=document.getElementById("theme-icon-moon");t&&n&&(e==="dark"?(t.style.display="none",n.style.display="block"):(t.style.display="block",n.style.display="none"))}function Na(){const e=document.getElementById("search-input");e&&e.addEventListener("input",i=>{window.searchQuery=i.target.value.toLowerCase(),window.filterAndRenderServices()}),document.querySelectorAll(".stat-card.filterable").forEach(i=>{i.addEventListener("click",()=>{const c=i,l=c.dataset.filter;if(!l)return;const f=window.activeFilters.get(l);c.classList.remove("active","exclude"),f?f==="include"?(window.activeFilters.set(l,"exclude"),c.classList.add("exclude")):window.activeFilters.delete(l):(window.activeFilters.set(l,"include"),c.classList.add("active")),window.filterAndRenderServices()})});const t=document.getElementById("sort-select");t&&t.addEventListener("change",i=>{window.currentSort=i.target.value,window.filterAndRenderServices()});const n=document.getElementById("theme-toggle-btn");n&&n.addEventListener("click",()=>{const i=window.toggleTheme();fi(i)});const o=document.querySelector(".modal-close");o&&o.addEventListener("click",window.closeModal);const a=document.getElementById("service-modal");a&&a.addEventListener("click",i=>{i.target.id==="service-modal"&&window.closeModal()}),document.addEventListener("keydown",i=>{if(i.key==="Escape"){const c=document.getElementById("service-modal");c&&!c.classList.contains("hidden")&&window.closeModal();const l=document.getElementById("team-modal");l&&!l.classList.contains("hidden")&&window.closeTeamModal()}});const s=document.getElementById("teams-search-input");s&&s.addEventListener("input",i=>{window.teamsSearchQuery=i.target.value.toLowerCase(),Ie(window.allTeams)});const r=document.getElementById("teams-sort-select");r&&r.addEventListener("change",i=>{window.teamsSort=i.target.value,Ie(window.allTeams)}),document.querySelectorAll(".stat-card.teams-filter").forEach(i=>{i.addEventListener("click",()=>{const c=i,l=c.dataset.filter;if(!l)return;const f=window.teamsActiveFilters.get(l);c.classList.remove("active","exclude"),f?f==="include"?(window.teamsActiveFilters.set(l,"exclude"),c.classList.add("exclude")):window.teamsActiveFilters.delete(l):(window.teamsActiveFilters.set(l,"include"),c.classList.add("active")),Wa()})}),document.querySelectorAll(".view-tab").forEach(i=>{i.addEventListener("click",()=>{const l=i.dataset.view;l&&to(l)})}),en(),window.addEventListener("hashchange",en)}window.setupEventListeners=Na;document.addEventListener("DOMContentLoaded",()=>{["service-modal","settings-modal","team-dashboard-modal"].forEach(t=>{document.getElementById(t)&&be(t)}),Na(),Fa()});
//# sourceMappingURL=index-CJ2THZfB.js.map
