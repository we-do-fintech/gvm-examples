var s="payment",l="paywall",y={paywall:`
<style>
  .gvm-paywall {
    border: 1px solid rgba(255, 185, 3, 0.45);
    border-radius: 14px;
    padding: 24px;
    margin: 16px 0;
    text-align: center;
    background: linear-gradient(
      135deg,
      rgba(255, 185, 3, 0.12) 0%,
      rgba(123, 44, 255, 0.08) 100%
    );
  }
  .gvm-paywall p {
    margin: 0 0 8px;
  }
  .gvm-paywall .gvm-muted {
    color: #666;
    font-size: 0.9rem;
  }
  .gvm-paywall button {
    margin-top: 4px;
    font-weight: 700;
    padding: 0.6rem 1.1rem;
    border-radius: 10px;
    border: none;
    background: #0b5fff;
    color: #fff;
    cursor: pointer;
  }
</style>
<div class="gvm-paywall">
  <p>Unlock the full article with GetViaMsg.</p>
  <p class="gvm-muted">
    <span data-gvm-bind-reading-time></span> min /
    <span data-gvm-bind-reading-words></span> words left.
  </p>
  <button data-gvm-bind-pay>
    Unlock for <span data-gvm-bind-price></span>
    <span data-gvm-bind-currency></span>
  </button>
</div>
`,payment:`
<style>
  dialog {
    border: 1px solid #1a1a1a;
    padding: 5px;
  }
  dialog .loader {
    width: 48px;
    height: 48px;
    display: inline-block;
    position: relative;
    color: #1a1a1a;
    border: 1px solid;
    box-sizing: border-box;
    animation: fill 2s linear infinite alternate;
  }
  @keyframes fill {
    0% {
      box-shadow: 0 0 inset;
    }
    100% {
      box-shadow: 0 -48px inset;
    }
  }
</style>
<dialog open>
  <div>
    <div>Time remaining: <span data-gvm-bind-time-remaining></span></div>
    <div>
      Price: <span data-gvm-bind-price></span>
      <span data-gvm-bind-currency></span>
    </div>
    <p
      data-gvm-bind-status
      data-gvm-bind-status-initializing="Generating QR"
      data-gvm-bind-status-waiting="Waiting for SMS"
      data-gvm-bind-status-duplicated="Duplicated"
      data-gvm-bind-status-resolved="Received! Unlocking content..."
      data-gvm-bind-status-rejected="Issue occurred. Please try again"
    ></p>
    <div>
      <span data-gvm-bind-qr>
        <span class="loader"></span>
      </span>
      <div>
        <button data-gvm-bind-send-sms>Send SMS</button>
        <button data-gvm-bind-cancel>Cancel</button>
      </div>
    </div>
  </div>
</dialog>
`};function c(t,n,e){if(!n)return;let r=y[n];if(!r||t.querySelector(`template[data-gvm-template="${n}"]`))return;let a=document.createElement("template");a.setAttribute("data-gvm-template",n),e&&a.setAttribute("data-gvm-template-inject-to",e),a.innerHTML=r,t.appendChild(a)}var b=[["price","data-gvm-price"],["currency","data-gvm-currency"],["hideStrategy","data-gvm-hide-strategy"],["hidePercent","data-gvm-hide-percent"],["hideSections","data-gvm-hide-sections"],["hideWords","data-gvm-hide-words"]];function o(t,n,e){e==null||e===""||t.setAttribute(n,String(e))}function h(t,n){o(t,"data-gvm-template-name",s),o(t,"data-gvm-hide-template-name",n.template??l);for(let[e,r]of b)o(t,r,n[e]);o(t,"data-gvm-metadata-title",n.metadata?.title),o(t,"data-gvm-metadata-url",n.metadata?.url)}function v(t,n,e){let r=n.articles?.[e];return!r||r.enabled===!1?null:(h(t,r),r)}var A={prod:{cfg:"cfg.gvm.wdft.ovh",overlay:"overlay.gvm.wdft.ovh"},qa:{cfg:"cfg.qa.gvm.wdft.ovh",overlay:"overlay.qa.gvm.wdft.ovh"},dev:{cfg:"cfg.dev.gvm.wdft.ovh",overlay:"overlay.dev.gvm.wdft.ovh"}};function g(t,n){let e=A[t];return e?{config:`https://${e.cfg}/${n}.json`,admin:`https://${e.overlay}`,adminScript:`https://${e.overlay}/gvm-admin.js`}:null}function w(){return document.querySelector("[data-gvm]")}function E(){return new URL("./gvm.js",import.meta.url).href}function x(t,n,e){let r=t.getAttribute("data-gvm-admin-src");return r?new URL(r,document.baseURI).href:g(n,e)?.adminScript??new URL("./gvm-admin.js",import.meta.url).href}function S(t,n){if(t.id)return t.id;let e=`gvm-${n.replace(/[^a-zA-Z0-9_-]/g,"-")}`;return t.id=e,e}async function p(){let t=w();if(!t){console.warn("gvm-overlay: [data-gvm] element not found");return}let n=t.getAttribute("data-gvm-tenant")??"",e=t.getAttribute("data-gvm-env")??"demo",r=t.getAttribute("data-gvm-config")??g(e,n)?.config;if(!r){console.warn(`gvm-overlay: cannot derive config URL for env "${e}"; set data-gvm-config`);return}let m;try{let a=await fetch(r);if(!a.ok)throw new Error(`config fetch failed with status ${a.status}`);m=await a.json()}catch(a){console.warn("gvm-overlay: failed to load config",a);return}c(t,s);for(let a of document.querySelectorAll("[data-gvm-reference]")){let i=a.getAttribute("data-gvm-reference");if(!i)continue;let d=v(a,m,i);if(!d)continue;let u=d.template??l,f=S(a,i);c(t,u,`#${CSS.escape(f)}`)}if(await import(E()),new URLSearchParams(location.search).get("gvm_admin")==="1"){let a=x(t,e,n),i=t.getAttribute("data-gvm-admin-api")??g(e,n)?.admin??new URL(".",a).origin;window.__GVM_ADMIN__={tenant:n,configUrl:r,apiUrl:i};try{await import(a)}catch(d){console.warn("gvm-overlay: failed to load admin editor",d)}}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{p()}):p();
