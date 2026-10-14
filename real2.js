'use strict';
G.real={};
const say=(who,t,ms)=>['say',who,t,ms||3000],nar=(t,ms)=>['say',null,t,ms||3200];
const BED=[-3.0,-1.1],TBL=[.4,.9],KIT=[3.0,-.9];
async function putDad(x,z){G.dad.g.position.set(x,0,z);G.dad.g.visible=true;G.dad.tx=x;G.dad.tz=z}
function sleepBeats(){return[['still',true],['eyes'],['fade',1,300]]}

/* ---------- HOME ---------- */
G.real.home={
1:()=>G.beats([
  nar('(Evening. The tin roof ticks as it cools.)'),['obj','Help Mama in the kitchen'],['reach',2.0,-1.0,2.4],
  say('Mama','Kabir, beta. Bring the plates from the table.'),['obj','Bring Mama the plates'],['use',TBL[0],TBL[1],'Take the plates'],
  ['sfx','pick'],['held','plates'],nar('(Two plates. A third one, covered, waits for Papa.)'),['use',KIT[0],KIT[1],'Give Mama the plates'],['held',null],['sfx','pick'],
  say('Mama','Wash your hands. Eat quickly. Before he comes.'),nar('(She says it the way other mothers say: take an umbrella.)',3600),
  ['obj','Eat with Mama'],['use',TBL[0],TBL[1],'Sit and eat'],['sit'],['eat'],['stand'],
  nar('(The roti is thin. You eat all of it. You are still hungry.)',3600),say('Mama','Eat mine too. I already ate.'),nar('(She did not.)',2200),
  ['sfx','door'],['shake',.04,.4],nar('(Keys in the lock, far below. Heavy steps on the stairs. Mama goes pale.)',3600),
  say('Mama','Go to your bed. Cover your ears. Whatever you hear, do not come out.',3800),['mom',2.6,-.8],
  ['obj','Go to your bed'],['use',BED[0],BED[1],'Lie down'],['lie'],['wait',700],
  ['muffle',true],['sfx','slam'],['sfx','shout',1.6,88,.38],say('Papa','Where is my dinner?!',2400),
  say('Mama','It is ready. Please. Kabir is sleeping.',2800),['sfx','glass'],['shake',.06,.5],
  nar('(Something breaks. Then something heavier. Then nothing, and then Mama, trying not to be loud.)',4200),
  ['sfx','thud',.7],say('Kabir','Please stop. Please stop. Please stop.',3400),['sfx','sob'],['wait',800],['fade',1,2400],
  ['card',[{t:'Sleep comes like a mercy.',hi:true}],{auto:3600}]
]),
2:async()=>{
  await G.beats([
    nar('(Home. The same tin roof. The same quiet that is not peace.)',3400),['obj','Help Mama'],['reach',2.0,-1.0,2.4],
    say('Mama','Eighty rupees. It has to last until Sunday.'),say('Mama','Kabir, hide the tin box in the rice jar. Quickly.',3200),
    ['obj','Hide the money in the rice jar'],['use',1.7,-1.7,'Hide the tin box in the rice jar'],['sfx','pick'],
    say('Mama','If he asks, there is none. Say it with me.',3000),say('Kabir','There is none.',1800),
    ['sfx','slam'],['shake',.05,.4],nar('(The door. Early. He is early.)',2600),say('Mama','Under the bed. Now. Not a sound.',2600),['obj','Hide under the bed']
  ]);
  const it=G.addItem({x:BED[0],z:BED[1],r:2.6,label:'Hide under the bed',hide:{x:-3.4,z:-2.0,eye:.28}});
  await new Promise(res=>{const f=()=>{if(G.P.hidden){G.ticks.splice(G.ticks.indexOf(f),1);res()}};G.ticks.push(f)});
  G.rmItem(it);G.obj('Stay hidden');G.lookAt(0,-.2,.35);await putDad(4.1,1.2);
  await G.beats([['sfx','slam'],['sfx','shout',1.4,90,.4],say('Papa','Where is it?! I know you have money!',2800)]);
  G.dad.go(1.6,-.2);await G.wait(2600);
  await G.beats([say('Mama','There is none. Please...',2200),['sfx','thud',.8],['shake',.08,.5],['sfx','glass'],
    nar('(Something falls. Mama makes a sound she tries to swallow.)',3600)]);
  G.dad.go(-2.3,-1.3);await G.wait(3600);
  await G.beats([nar('(His feet stop beside the bed. Bare feet, cracked heels. A bottle, clinking at his side.)',4200),['wait',2600],say('Papa','Useless. Both of you.',2400)]);
  await G.dad.go(4.1,1.2);G.sfx.slam();G.dad.g.visible=false;
  await G.beats([nar('(Silence. You count to a hundred. Then a hundred more.)',4000),['obj','Leave your hiding place']]);
  await new Promise(res=>{const f=()=>{if(!G.P.hidden){G.ticks.splice(G.ticks.indexOf(f),1);res()}};G.ticks.push(f)});
  G.P.lookT=null;G.mom.go(2.4,-.1);
  await G.beats([['obj','Go to Mama'],['reach',1.9,-.1,2.3],['choice','Hug Mama','Bring Mama water',
    [nar('(She holds you too tightly for a second, then lets go.)',3000)],[['sfx','pick'],nar('(Her hand shakes around the steel glass.)',3000)]],
    say('Mama','I am fine, beta. I walked into the door.',3400),nar('(Mama is not good at lying. She has had so much practice.)',3800),
    say('Mama','Sleep. Mama is here.',2400),...sleepBeats(),['card',[{t:'Mama is here.',hi:true},{t:'It is the only promise she can keep.'}],{auto:4200}]]);
},
3:async()=>{
  await G.beats([nar('(Homework at the low table. The pencil is almost too short to hold.)',3600),['obj','Do your homework'],['use',TBL[0],TBL[1],'Do your homework'],
    nar('(Seven sums. Seven correct. You want to show someone.)',3200),['sfx','slam'],['shake',.05,.4]]);
  await putDad(4.0,1.0);
  await G.beats([nar('(Too early again. The smell of him reaches the room before he does.)',3200),['sfx','shout',1,92,.42],say('Papa','KABIR!',1600),
    say('Mama','He is only a child. Please...',2400),['obj','Papa is calling you']]);
  G.dad.go(3.3,.8);await G.reach(2.6,.8,1.7);
  await G.beats([['still',true],['look',3.3,.8,1.5],nar('(You do not remember what you did wrong. You never do.)',3600),['sfx','thud',.8],['shake',.14,.6],['fade',1,250],
    ['sfx','shout',1,90,.4],say('Mama','Not him! Not him! Please!',2600),['sfx','thud',.6],['sfx','sob'],['wait',1600],
    ['card',[{t:'Some nights there is a reason.'},{t:'Some nights there is not.',hi:true}],{auto:4600}]]);
  G.dad.g.visible=false;G.P.lookT=null;G.P.x=-2.6;G.P.z=-.6;G.P.yaw=Math.PI/2;G.mom.go(-2.4,-.6);
  await G.fade(0,1600);
  await G.beats([['still',false],nar('(Later. The bulb is off. Mama sits beside your bed with a small tin of ointment.)',4000),['obj','Let Mama care for you'],
    ['use',BED[0],BED[1],'Let Mama put the ointment'],say('Mama','Hold still, beta. It will sting a little.',2800),nar('(Her hands shake more than yours do.)',3200),
    say('Mama','Close your eyes. When you open them, it will be morning.',3600),...sleepBeats(),['card',[{t:'It was never morning in his dreams.',hi:true}],{auto:3600}]]);
},
4:()=>G.beats([
  nar('(Mama is quiet in a different way today. Like someone who has decided something.)',4000),['obj','Sit with Mama'],['reach',2.0,-.6,2.4],
  say('Mama','Kabir. Listen carefully, beta.',2200),say('Mama','Nani\'s house has a yard. A tree. A tap that always has water.',3800),
  say('Mama','Soon, when the time is right, we are going there.',3200),
  ['choice','Will Papa come?','Okay, Mama.',[say('Mama','No, beta. Papa will not come. Not ever.',3200),say('Mama','Is that all right?',2000)],[say('Mama','My brave boy.',2400)]],
  say('Mama','Until then, keep your bag ready, and keep your voice small.',3600),['obj','Pack your schoolbag'],['use',-2.5,-.7,'Pack your schoolbag'],['sfx','pick'],
  nar('(Two shirts. A notebook. Your good pencil.)',3200),['sfx','door'],
  nar('(Papa comes home late. He does not shout. He lies down on the floor, and the room fills with the smell of him.)',4800),
  say('Mama','Shh. Tonight, we are lucky.',2600),nar('(You have learned to count luck the way you count coins.)',3400),
  ...sleepBeats(),['card',[{t:'Luck is a thin blanket.',hi:true}],{auto:3400}]
]),
5:()=>G.beats([
  nar('(The bag by the door. Mama has packed hers, too. It is smaller than yours.)',4000),['obj','Wait for Mama'],['reach',2.0,-.6,2.4],
  say('Mama','Tonight. When he is asleep. I will wake you at midnight.',3800),say('Mama','Sleep a little first, beta. The road is long.',3200),
  say('Mama','Here. One more star. I made it for the road.',3200),['sfx','pick'],
  nar('(Folded very small. Inside, in her handwriting: "I love you more than all of this.")',4600),
  ['obj','Go to bed'],['use',BED[0],BED[1],'Lie down'],['lie'],['wait',600],
  say('Mama','Sleep, Kabir. I am right here.',3000),['wait',800],['fade',1,2600],
  ['card',[{t:'She said she would wake him at midnight.',hi:true}],{auto:4200}]
])
};

/* ---------- SCHOOL ---------- */
G.real.school={
2:()=>G.beats([
  nar('(School. Patched shirt, torn bag, the same shoes as last year.)',3600),['obj','Walk to your desk'],['reach',-4.0,0,1.5],['look',-2.4,.3,1.0],['wait',300],
  say('Rohan','Look who came. The beggar!',2600),say('Rohan','Is that your lunch? Smells like charity.',3000),['sfx','thud',.4],['shake',.06,.4],
  nar('(They shove you. Your tiffin hits the floor. Rice, everywhere.)',3600),say('Rohan','Pick it up, dustbin boy.',2400),['unlook'],
  ['obj','Pick up your lunch'],['use',-3.2,.1,'Pick up the rice'],nar('(You pick up every grain. You will eat it later. You have to.)',3800),
  say('Teacher','Sit down, all of you. Kabir, why are you always so quiet?',3600),['obj','Sit at your desk'],['use',-.9,1.3,'Sit down'],
  say('Kabir','(Because if I start talking, I might not stop.)',3400),['fade',1,1400]
]),
3:()=>G.beats([
  nar('(Your homework is the one thing you did right. You carry it like it might break.)',3800),['obj','Walk to your desk'],['reach',-4.0,0,1.5],['look',-2.4,.3,1.0],['wait',300],
  say('Rohan','Show me your homework, genius.',2400),['sfx','thud',.4],nar('(They tear the page in half. Seven correct sums.)',3400),say('Rohan','Now you are even with your father.',2800),['unlook'],
  ['obj','Pick up the pages'],['use',-3.2,.1,'Pick up the pieces'],['obj','Sit at your desk'],['use',-.9,1.3,'Sit down'],
  say('Teacher','Kabir. Where is your homework?',2600),
  ['choice','Tell her what happened','Say you forgot',
    [nar('(The words are ready. They will not leave your throat.)',3200),say('Kabir','I... forgot, miss.',2000)],
    [say('Kabir','I forgot, miss.',2000),nar('(She sighs and moves on. Nobody asks twice.)',3200)]],
  ['fade',1,1400]
]),
4:()=>G.beats([
  nar('(The sleeve of your shirt is long. It is a hot day.)',3400),['obj','Walk to your desk'],['reach',-4.0,0,1.5],['obj','Sit at your desk'],['use',-.9,1.3,'Sit down'],
  say('Teacher','Kabir. Stay back after class.',2800),['wait',700],say('Teacher','Why is your sleeve so long in this heat?',3200),say('Teacher','Did someone hurt you?',2400),
  ['choice','Tell her','It is nothing',
    [nar('(For one second, you almost do.)',2800),say('Kabir','I fell, miss.',2200),say('Teacher','...All right. My door is always open.',3200)],
    [say('Kabir','I fell down the stairs.',2400),say('Teacher','Kabir...',1800),nar('(She looks at you the way people look at a locked door.)',3400)]],
  ['fade',1,1400]
]),
5:()=>G.beats([
  nar('(Today is the last time you will walk into this room. Mama said. You tell no one.)',4200),['obj','Walk to your desk'],['reach',-4.0,0,1.5],['look',-2.4,.3,1.0],['wait',300],
  say('Rohan','My mother says your father is a drunk. Everyone knows.',3400),nar('(Everyone knows. The word is heavier from a child\'s mouth.)',3400),['unlook'],
  ['obj','Sit at your desk'],['use',-.9,1.3,'Sit down'],say('Teacher','Kabir. Take this notebook. Not for marks. For nothing.',3600),['sfx','pick'],
  nar('(You look at everything once. The board, the windows, the crooked desks. The way you look at a place you will not see again.)',5200),['fade',1,1600]
])
};

/* ---------- FINALE ---------- */
G.real.finale=async()=>{
  G.bulbOff=true;
  const mg=G.mom.g;mg.rotation.set(-Math.PI/2,0,0);mg.position.set(2.6,.14,-.2);G.mom.tx=2.6;G.mom.tz=-.2;
  G.mom.speed=0;G.ticks.push(()=>{mg.rotation.set(-Math.PI/2,0,0)});
  G.box(.45,.5,.22,G.col(0x2a3a5a),3.6,.1,.5,{}).rotation.y=.6;G.box(.4,.4,.22,G.col(0x5a3a3a),3.2,.1,1.3,{}).rotation.y=2;
  await putDad(1.2,-.2);G.dad.g.rotation.y=-Math.PI/2;
  const P=G.P;P.x=-3.4;P.z=-1.2;P.yaw=-Math.PI/2;P.pitch=0;P.still=true;
  await G.fade(0,1800);
  await G.beats([['sfx','wake'],nar('(You wake with her scream still in your ears.)',3200),['still',false],say('Kabir','Mama?',1800),['obj','Go to Mama'],
    nar('(The bulb is dark. Moonlight through the window. The bags are open on the floor, everything pulled out.)',4600),['reach',-.6,-.2,2.6],
    ['still',true],['look',1.2,-.2,1.5],['sfx','sob'],say('Papa','Wake up. Come on. Wake up.',3200),say('Papa','I only... I only wanted...',3400),['wait',800],
    say('Papa','What have I done...',3400),['sfx','glass'],nar('(The bottle slips from his hand. It does not break the silence. It becomes it.)',4600),
    ['look',1.2,-.2,1.6]]);
  G.dad.g.rotation.y=Math.atan2(G.P.x-1.2,G.P.z+.2);
  await G.beats([say('Papa','Kabir... Kabir, I...',2800),['wait',700]]);
  await G.dad.go(4.1,1.2);G.sfx.slam();G.shake(.1,.5);G.dad.g.visible=false;
  await G.beats([nar('(The door. The stairs. His footsteps getting smaller, and smaller, until they are only your heartbeat.)',5200),['unlook'],['still',false],
    ['obj','Go to Mama'],['use',2.0,-.2,'Kneel beside Mama'],['still',true],['look',2.6,-.2,.3],['wait',900],
    say('Kabir','Mama. Mama, wake up. We have to go. The bags are ready.',4200),nar('(She does not answer. The stars are still on the wall. She made them for you.)',4600),['wait',1400],['fade',1,3200]]);
};
