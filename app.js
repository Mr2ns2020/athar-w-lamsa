(()=>{
"use strict";

const products=window.ATHAR_PRODUCTS||[];
const grid=document.querySelector("#product-grid");
const filters=document.querySelector("#filters");
const search=document.querySelector("#product-search");
const summary=document.querySelector("#results-summary");
const empty=document.querySelector("#empty-state");
const more=document.querySelector("#show-more");
const drawer=document.querySelector("#cart-drawer");
const backdrop=document.querySelector(".drawer-backdrop");
const cartItems=document.querySelector("#cart-items");
const cartEmpty=document.querySelector("#cart-empty");
const cartFooter=document.querySelector("#cart-footer");
const totalNode=document.querySelector("#cart-total");
const toast=document.querySelector("#toast");
const optionsModal=document.querySelector("#product-options-modal");
const optionsBackdrop=document.querySelector(".options-backdrop");
const optionsForm=document.querySelector("#product-options-form");
const optionName=document.querySelector("#option-product-name");
const optionImage=document.querySelector("#option-product-image");
const sizeSelect=document.querySelector("#option-size");
const colorSelect=document.querySelector("#option-color");
const fmt=new Intl.NumberFormat("ar-SA");
const PAGE=12;
const WA="966551902949";

let type="الكل";
let limit=PAGE;
let pendingProduct=null;
let cart=readCart();

function esc(value){
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

function optionValues(product){
  if(product.sizes||product.colors){
    return {sizes:product.sizes||["مقاس قياسي"],colors:product.colors||["حسب الصورة"]};
  }
  if(product.type==="تيشيرتات"){
    return {sizes:["S","M","L","XL","2XL","3XL"],colors:["أسود","أبيض","بيج","رمادي","كحلي"]};
  }
  if(product.type==="أكواب"){
    return {sizes:["قياسي 11 أونصة"],colors:["أبيض","أسود","حسب الصورة"]};
  }
  if(product.type==="كفرات"){
    return {sizes:["موديل الجهاز يحدد عبر واتساب"],colors:["حسب الصورة","أسود","شفاف","أخرى"]};
  }
  if(product.type==="استيكرات"){
    return {sizes:["باقة قياسية"],colors:["حسب الصورة","ألوان متعددة"]};
  }
  return {sizes:["مقاس قياسي","مقاس آخر يحدد عبر واتساب"],colors:["حسب الصورة","أسود","أبيض","أخرى"]};
}

function defaultOptions(product){
  const values=optionValues(product);
  return {size:values.sizes[0],color:values.colors[0]};
}

function cartKey(id,size,color){
  return `${id}::${size}::${color}`;
}

function readCart(){
  try{
    const raw=JSON.parse(localStorage.getItem("atharCart"))||{};
    const normalized={};
    Object.entries(raw).forEach(([key,value])=>{
      if(typeof value==="number"){
        const product=products.find(item=>item.id===key);
        if(!product)return;
        const defaults=defaultOptions(product);
        const variant=cartKey(key,defaults.size,defaults.color);
        normalized[variant]={id:key,size:defaults.size,color:defaults.color,quantity:value};
        return;
      }
      if(value&&typeof value==="object"&&value.id){
        const quantity=Math.max(1,Number(value.quantity)||1);
        const product=products.find(item=>item.id===value.id);
        if(!product)return;
        const defaults=defaultOptions(product);
        const size=value.size||defaults.size;
        const color=value.color||defaults.color;
        normalized[cartKey(value.id,size,color)]={id:value.id,size,color,quantity};
      }
    });
    return normalized;
  }catch{
    return {};
  }
}

function saveCart(){
  localStorage.setItem("atharCart",JSON.stringify(cart));
  renderCart();
}

function matches(){
  const query=search.value.trim().toLocaleLowerCase("ar");
  return products.filter(product=>(type==="الكل"||product.type===type)&&(!query||`${product.name} ${product.type} ${product.category}`.toLocaleLowerCase("ar").includes(query)));
}

function card(product){
  const stickerClass=product.type==="استيكرات"?" sticker-image":"";
  const buttonLabel=product.type==="استيكرات"?"اختر المقاس":"اختر المقاس واللون";
  return `<article class="product-card"><div class="product-image${stickerClass}"><img src="${esc(product.image)}" alt="${esc(product.name)}" width="480" height="480" loading="lazy" decoding="async"></div><div class="product-info"><div class="product-meta"><span>${esc(product.type)}</span><span>${esc(product.category)}</span></div><h3>${esc(product.name)}</h3><div class="product-buy"><span class="price">${fmt.format(product.price)} ر.س</span><button class="add-button" type="button" data-add="${product.id}">${buttonLabel}</button></div></div></article>`;
}

function renderProducts(){
  const all=matches();
  const shown=all.slice(0,limit);
  grid.innerHTML=shown.map(card).join("");
  summary.textContent=`عرض ${fmt.format(shown.length)} من ${fmt.format(all.length)} منتج`;
  empty.hidden=all.length!==0;
  more.hidden=shown.length>=all.length;
}

function buildFilters(){
  const types=["الكل",...new Set(products.map(product=>product.type))];
  filters.innerHTML=types.map((name,index)=>`<button class="filter${index?"":" active"}" type="button" data-filter="${esc(name)}">${esc(name)}</button>`).join("");
}

function announce(message){
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(announce.timer);
  announce.timer=setTimeout(()=>toast.classList.remove("show"),2200);
}

function fillSelect(select,values){
  select.innerHTML=values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("");
}

function openOptions(id){
  const product=products.find(item=>item.id===id);
  if(!product)return;
  pendingProduct=product;
  const values=optionValues(product);
  optionName.textContent=product.name;
  optionImage.src=product.image;
  optionImage.alt=product.name;
  fillSelect(sizeSelect,values.sizes);
  fillSelect(colorSelect,values.colors);
  optionsModal.hidden=false;
  optionsModal.setAttribute("aria-hidden","false");
  optionsBackdrop.hidden=false;
  document.body.classList.add("options-open");
  sizeSelect.focus();
}

function closeOptions(){
  optionsModal.hidden=true;
  optionsModal.setAttribute("aria-hidden","true");
  optionsBackdrop.hidden=true;
  document.body.classList.remove("options-open");
  pendingProduct=null;
}

function addSelected(){
  if(!pendingProduct)return;
  const size=sizeSelect.value;
  const color=colorSelect.value;
  const key=cartKey(pendingProduct.id,size,color);
  if(cart[key]){
    cart[key].quantity+=1;
  }else{
    cart[key]={id:pendingProduct.id,size,color,quantity:1};
  }
  const name=pendingProduct.name;
  saveCart();
  closeOptions();
  announce(`تمت إضافة ${name} — ${size} — ${color}`);
}

function rows(){
  return Object.entries(cart).map(([key,item])=>({
    key,
    product:products.find(product=>product.id===item.id),
    size:item.size,
    color:item.color,
    quantity:item.quantity
  })).filter(row=>row.product);
}

function renderCart(){
  const data=rows();
  const count=data.reduce((sum,row)=>sum+row.quantity,0);
  const total=data.reduce((sum,row)=>sum+row.product.price*row.quantity,0);
  document.querySelectorAll(".cart-count").forEach(node=>node.textContent=fmt.format(count));
  cartItems.innerHTML=data.map(({key,product,size,color,quantity})=>`<article class="cart-item"><img src="${esc(product.image)}" alt="" width="70" height="70"><div><h3>${esc(product.name)}</h3><p class="cart-variant">المقاس: ${esc(size)} · اللون: ${esc(color)}</p><p>${fmt.format(product.price)} ر.س</p><div class="qty"><button type="button" data-qty="-1" data-key="${esc(key)}" aria-label="تقليل الكمية">−</button><b>${fmt.format(quantity)}</b><button type="button" data-qty="1" data-key="${esc(key)}" aria-label="زيادة الكمية">+</button></div></div><button class="remove-item" type="button" data-remove="${esc(key)}" aria-label="حذف المنتج">×</button></article>`).join("");
  cartEmpty.hidden=data.length>0;
  cartFooter.hidden=data.length===0;
  totalNode.textContent=`${fmt.format(total)} ر.س`;
}

function openCart(){
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden","false");
  backdrop.hidden=false;
  document.body.classList.add("drawer-open");
}

function closeCart(){
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden","true");
  backdrop.hidden=true;
  document.body.classList.remove("drawer-open");
}

function changeQuantity(key,delta){
  if(!cart[key])return;
  cart[key].quantity+=delta;
  if(cart[key].quantity<=0)delete cart[key];
  saveCart();
}

function send(){
  const data=rows();
  if(!data.length)return;
  const total=data.reduce((sum,row)=>sum+row.product.price*row.quantity,0);
  const lines=data.map((row,index)=>`${index+1}) ${row.product.name} — المقاس: ${row.size} — اللون: ${row.color} — الكمية: ${row.quantity} — ${row.product.price*row.quantity} ر.س`);
  const message=["مرحبًا أثر ولمسة، أرغب في طلب المنتجات التالية:","",...lines,"",`الإجمالي المبدئي: ${total} ر.س`,"","أرغب في تأكيد التوفر والتوصيل."].join("\n");
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`,"_blank","noopener");
}

filters.addEventListener("click",event=>{
  const button=event.target.closest("[data-filter]");
  if(!button)return;
  type=button.dataset.filter;
  limit=PAGE;
  filters.querySelectorAll(".filter").forEach(node=>node.classList.toggle("active",node===button));
  renderProducts();
});
search.addEventListener("input",()=>{limit=PAGE;renderProducts()});
more.addEventListener("click",()=>{limit+=PAGE;renderProducts()});
grid.addEventListener("click",event=>{
  const button=event.target.closest("[data-add]");
  if(button)openOptions(button.dataset.add);
});
optionsForm.addEventListener("submit",event=>{
  event.preventDefault();
  addSelected();
});
document.querySelectorAll("[data-close-options]").forEach(node=>node.addEventListener("click",closeOptions));
cartItems.addEventListener("click",event=>{
  const quantityButton=event.target.closest("[data-qty]");
  const removeButton=event.target.closest("[data-remove]");
  if(quantityButton)changeQuantity(quantityButton.dataset.key,Number(quantityButton.dataset.qty));
  if(removeButton){delete cart[removeButton.dataset.remove];saveCart()}
});
document.querySelectorAll("[data-open-cart]").forEach(node=>node.addEventListener("click",openCart));
document.querySelectorAll("[data-close-cart]").forEach(node=>node.addEventListener("click",closeCart));
document.querySelector("#send-order").addEventListener("click",send);
document.querySelector("#clear-cart").addEventListener("click",()=>{cart={};saveCart()});
document.addEventListener("keydown",event=>{
  if(event.key!=="Escape")return;
  if(!optionsModal.hidden)closeOptions();
  else closeCart();
});
document.querySelector(".menu-toggle").addEventListener("click",event=>{
  const menu=document.querySelector("#nav-links");
  const open=menu.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded",String(open));
});
document.querySelectorAll("#nav-links a").forEach(link=>link.addEventListener("click",()=>document.querySelector("#nav-links").classList.remove("open")));

document.querySelector("#year").textContent=new Date().getFullYear().toLocaleString("ar-SA",{useGrouping:false});
buildFilters();
renderProducts();
renderCart();
})();
