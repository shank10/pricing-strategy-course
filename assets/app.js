/* Shared helpers for the Pricing Workshop pages */
(function(){
  'use strict';

  // ---------- number / currency formatting ----------
  window.inr = function(n, dec){
    if(n===null||n===undefined||isNaN(n)) return '—';
    dec = dec||0;
    return '₹' + Number(n).toLocaleString('en-IN',{maximumFractionDigits:dec, minimumFractionDigits:dec});
  };
  window.num = function(n, dec){
    dec = dec||0;
    return Number(n).toLocaleString('en-IN',{maximumFractionDigits:dec, minimumFractionDigits:dec});
  };
  window.pct = function(n, dec){ dec = (dec===undefined)?1:dec; return Number(n).toFixed(dec)+'%'; };

  // ---------- reveal on scroll ----------
  function initReveal(){
    var els = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in');}); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
    },{threshold:.15});
    els.forEach(function(e){ io.observe(e); });
  }

  // ---------- floating trainer timer ----------
  window.makeTimer = function(minutes){
    var total = (minutes||5)*60, left = total, running=false, iv=null;
    var el = document.createElement('div'); el.className='timer no-print';
    el.innerHTML = '<button data-a="down" title="-1 min">–</button>'+
                   '<div class="t">00:00</div>'+
                   '<button data-a="play" title="start/pause">▶</button>'+
                   '<button data-a="reset" title="reset">↺</button>';
    document.body.appendChild(el);
    var tEl = el.querySelector('.t'), playBtn = el.querySelector('[data-a=play]');
    function render(){
      var m=Math.floor(Math.abs(left)/60), s=Math.abs(left)%60;
      tEl.textContent=(left<0?'-':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
      el.classList.toggle('warn', left<=30);
    }
    function tick(){ left--; if(left<=-1){} render(); }
    el.addEventListener('click',function(e){
      var a=e.target.getAttribute('data-a'); if(!a)return;
      if(a==='play'){ running=!running; playBtn.textContent=running?'❚❚':'▶'; if(running){iv=setInterval(tick,1000);}else{clearInterval(iv);} }
      if(a==='reset'){ clearInterval(iv); running=false; playBtn.textContent='▶'; left=total; render(); }
      if(a==='down'){ total=Math.max(60,total-60); left=total; render(); }
    });
    render();
    return el;
  };

  // ---------- tiny toast ----------
  window.toast = function(msg){
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#0e1230;color:#fff;padding:12px 20px;border-radius:12px;z-index:200;box-shadow:0 10px 30px rgba(0,0,0,.3);font-weight:600;';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.transition='.4s'; t.style.opacity='0'; },1600);
    setTimeout(function(){ t.remove(); },2100);
  };

  // ---------- styled confirm modal (replaces native confirm, which Chrome can suppress) ----------
  window.confirmModal = function(msg, onYes, opts){
    opts = opts||{};
    var bg = document.createElement('div'); bg.className='modal-bg';
    bg.innerHTML = '<div class="box"><h3>'+(opts.title||'Are you sure?')+'</h3>'+
      '<p class="muted">'+msg+'</p>'+
      '<div class="row" style="justify-content:center;margin-top:6px">'+
      '<button class="btn secondary" data-a="no">'+(opts.no||'Cancel')+'</button>'+
      '<button class="btn" data-a="yes">'+(opts.yes||'Yes, continue')+'</button></div></div>';
    document.body.appendChild(bg);
    function close(){ bg.remove(); }
    bg.addEventListener('click', function(e){
      var a = e.target.getAttribute('data-a');
      if(e.target===bg || a==='no'){ close(); }
      if(a==='yes'){ close(); onYes&&onYes(); }
    });
  };

  // ---------- collapsible trainer notes (hidden on projector until the trainer taps) ----------
  function processTrainer(t){
    if(!t || t.dataset.tw) return; t.dataset.tw='1';
    var lbl = t.querySelector('.lbl');
    var body = document.createElement('div'); body.className='trainer-body';
    [].slice.call(t.childNodes).forEach(function(n){ if(n!==lbl) body.appendChild(n); });
    t.appendChild(body);
    if(lbl){ var h=document.createElement('span'); h.className='tw-hint'; h.textContent=' tap to reveal note'; lbl.appendChild(h); }
    t.classList.add('collapsible');
    t.addEventListener('click', function(e){
      // clicking a link or the revealed body shouldn't collapse it
      if(t.classList.contains('open') && (e.target.closest('.trainer-body'))) return;
      t.classList.toggle('open');
    });
  }
  function scanTrainers(root){
    var rt = root||document;
    if(rt.querySelectorAll) rt.querySelectorAll('.trainer:not([data-tw])').forEach(processTrainer);
  }
  // exposed so dynamically-rendered views (e.g. the simulation) can collapse notes
  // synchronously — before paint — instead of waiting for the async observer.
  window.collapseTrainers = scanTrainers;

  // ---------- copy to clipboard ----------
  window.copyText = function(text){
    if(navigator.clipboard){ navigator.clipboard.writeText(text).then(function(){toast('Copied ✓');}); }
    else { var ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copied ✓'); }
  };

  document.addEventListener('DOMContentLoaded', function(){
    initReveal();
    scanTrainers(document);
    // catch trainer notes added later (e.g. the simulation re-renders each round)
    if('MutationObserver' in window){
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          [].slice.call(m.addedNodes).forEach(function(n){
            if(n.nodeType!==1) return;
            if(n.classList && n.classList.contains('trainer')) processTrainer(n);
            scanTrainers(n);
          });
        });
      }).observe(document.body, {childList:true, subtree:true});
    }
  });
})();
