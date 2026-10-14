'use strict';
G.muted=false;
G.audio=(()=>{
  const A={ready:false,ctx:null,master:null,lp:null,amb:{},nb:null,hb:0};
  const ENV={none:{},night:{drone:.05,wind:.04},home:{drone:.03,wind:.015},forest:{drone:.07,wind:.07},yellow:{drone:.04,buzz:.07},school:{drone:.05,wind:.03,rain:.06},house:{drone:.07,buzz:.02,wind:.02},hell:{drone:.12,wind:.08,rumble:.1}};
  A.init=()=>{
    if(A.ready){if(A.ctx.state==='suspended')A.ctx.resume();return}
    try{
      const C=window.AudioContext||window.webkitAudioContext,c=A.ctx=new C();
      A.master=c.createGain();A.master.gain.value=G.muted?0:.9;
      A.lp=c.createBiquadFilter();A.lp.type='lowpass';A.lp.frequency.value=18000;
      A.master.connect(A.lp);A.lp.connect(c.destination);
      const len=c.sampleRate*2;A.nb=c.createBuffer(1,len,c.sampleRate);const d=A.nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      const mkG=()=>{const g=c.createGain();g.gain.value=0;g.connect(A.master);return g};
      // drone
      A.amb.drone=mkG();[48,72.5,96.3].forEach((f,i)=>{const o=c.createOscillator();o.type=i?'sine':'triangle';o.frequency.value=f;o.detune.value=i*6;o.connect(A.amb.drone);o.start()});
      // wind & rain & rumble from noise
      const nz=(type,freq,q)=>{const s=c.createBufferSource();s.buffer=A.nb;s.loop=true;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;const g=mkG();s.connect(f);f.connect(g);s.start();return{g,f}};
      const w=nz('bandpass',420,.6);A.amb.wind=w.g;const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.13;lg.gain.value=200;lfo.connect(lg);lg.connect(w.f.frequency);lfo.start();
      A.amb.rain=nz('highpass',3200,.4).g;A.amb.rumble=nz('lowpass',90,1).g;
      // buzz
      A.amb.buzz=mkG();[120,180.4].forEach(f=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;o.connect(lp);lp.connect(A.amb.buzz);o.start()});
      A.ready=true;
      setInterval(A.beat,90);
    }catch(e){A.ready=false}
  };
  A.setMuted=m=>{if(A.master)A.master.gain.value=m?0:.9};
  A.muffle=v=>{if(A.lp)A.lp.frequency.setTargetAtTime(v?380:18000,A.ctx.currentTime,.15)};
  A.ambience=k=>{if(!A.ready)return;const e=ENV[k]||{};for(const n in A.amb)A.amb[n].gain.setTargetAtTime(e[n]||0,A.ctx.currentTime,1.2)};
  let fear=0;A.setFear=f=>{fear=f};
  A.beat=()=>{
    if(!A.ready||G.paused||fear<.12)return;const now=A.ctx.currentTime;
    if(now<A.hb)return;A.hb=now+(1.1-fear*.7);
    A.tone(52,38,.18,'sine',.45*fear+.1,0);A.tone(46,34,.2,'sine',.35*fear+.08,.2);
  };
  A.tone=(f0,f1,dur,type,vol,delay=0)=>{
    if(!A.ready)return;const c=A.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(A.master);o.start(t);o.stop(t+dur+.05);
  };
  A.noise=(dur,type,f0,f1,vol,delay=0,q=1)=>{
    if(!A.ready)return;const c=A.ctx,t=c.currentTime+delay,s=c.createBufferSource();s.buffer=A.nb;
    const f=c.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);f.Q.value=q;
    const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(A.master);s.start(t,Math.random());s.stop(t+dur+.05);
  };
  // a rough, angry voice: voiced saw through two formants with bursts
  A.voice=(dur,pitch=95,vol=.3,delay=0)=>{
    if(!A.ready)return;const c=A.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(pitch,t);
    for(let i=0;i<dur*5;i++)o.frequency.linearRampToValueAtTime(pitch*(.8+Math.random()*.5),t+i*.2);
    const f1=c.createBiquadFilter();f1.type='bandpass';f1.Q.value=4;f1.frequency.setValueAtTime(600,t);
    for(let i=0;i<dur*5;i++)f1.frequency.linearRampToValueAtTime(400+Math.random()*500,t+i*.2);
    g.gain.setValueAtTime(0,t);
    for(let i=0;i<dur*4;i++){const a=t+i*.25;g.gain.linearRampToValueAtTime(vol*(.3+Math.random()*.7),a+.04);g.gain.linearRampToValueAtTime(vol*.1,a+.18)}
    g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(f1);f1.connect(g);g.connect(A.master);o.start(t);o.stop(t+dur+.05);
    A.noise(dur,'bandpass',900,700,vol*.5,delay,1.5);
  };
  G.sfx={
    step:run=>A.noise(.09,'lowpass',run?900:600,200,run?.16:.09),
    pick:()=>{A.tone(520,880,.16,'triangle',.18);A.tone(780,1180,.2,'sine',.1,.07)},
    click:()=>A.noise(.03,'highpass',2000,2000,.12),
    thud:(v=.6)=>{A.tone(90,28,.35,'sine',v);A.noise(.18,'lowpass',500,80,v*.6)},
    door:()=>{A.noise(.25,'lowpass',500,120,.3);A.tone(110,70,.2,'square',.07)},
    slam:()=>{A.noise(.4,'lowpass',900,60,.7);A.tone(70,24,.5,'sine',.7)},
    glass:()=>{A.noise(.5,'highpass',3000,6000,.35);for(let i=0;i<5;i++)A.tone(2200+Math.random()*2500,1800,.15,'triangle',.07,i*.04)},
    shout:(d=1.6,p=95,v=.32)=>A.voice(d,p,v),
    growl:()=>{A.voice(1.2,48,.38);A.tone(40,30,1.2,'sawtooth',.2)},
    scream:()=>{A.tone(900,1500,.9,'sawtooth',.18);A.tone(1130,1700,.9,'square',.1,.05);A.noise(.9,'bandpass',2000,3000,.2,0,2)},
    whisper:()=>A.noise(1.1,'bandpass',3200,2400,.1,0,3),
    bell:()=>{A.tone(392,390,2.2,'sine',.22);A.tone(784,780,1.6,'sine',.1)},
    stinger:()=>{A.tone(180,60,1.2,'sawtooth',.2);A.noise(1,'lowpass',2400,100,.4)},
    crackle:()=>A.noise(.05,'bandpass',1800+Math.random()*1500,1200,.07),
    wake:()=>{A.tone(300,120,1.3,'sine',.2);A.noise(1,'lowpass',1500,200,.18)},
    sob:()=>{for(let i=0;i<4;i++)A.tone(260-i*14,220-i*16,.35,'sine',.07,i*.6)}
  };
  return A;
})();
