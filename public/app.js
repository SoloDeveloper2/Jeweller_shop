const PK='pk_test_ZW5nYWdlZC1sb2JzdGVyLTM5MzEuY2xlcmsuYWNjb3VudHMuZGV2JA';
const $=s=>document.querySelector(s),inr=n=>'₹'+n.toLocaleString('en-IN'),esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const login=()=>{location.href='/sign-in.html?next='+encodeURIComponent(location.pathname+location.search)};
// Clerk v6 loads in two parts from your Clerk domain (taken from the publishable key): the UI bundle, then the SDK
const FAPI=atob(PK.slice(8)).slice(0,-1);
const loadJs=(src,data={})=>new Promise((ok,no)=>{const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';Object.assign(s.dataset,data);s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Could not load '+src));document.head.append(s)});
const ready=(async()=>{await loadJs(`https://${FAPI}/npm/@clerk/ui@1/dist/ui.browser.js`);await loadJs(`https://${FAPI}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,{clerkPublishableKey:PK});await Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}})})();
const authed=async()=>{await ready;if(!Clerk.user){login();await new Promise(()=>{})}};
const pub=p=>fetch('/api'+p).then(r=>r.json());
async function api(p,o={}){await ready;const h={'Content-Type':'application/json'};if(Clerk.session)h.Authorization='Bearer '+await Clerk.session.getToken();
 const r=await fetch('/api'+p,{...o,headers:h,body:o.body&&JSON.stringify(o.body)});const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Object.assign(new Error(d.error||'Something went wrong'),{status:r.status});return d}
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>t.style.opacity=0,2800)};
const refreshCart=()=>api('/cart').then(c=>$('#cn').textContent=c.reduce((n,i)=>n+i.qty,0)).catch(()=>{});
async function addToCart(id){await ready;if(!Clerk.user)return login();const c=await api('/cart');
 await api('/cart/'+id,{method:'PUT',body:{qty:(c.find(i=>i.productId==id)?.qty||0)+1}});refreshCart();toast('Added to cart')}
const card=p=>`<div class="card"><a href="/product.html?id=${p.id}"><div class="pic">${p.emoji}</div>${p.hot?'<span class="tag">Hot selling</span>':''}<h3>${esc(p.name)}</h3></a><div class="price"><b>${inr(p.price)}</b><s>${inr(p.mrp)}</s></div><button ${p.stock<1?'disabled':''} onclick="addToCart(${p.id}).catch(e=>toast(e.message))">${p.stock<1?'Sold out':'Add to cart'}</button></div>`;
const reveal=()=>{if(window.gsap&&!rm)gsap.from('.card',{y:40,opacity:0,stagger:.05,duration:.5})};
document.body.insertAdjacentHTML('afterbegin',`<nav><a class="logo" href="/">Rayzex.Zone</a><div class="links"><a href="/shop.html">Shop</a><a href="/orders.html">My orders</a><a href="/admin.html" id="adm" hidden>Admin</a><a href="/cart.html" class="btn">Cart (<span id="cn">0</span>)</a><span id="ub"></span></div></nav>`);
document.body.insertAdjacentHTML('beforeend','<div id="toast" role="status"></div>');
ready.then(()=>{if(Clerk.user){Clerk.mountUserButton($('#ub'));refreshCart();api('/me').then(m=>{if(m.admin)$('#adm').hidden=false}).catch(()=>{})}
 else $('#ub').innerHTML=`<a href="/sign-in.html?next=${encodeURIComponent(location.pathname+location.search)}">Sign in</a>`});
document.addEventListener('mousemove',e=>{if(rm)return;const c=e.target.closest?.('.card');if(!c)return;const r=c.getBoundingClientRect();c.style.transform=`rotateY(${((e.clientX-r.left)/r.width-.5)*16}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*16}deg)`});
document.addEventListener('mouseout',e=>{const c=e.target.closest?.('.card');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
