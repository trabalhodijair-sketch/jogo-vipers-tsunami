/* ================= TSUNAMI ZUMBI ================= */
const cv=document.getElementById('c'),g=cv.getContext('2d'),W=900,H=450,GY=380,HX=300,$=id=>document.getElementById(id),ov=$('ov');
let st='menu',n,dist,spd,ob,pt,py,vy,jumps,t=0,best=0,shake,spawnT,eaten,flash,last=0,act,ready,banner;
try{best=+localStorage.getItem('tzbest')||0}catch(e){}

/* ---------- habilidades (uma nova a cada 35 humanos) ---------- */
const AB=[{id:'mega',nome:'MEGA ZUMBI'},{id:'ima',nome:'ÍMÃ DE HUMANOS'},{id:'esc',nome:'ESCUDO'},{id:'voo',nome:'ASAS'}];
const AB_DUR=7,FEED=35;

/* ---------- áudio ---------- */
const vol={m:.5,s:.7,mute:false};
try{Object.assign(vol,JSON.parse(localStorage.getItem('tzvol')))}catch(e){}
let AC,mg,sg,mi,NB,step=0;
function applyVol(){if(!AC)return;mg.gain.value=vol.mute?0:vol.m*.5;sg.gain.value=vol.mute?0:vol.s*.6}
function audio(){
  if(!AC){
    AC=new(window.AudioContext||window.webkitAudioContext)();
    mg=AC.createGain();sg=AC.createGain();mg.connect(AC.destination);sg.connect(AC.destination);
    NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    applyVol();music(true);
  }
  if(AC.state==='suspended')AC.resume();
}
function tone(f,d,type,dest,f2,when,v){
  if(!AC)return;const t0=AC.currentTime+(when||0),o=AC.createOscillator(),e=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+d);
  e.gain.setValueAtTime(v||.8,t0);e.gain.exponentialRampToValueAtTime(.001,t0+d);
  o.connect(e);e.connect(dest);o.start(t0);o.stop(t0+d);
}
function noise(d,v,fq){
  if(!AC)return;const s=AC.createBufferSource(),f=AC.createBiquadFilter(),e=AC.createGain(),t0=AC.currentTime;
  s.buffer=NB;f.type='highpass';f.frequency.value=fq;e.gain.setValueAtTime(v,t0);e.gain.exponentialRampToValueAtTime(.001,t0+d);
  s.connect(f);f.connect(e);e.connect(mg);s.start(t0);s.stop(t0+d);
}
const sfx={
  jump:()=>tone(300,.18,'square',sg,640),
  eat:()=>{tone(180,.12,'sawtooth',sg,90);tone(520,.1,'triangle',sg,780,.05)},
  hit:()=>tone(160,.35,'sawtooth',sg,40),
  over:()=>[400,300,220,150].forEach((f,i)=>tone(f,.3,'triangle',sg,f*.8,i*.2)),
  click:()=>tone(660,.07,'square',sg,880),
  power:()=>[392,523,659,784].forEach((f,i)=>tone(f,.2,'square',sg,f*1.02,i*.08))
};
/* Música de fundo: baixo + arpejo em Lá menor; no jogo entram bateria e ritmo mais rápido.
   Os controles de volume da tela de Configurações ajustam esta música (canal "mg"). */
function seq(){
  const s=step++%64,root=[110,110,87.3,98][(s>>4)&3],pat=[1,1.5,2,1.5,1.2,1.5,2,2.4];
  if(s%4===0||s%8===3)tone(root,.25,'triangle',mg,root*.98,0,.9);
  tone(root*2*pat[s%8],.13,'square',mg,0,0,.16);
  if(st==='play'){
    if(s%4===0)tone(130,.18,'sine',mg,40,0,1);
    if(s%8===4)noise(.15,.5,1500);
    if(s%2===1)noise(.04,.25,7000);
    if(s%16===8)tone(root*4,.4,'sawtooth',mg,root*4.2,0,.12);
  }
}
function music(on){clearInterval(mi);mi=null;if(on&&AC)mi=setInterval(seq,60000/(st==='play'?150:112)/4)}

/* ---------- visual ---------- */
const BW=[60,44,80,50,70,40,90,56,48,76,64,52],BH=[.5,.9,.3,.7,1,.2,.6,.8,.4,1,.5,.75];
const stars=Array.from({length:45},(_,i)=>[(i*197)%W,(i*83)%230,1+(i%3)*.6]);
const sky=g.createLinearGradient(0,0,0,GY);sky.addColorStop(0,'#1d0f2e');sky.addColorStop(.6,'#5b1f5e');sky.addColorStop(1,'#ff7a59');
const shirts=['#3aa0ff','#ffd04a','#ff5d8f','#fff'];
/* cada zumbi tem pele, roupa, cabelo/boné e tamanho próprios */
const SK=['#7dcc2b','#9be53d','#5fb01f','#6fd0a0','#b6d94c','#8ac86a'],SH=['#e8344e','#3aa0ff','#ffd04a','#ff8a2a','#b46cff','#f0f0f0','#2ec4b6'],HR=['#2a1c44','#e8c15a','#c0392b','#dddddd','#5b3a29'];
const Z=Array.from({length:60},(_,i)=>({sk:SK[i%6],sh:SH[(i*3+1)%7],hr:HR[i%5],ht:[0,1,2,3,1,0,2,3][i%8],s:.9+((i*37)%20)/100,ph:i*1.7,eye:i%3,jx:((i*53)%11-5)*.8}));
const MZ={sk:'#7dcc2b',sh:'#ffd04a',hr:'#c0392b',ht:3,s:1,ph:0,eye:1};

/* ---------- jogo ---------- */
function reset(){n=5;dist=0;spd=300;ob=[];pt=[];py=0;vy=0;jumps=0;spawnT=.8;shake=0;eaten=0;flash=0;act=null;ready=[];banner=null}
function start(){reset();st='play';ov.classList.add('hide');music(true)}
function jump(){
  if(st!=='play'||(act&&AB[act.i].id==='voo'))return;
  if(py<=0){vy=640;jumps=1;sfx.jump()}else if(jumps<2){vy=540;jumps=2;sfx.jump()}
}
function useSkill(){
  if(st!=='play'||!ready.length||act)return;
  act={i:ready.shift(),t:AB_DUR};sfx.power();banner={s:AB[act.i].nome+' ATIVADO!',t:1.6};
}
function spawn(){
  const r=Math.random(),x=W+60;
  if(r<.42){const k=1+Math.floor(Math.random()*4);for(let i=0;i<k;i++)ob.push({k:'h',x:x+i*36,w:22,h:44,oy:0,col:shirts[(Math.random()*4)|0],ph:Math.random()*6})}
  else if(r<.54){const k=1+(Math.random()<.4);ob.push({k:'s',x,w:40*k,h:30,oy:0,dmg:3})}
  else if(r<.64)ob.push({k:'b',x,w:26,h:62,oy:0,dmg:2});
  else if(r<.72)ob.push({k:'f',x,w:38,h:46,oy:0,dmg:2});   /* fogueira */
  else if(r<.79)ob.push({k:'x',x,w:44,h:44,oy:0,dmg:2});   /* caixote */
  else if(r<.86)ob.push({k:'c',x,w:96,h:50,oy:0,dmg:5});   /* carro */
  else if(r<.94)ob.push({k:'d',x,w:56,h:28,oy:78,dmg:3});  /* drone: não pule alto! */
  else ob.push({k:'t',x,w:120,h:58,oy:0,dmg:6});           /* tanque */
}
function burst(x,y,c,m){for(let i=0;i<m;i++)pt.push({x,y,vx:(Math.random()-.5)*320,vy:-Math.random()*320,l:.6,c})}

function update(dt){
  t+=dt;
  if(banner){banner.t-=dt;if(banner.t<=0)banner=null}
  if(st!=='play'){dist+=70*dt;return}
  spd=Math.min(300+dist*.018,560);dist+=spd*dt;
  const A=act?AB[act.i].id:'',wing=A==='voo',mega=A==='mega',shield=A==='esc',ima=A==='ima';
  if(act){act.t-=dt;if(act.t<=0)act=null}
  if(wing){py+=(90-py)*Math.min(1,6*dt);vy=0;jumps=0}
  else if(py>0||vy>0){py+=vy*dt;vy-=1750*dt;if(py<=0){py=0;vy=0;jumps=0}}
  spawnT-=dt;if(spawnT<=0){spawn();spawnT=(300+Math.random()*320)/spd}
  const x0=HX-90,x1=mega?HX+170:HX+24;
  for(const o of ob){
    o.x-=(o.k==='h'?spd-95:spd)*dt;
    if(o.k==='h'&&ima&&o.x<HX+420)o.x-=420*dt;   /* ímã puxa humanos */
    if(o.dead)continue;
    if(x1>o.x&&x0<o.x+o.w){
      if(o.k==='h'){
        if(py<o.h||wing||ima||mega){
          o.dead=1;n++;eaten++;sfx.eat();burst(o.x,GY-20,'#c0173d',10);
          if(eaten%FEED===0){const i=(eaten/FEED-1)%AB.length;ready.push(i);banner={s:'NOVA HABILIDADE: '+AB[i].nome+'!',t:2.6};sfx.power()}
        }
      }else if(mega||shield){o.dead=1;shake=.25;sfx.hit();burst(o.x+o.w/2,GY-o.oy-20,'#ffd04a',14)}
      else if(py<o.oy+o.h&&py+52>o.oy){o.dead=1;n-=o.dmg;shake=.5;flash=.25;sfx.hit();burst(o.x+o.w/2,GY-o.oy-20,'#9be53d',14)}
    }
  }
  ob=ob.filter(o=>!o.dead&&o.x>-140);
  for(const p of pt){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=900*dt;p.l-=dt}
  pt=pt.filter(p=>p.l>0);
  shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt);
  if(n<=0)over();
}
function over(){
  st='over';const sc=Math.floor(dist/10)+eaten*5;
  if(sc>best){best=sc;try{localStorage.setItem('tzbest',best)}catch(e){}}
  sfx.over();music(true);
  $('d-over').textContent='Pontos: '+sc+' · Recorde: '+best+' · Humanos devorados: '+eaten;
  show('s-over');
}

/* ---------- desenho ---------- */
const tri=(a,b,c,d,e,f)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.lineTo(e,f);g.fill()};
function city(off,hmin,hr,col,k,win){
  let tot=0;BW.forEach(w=>tot+=w*k);
  let x=-(off%tot),j=0;
  while(x<W){
    const i=j%BW.length,w=BW[i]*k,h=hmin+BH[i]*hr;
    g.fillStyle=col;g.fillRect(x,GY-h,w+1,h);
    if(win){g.fillStyle='#ffd04a';
      for(let yy=GY-h+10;yy<GY-20;yy+=18)for(let xx=x+8;xx<x+w-12;xx+=16)
        if((i*7+Math.floor(yy/18)*3+Math.floor(xx/16))%6===0)g.fillRect(xx,yy,6,8)}
    x+=w;j++;
  }
}
function zom(x,y,z,s,run){
  g.save();g.translate(x,y);g.scale(s*z.s,s*z.s);
  const b=run?Math.sin(t*14+z.ph)*3:0;
  g.fillStyle='#2a1c44';g.fillRect(-7+b,-10,5,10);g.fillRect(2-b,-10,5,10);
  g.fillStyle=z.sh;g.fillRect(-9,-26,18,17);
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-9,-12,18,3);
  g.fillStyle=z.sk;g.fillRect(6,-24,14,4);g.beginPath();g.arc(1,-32,9,0,7);g.fill();
  g.fillStyle=z.hr;
  if(z.ht===1||z.ht===2){g.beginPath();g.arc(1,-33,9.5,Math.PI,0);g.fill();if(z.ht===2)g.fillRect(2,-38,13,3)}
  else if(z.ht===3){g.fillRect(-2,-45,3,7);g.fillRect(2,-47,3,9);g.fillRect(6,-45,3,7)}
  else{g.fillRect(-4,-41,9,1.5)}
  g.fillStyle='#fff';g.beginPath();g.arc(5,-34,3.2,0,7);g.fill();
  if(z.eye!==0){g.beginPath();g.arc(-2,-34,2.6,0,7);g.fill();g.fillStyle='#000';g.beginPath();g.arc(-1,-34,1.2,0,7);g.fill()}
  g.fillStyle='#000';g.beginPath();g.arc(6.5,-34,1.5,0,7);g.fill();
  g.fillStyle='#2a1c44';g.fillRect(1,-28,7,2);
  g.restore();
}
function human(o){
  const x=o.x+11,y=GY,b=Math.sin(t*16+o.ph)*4;
  g.fillStyle='#2a1c44';g.fillRect(x-6+b,y-14,5,14);g.fillRect(x+1-b,y-14,5,14);
  g.fillStyle=o.col;g.fillRect(x-8,y-32,16,19);
  g.fillStyle='#f2c79a';g.beginPath();g.arc(x,y-39,8,0,7);g.fill();
  g.fillRect(x-12,y-34-Math.abs(b),4,12);g.fillRect(x+8,y-34-Math.abs(b),4,12);
  g.fillStyle='#000';g.fillRect(x-4,y-41,2,3);g.fillRect(x+2,y-41,2,3);
  g.beginPath();g.arc(x,y-35,2.5,0,7);g.fill();
}
function obst(o){
  const x=o.x,w=o.w;
  if(o.k==='s'){g.fillStyle='#b9b4c9';for(let a=x;a<x+w;a+=20)tri(a,GY,a+10,GY-30,a+20,GY);
    g.fillStyle='#e9e6f5';for(let a=x;a<x+w;a+=20)tri(a+10,GY-30,a+10,GY,a+20,GY)}
  else if(o.k==='b'){g.fillStyle='#ff8a2a';g.fillRect(x,GY-62,w,62);g.fillStyle='#1d0f2e';
    for(let y=GY-54;y<GY-8;y+=22)g.fillRect(x,y,w,9);g.fillStyle='#6b5a86';g.fillRect(x+10,GY-8,6,8)}
  else if(o.k==='c'){g.fillStyle='#e8344e';g.fillRect(x,GY-34,w,26);g.fillRect(x+22,GY-50,50,20);
    g.fillStyle='#bfe6ff';g.fillRect(x+28,GY-46,18,12);g.fillRect(x+50,GY-46,16,12);
    g.fillStyle='#111';[18,76].forEach(d=>{g.beginPath();g.arc(x+d,GY-8,10,0,7);g.fill()});
    g.fillStyle='#ffd04a';g.fillRect(x+w-6,GY-30,6,8)}
  else if(o.k==='f'){const f=Math.sin(t*20+x)*4;g.fillStyle='#5b3a29';g.fillRect(x,GY-8,w,8);
    g.fillStyle='#ff5d2a';tri(x+2,GY-8,x+w/2+f,GY-46,x+w-2,GY-8);
    g.fillStyle='#ffd04a';tri(x+10,GY-8,x+w/2-f/2,GY-30,x+w-10,GY-8)}
  else if(o.k==='x'){g.fillStyle='#a8743a';g.fillRect(x,GY-44,w,44);g.strokeStyle='#6b4520';g.lineWidth=3;
    g.strokeRect(x+1.5,GY-42.5,w-3,41);g.beginPath();g.moveTo(x,GY-44);g.lineTo(x+w,GY);g.moveTo(x+w,GY-44);g.lineTo(x,GY);g.stroke()}
  else if(o.k==='d'){const y=GY-o.oy-o.h+Math.sin(t*6+x)*4;
    g.fillStyle='#3b3b55';g.fillRect(x+8,y+10,40,14);g.fillRect(x+24,y+4,8,8);
    g.fillStyle='#cfcfe0';g.fillRect(x+(Math.sin(t*40)>0?0:8),y+2,w-(Math.sin(t*40)>0?0:16),3);
    g.fillStyle='#ff3030';g.beginPath();g.arc(x+28,y+18,3,0,7);g.fill();g.fillStyle='#3b3b55';g.fillRect(x+12,y+24,3,5);g.fillRect(x+41,y+24,3,5)}
  else if(o.k==='t'){g.fillStyle='#2a2a2a';g.fillRect(x,GY-18,w,18);
    g.fillStyle='#5a6b3c';g.fillRect(x+8,GY-36,w-16,20);g.fillRect(x+34,GY-56,48,20);g.fillRect(x-16,GY-48,52,6);
    g.fillStyle='#444';for(let a=x+12;a<x+w-6;a+=22){g.beginPath();g.arc(a,GY-9,7,0,7);g.fill()}
    g.fillStyle='#ffd04a';g.fillRect(x+54,GY-48,8,6)}
}
function hud(){
  g.font="26px 'Luckiest Guy',Impact,sans-serif";g.lineWidth=5;g.strokeStyle='#1d0f2e';g.lineJoin='round';
  const L=(s,x,y,c,al)=>{g.textAlign=al;g.strokeText(s,x,y);g.fillStyle=c;g.fillText(s,x,y)};
  L('ZUMBIS '+n,18,38,'#9be53d','left');
  L(Math.floor(dist/10)+' m',W/2,38,'#fff','center');
  L('RECORDE '+best,W-18,38,'#ffd04a','right');
  /* barra de progresso da próxima habilidade */
  const p=(eaten%FEED)/FEED;
  g.font="16px 'Luckiest Guy',Impact,sans-serif";L('HABILIDADE '+(eaten%FEED)+'/'+FEED,18,64,'#fff','left');
  g.fillStyle='#1d0f2e';g.fillRect(18,70,150,10);g.fillStyle='#ffd04a';g.fillRect(19,71,148*p,8);
  if(act){g.font="20px 'Luckiest Guy',Impact,sans-serif";L(AB[act.i].nome,W/2,66,'#ffd04a','center');
    g.fillStyle='#1d0f2e';g.fillRect(W/2-80,72,160,10);g.fillStyle='#9be53d';g.fillRect(W/2-79,73,158*act.t/AB_DUR,8)}
  if(banner){g.font="34px 'Luckiest Guy',Impact,sans-serif";L(banner.s,W/2,150,'#ff5d8f','center')}
}
function draw(){
  g.save();
  if(shake>0)g.translate((Math.random()-.5)*shake*14,(Math.random()-.5)*shake*14);
  g.fillStyle=sky;g.fillRect(0,0,W,H);
  g.fillStyle='#fff';stars.forEach(s=>{g.globalAlpha=.4+.4*Math.sin(t+s[0]);g.fillRect(s[0],s[1],s[2],s[2])});g.globalAlpha=1;
  g.fillStyle='#ffe9a8';g.beginPath();g.arc(740,90,34,0,7);g.fill();
  g.fillStyle='#5b1f5e';g.beginPath();g.arc(752,82,30,0,7);g.fill();
  city(dist*.12,90,120,'#3a1650',1.1,0);
  city(dist*.3,50,130,'#241036',1.4,1);
  g.fillStyle='#2b1646';g.fillRect(0,GY,W,H-GY);
  g.fillStyle='#4b2a73';g.fillRect(0,GY,W,6);
  g.fillStyle='#ffd04a';for(let x=-(dist%80);x<W;x+=80)g.fillRect(x,GY+36,40,5);
  for(const o of ob){o.k==='h'?human(o):obst(o)}
  const A=act?AB[act.i].id:'';
  if(A==='voo'){for(const d of [-1,1]){g.save();g.translate(HX-100,GY-py-70);g.rotate(d*(.5+Math.sin(t*14)*.3));g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(0,-45,16,70,0,0,7);g.fill();g.restore()}}
  /* horda: zumbis espaçados em 4 faixas de profundidade, cada um com visual próprio */
  const vis=Math.min(n,36);
  for(let lane=0;lane<4;lane++)for(let i=lane;i<vis;i+=4){
    const col=(i-lane)/4,x=HX-col*30-lane*9+Z[i].jx+Math.sin(t*2+i*2.1)*4,gy=GY+lane*7;
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,gy,11-py/25,3,0,0,7);g.fill();
    zom(x,gy-py-(py>0?0:Math.abs(Math.sin(t*10+Z[i].ph))*2),Z[i],1+lane*.04,py<=0||A==='voo');
  }
  if(A==='mega')zom(HX+60,GY+10-py,MZ,3.3,true);
  if(A==='esc'){g.fillStyle='rgba(58,160,255,.14)';g.strokeStyle='rgba(120,200,255,.8)';g.lineWidth=4;g.beginPath();g.ellipse(HX-70,GY-py-35,200,85,0,0,7);g.fill();g.stroke()}
  if(A==='ima'){g.strokeStyle='rgba(255,93,143,'+(.5+.3*Math.sin(t*10))+')';g.lineWidth=4;for(let r=0;r<3;r++){g.beginPath();g.arc(HX+30,GY-py-35,40+((t*120+r*40)%120),-1,1);g.stroke()}}
  for(const p of pt){g.globalAlpha=Math.max(0,p.l*1.6);g.fillStyle=p.c;g.fillRect(p.x,p.y,5,5)}g.globalAlpha=1;
  if(flash>0){g.fillStyle='rgba(255,40,80,'+flash*1.4+')';g.fillRect(0,0,W,H)}
  g.restore();
  if(st==='play')hud();
  const sb=$('skill'),show2=st==='play'&&ready.length&&!act;sb.hidden=!show2;
  if(show2)sb.textContent='⚡ '+AB[ready[0]].nome+(ready.length>1?' ×'+ready.length:'')+' (E)';
}
function loop(ts){const dt=Math.min((ts-last)/1000||0,.033);last=ts;update(dt);draw();requestAnimationFrame(loop)}
reset();requestAnimationFrame(loop);

/* ---------- menus e controles ---------- */
function show(id){ov.classList.remove('hide');document.querySelectorAll('.sc').forEach(s=>s.hidden=s.id!==id)}
const on=(id,f)=>$(id).addEventListener('click',()=>{audio();sfx.click();f()});
on('b-play',start);on('b-again',start);
on('b-set',()=>show('s-set'));
on('b-back',()=>show('s-menu'));
on('b-menu',()=>{reset();st='menu';show('s-menu');music(true)});
on('b-exit',()=>{music(false);show('s-bye');try{window.close()}catch(e){}});
on('b-hello',()=>{music(true);show('s-menu')});
$('r-m').value=vol.m*100;$('r-s').value=vol.s*100;$('c-mute').checked=vol.mute;
function saveVol(){try{localStorage.setItem('tzvol',JSON.stringify(vol))}catch(e){}applyVol()}
$('r-m').oninput=e=>{vol.m=e.target.value/100;saveVol()};
$('r-s').oninput=e=>{vol.s=e.target.value/100;saveVol()};
$('r-s').onchange=()=>sfx.click();
$('c-mute').onchange=e=>{vol.mute=e.target.checked;saveVol()};
$('skill').addEventListener('pointerdown',e=>{e.stopPropagation();useSkill()});
$('wrap').addEventListener('pointerdown',()=>{audio();jump()});
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','KeyW'].includes(e.code)&&st==='play'){e.preventDefault();jump()}
  if((e.code==='KeyE'||e.code==='ShiftLeft')&&st==='play')useSkill();
  if(e.code==='Escape'&&st==='play'){reset();st='menu';show('s-menu');music(true)}
});