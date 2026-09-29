const avatars=["🦊","🐼","🐸","🦁","🐯","🐨","🐵","🐰"];
const phases=[
{t:"Vila dos Números",i:"🔢",d:"Adição e subtração",q:[["Quanto é 8 + 7?",15],["Quanto é 20 - 6?",14],["Quanto é 9 + 5?",14],["Quanto é 18 - 9?",9],["Quanto é 12 + 6?",18]]},
{t:"Floresta da Multiplicação",i:"✖️",d:"Multiplicação e divisão",q:[["Quanto é 3 × 4?",12],["Quanto é 5 × 6?",30],["Quanto é 20 ÷ 4?",5],["Quanto é 7 × 3?",21],["Quanto é 24 ÷ 6?",4]]},
{t:"Cidade das Formas",i:"🔺",d:"Figuras geométricas",q:[["Quantos lados tem um triângulo?",3],["Quantos lados tem um quadrado?",4],["Quantos lados tem um pentágono?",5],["Qual figura tem 3 lados?",3],["Quantos lados tem um retângulo?",4]]},
{t:"Relógio Mágico",i:"🕐",d:"Horas e duração",q:[["Quantos minutos há em 1 hora?",60],["Quantas horas há em meio dia?",12],["Quantos minutos há em meia hora?",30],["Quantos minutos há em 2 horas?",120],["Quantos minutos há em 1/4 de hora?",15]]},
{t:"Desafio Final",i:"🏆",d:"Revisão matemática",q:[["Quanto é 10 + 15?",25],["Quanto é 6 × 4?",24],["Quantos lados tem um hexágono?",6],["Quantos minutos há em 1 hora?",60],["Quanto é 30 ÷ 5?",6]]}
];
let s={nick:"",avatar:avatars[0],unlocked:1,done:[],scores:{},p:0,q:0,score:0};
const $=x=>document.getElementById(x);
try{s={...s,...JSON.parse(localStorage.getItem("aventurasMatematicas")||"{}")} }catch(e){}
function save(){localStorage.setItem("aventurasMatematicas",JSON.stringify(s))}
function show(x){document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active"));$(x).classList.add("active");scrollTo(0,0)}
function avatarsUI(){$("avatars").innerHTML=avatars.map(a=>`<button class="av ${s.avatar===a?"selected":""}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join("");document.querySelectorAll(".av").forEach(b=>b.onclick=()=>{s.avatar=b.dataset.a;avatarsUI()})}
function menu(){$("name").textContent=s.nick||"Aventureiro";$("avatar").textContent=s.avatar;$("phases").innerHTML=phases.map((p,i)=>{let done=s.done.includes(i),lock=i>=s.unlocked;return `<button class="phase" ${lock?"disabled":""} data-p="${i}"><div class="pi">${p.i}</div><div class="pinfo"><b>${i+1}. ${p.t}</b><small>${p.d}</small></div><span class="status ${done?"done":""}">${done?"✓ Concluída":lock?"🔒 Bloqueada":"Jogar ➜"}</span></button>`}).join("");document.querySelectorAll(".phase:not(:disabled)").forEach(b=>b.onclick=()=>start(+b.dataset.p))}
function opts(c){let a=new Set([c]);while(a.size<4){let n=c+(Math.random()<.5?-1:1)*(Math.floor(Math.random()*7)+1);if(n>=0)a.add(n)}return[...a].sort(()=>Math.random()-.5)}
function start(i){s.p=i;s.q=0;s.score=0;show("game");render()}
function render(){let p=phases[s.p],q=p.q[s.q];$("ptitle").textContent=p.t;$("qcount").textContent=`${s.q+1}/${p.q.length}`;$("bar").style.width=`${s.q/p.q.length*100}%`;$("score").textContent=s.score;$("feedback").className="";$("feedback").textContent="";$("next").classList.add("hidden");$("content").innerHTML=`<div class="questionbox"><div class="tag">${p.i} ${p.d}</div><div class="question">${q[0]}</div><div class="options">${opts(q[1]).map(x=>`<button class="answer" data-v="${x}">${x}</button>`).join("")}</div></div>`;document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>answer(+b.dataset.v,b))}
function answer(v,b){let c=phases[s.p].q[s.q][1];document.querySelectorAll(".answer").forEach(x=>x.disabled=true);if(v===c){b.classList.add("correct");s.score+=100;$("feedback").className="ok";$("feedback").textContent="🎉 Muito bem! Resposta correta!"}else{b.classList.add("wrong");$("feedback").className="bad";$("feedback").textContent=`💡 A resposta correta é ${c}. Tente aprender com o desafio!`}$("score").textContent=s.score;$("next").classList.remove("hidden");save()}
function next(){if(s.q<phases[s.p].q.length-1){s.q++;render()}else finish()}
function finish(){if(!s.done.includes(s.p))s.done.push(s.p);s.scores[s.p]=s.score;s.unlocked=Math.max(s.unlocked,Math.min(phases.length,s.p+2));save();$("rscore").textContent=s.score;$("rmsg").textContent=s.p===4?"Você completou todas as aventuras! 🏆":"Nova aventura desbloqueada. Continue assim!";$("ricon").textContent=s.p===4?"🏆":"🎉";show("result")}
function reset(){if(confirm("Apagar o progresso salvo neste navegador?")){localStorage.removeItem("aventurasMatematicas");location.reload()}}
function speak(){if("speechSynthesis"in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance("Escolha um apelido e um personagem. Complete as fases em ordem. Escolha uma resposta e receba feedback imediatamente. Se errar, tente novamente. Boa aventura!"))}}
$("begin").onclick=()=>{let n=$("nick").value.trim();if(!n){$("err").textContent="Escolha um apelido para começar.";return}s.nick=n;save();menu();show("menu")};
$("how").onclick=()=>show("info");$("instructions").onclick=()=>show("info");$("backstart").onclick=()=>show("start");$("speak").onclick=speak;$("next").onclick=next;$("back").onclick=()=>{menu();show("menu")};$("rnext").onclick=()=>{
    menu();
    show("menu");
};$("rmenu").onclick=()=>{menu();show("menu")};$("reset").onclick=reset;
$("nick").value=s.nick;avatarsUI();
