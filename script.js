const SUPABASE_URL="https://sycppvqumnexnvhwiqqo.supabase.co";
const SUPABASE_KEY="sb_publishable_lopUg2411JVThhGPVoZ-HA_e0e8Jdmj";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let cloudUserId=null;

const avatars=["🦊","🐼","🐸","🦁","🐯","🐨","🐵","🐰"];

const phases=[
{t:"Vila dos Números",i:"🔢",d:"Adição e subtração",q:[["Quanto é 8 + 7?",15],["Quanto é 20 - 6?",14],["Quanto é 9 + 5?",14],["Quanto é 18 - 9?",9],["Quanto é 12 + 6?",18]]},
{t:"Floresta da Multiplicação",i:"✖️",d:"Multiplicação e divisão",q:[["Quanto é 3 × 4?",12],["Quanto é 5 × 6?",30],["Quanto é 20 ÷ 4?",5],["Quanto é 7 × 3?",21],["Quanto é 24 ÷ 6?",4]]},
{t:"Cidade das Formas",i:"🔺",d:"Figuras geométricas",q:[["Quantos lados tem um triângulo?",3],["Quantos lados tem um quadrado?",4],["Quantos lados tem um pentágono?",5],["Qual figura tem 3 lados?",3],["Quantos lados tem um retângulo?",4]]},
{t:"Relógio Mágico",i:"🕐",d:"Horas e duração",q:[["Quantos minutos há em 1 hora?",60],["Quantas horas há em meio dia?",12],["Quantos minutos há em meia hora?",30],["Quantos minutos há em 2 horas?",120],["Quantos minutos há em 1/4 de hora?",15]]},
{t:"Desafio Final",i:"🏆",d:"Revisão matemática",q:[["Quanto é 10 + 15?",25],["Quanto é 6 × 4?",24],["Quantos lados tem um hexágono?",6],["Quantos minutos há em 1 hora?",60],["Quanto é 30 ÷ 5?",6]]}
];

let s={
    nick:"",
    avatar:avatars[0],
    unlocked:1,
    done:[],
    scores:{},
    p:0,
    q:0,
    score:0
};

const $=x=>document.getElementById(x);

try{
    s={...s,...JSON.parse(localStorage.getItem("aventurasMatematicas")||"{}")}
}catch(e){}


/* =========================
   SUPABASE
========================= */

async function loadCloud(){
    if(!cloudUserId)return;

    try{
        const {data,error}=await db
            .from("progresso_jogadores")
            .select("*")
            .eq("user_id",cloudUserId)
            .maybeSingle();

        if(error)throw error;

        if(data){
            s={
                ...s,
                nick:data.nick||s.nick,
                avatar:data.avatar||s.avatar,
                unlocked:data.unlocked??s.unlocked,
                done:Array.isArray(data.done)?data.done:s.done,
                scores:data.scores||s.scores
            };

            localStorage.setItem(
                "aventurasMatematicas",
                JSON.stringify(s)
            );
        }else if(s.nick){
            await saveCloud();
        }

    }catch(e){
        console.warn("Supabase load:",e);
    }
}


async function saveCloud(){
    if(!cloudUserId||!s.nick)return;

    try{
        const {error}=await db
            .from("progresso_jogadores")
            .upsert({
                user_id:cloudUserId,
                nick:s.nick,
                avatar:s.avatar,
                unlocked:s.unlocked,
                done:s.done,
                scores:s.scores,
                updated_at:new Date().toISOString()
            },{
                onConflict:"user_id"
            });

        if(error)throw error;

    }catch(e){
        console.warn("Supabase save:",e);
    }
}


async function initCloud(){
    try{
        const {data,error}=await db.auth.getSession();

        if(error)throw error;

        if(data.session){
            cloudUserId=data.session.user.id;
        }else{
            const {data:authData,error:authError}=
                await db.auth.signInAnonymously();

            if(authError)throw authError;

            cloudUserId=authData.user.id;
        }

        await loadCloud();

    }catch(e){
        console.warn("Supabase:",e);
    }
}


/* =========================
   SALVAMENTO
========================= */

function save(){
    localStorage.setItem(
        "aventurasMatematicas",
        JSON.stringify(s)
    );

    if(s.nick)saveCloud();
}


/* =========================
   TELAS
========================= */

function show(x){
    document
        .querySelectorAll(".screen")
        .forEach(e=>e.classList.remove("active"));

    $(x).classList.add("active");
    scrollTo(0,0);
}


/* =========================
   AVATARES
========================= */

function avatarsUI(){
    $("avatars").innerHTML=avatars
        .map(a=>`
            <button
                class="av ${s.avatar===a?"selected":""}"
                data-a="${a}"
                aria-label="Avatar ${a}">
                ${a}
            </button>
        `)
        .join("");

    document.querySelectorAll(".av").forEach(b=>{
        b.onclick=()=>{
            s.avatar=b.dataset.a;
            save();
            avatarsUI();
        };
    });
}


/* =========================
   MENU
========================= */

function menu(){
    $("name").textContent=s.nick||"Aventureiro";
    $("avatar").textContent=s.avatar;
    const unlockedCount=Math.max(1,Math.min(phases.length,Number(s.unlocked)||1));
    const doneCount=Array.isArray(s.done)?s.done.length:0;
    const bestScore=Object.values(s.scores||{}).reduce((best,value)=>Math.max(best,Number(value)||0),0);
    $("unlocked-count").textContent=`${unlockedCount} de ${phases.length}`;
    $("done-count").textContent=String(doneCount);
    $("best-score").textContent=`${bestScore} pts`;

    $("phases").innerHTML=phases
        .map((p,i)=>{
            let done=s.done.includes(i);
            let lock=i>=s.unlocked;
            return `
                <button class="phase world-${i+1}" ${lock?"disabled":""} data-p="${i}" aria-label="${lock?"Fase bloqueada: ":"Abrir fase: "}${p.t}">
                    <div class="phase-head">
                        <div class="pi">${p.i}</div>
                        <span class="phase-index">${done?"⭐ CONCLUÍDA":lock?"🔒 BLOQUEADA":"⭐ 0/5"}</span>
                    </div>
                    <div class="world-illustration" aria-hidden="true">${["🏡","🌳🍎🌳","🏛️","🕰️","💎🏆"][i]}</div>
                    <div class="pinfo">
                        <b>${p.t}</b>
                        <small>${p.d}</small>
                    </div>
                    <div class="phase-bottom">
                        <span class="status ${done?"done":""}">${done?"⭐ Concluída":lock?"🔒 Bloqueada":"⭐ ${s.scores[i]||0} pts"}</span>
                        <span class="phase-cta">${lock?"Bloqueada":"JOGAR ▶"}</span>
                    </div>
                </button>
            `;
        })
        .join("");

    document.querySelectorAll(".phase:not(:disabled)").forEach(b=>{
        b.onclick=()=>start(+b.dataset.p);
    });
}


/* =========================
   OPÇÕES
========================= */

function opts(c){
    let a=new Set([c]);

    while(a.size<4){
        let n=c+
            (Math.random()<.5?-1:1)*
            (Math.floor(Math.random()*7)+1);

        if(n>=0)a.add(n);
    }

    return[...a].sort(()=>Math.random()-.5);
}


/* =========================
   INICIAR FASE
========================= */

function start(i){
    s.p=i;
    document.body.dataset.world=String(i+1);
    s.q=0;
    s.score=0;

    show("game");
    render();
}


/* Apoio visual contextual: mostra somente o elemento relacionado à pergunta. */
function sceneFor(world, question){
  const text=String(question||"").toLowerCase();
  if(world===0) return `<div class="scene-math" aria-label="Conta matemática">🔢 <span>＋ −</span></div>`;
  if(world===1){
    // Representa a multiplicação como N grupos com M objetos em cada grupo.
    const match = text.match(/(\d+)\s*[×x]\s*(\d+)/);
    if(match){
      const groups=Number(match[1]), perGroup=Number(match[2]);
      const objects=Array.from({length:perGroup},()=>`<span class="group-object">🍎</span>`).join("");
      return `<div class="scene-groups" role="img" aria-label="${groups} grupos com ${perGroup} maçãs em cada grupo">${Array.from({length:groups},(_,i)=>`<div class="object-group" style="--cols:${Math.min(3,perGroup)}" aria-label="Grupo ${i+1}: ${perGroup} maçãs">${objects}</div>`).join("")}</div>`;
    }
    if(text.includes("÷")) return `<div class="scene-math" aria-label="Divisão">➗ <span>dividir em partes iguais</span></div>`;
    return `<div class="scene-math" aria-label="Operação matemática">✖️ <span>× ÷</span></div>`;
  }
  if(world===2){
    let shape='triangle', label='Triângulo';
    if(text.includes('quadrado')){shape='square';label='Quadrado'}
    else if(text.includes('pentágono')){shape='pentagon';label='Pentágono'}
    else if(text.includes('retângulo')){shape='rectangle';label='Retângulo'}
    else if(text.includes('hexágono')){shape='hexagon';label='Hexágono'}
    else if(text.includes('qual figura tem 3 lados')){shape='triangle';label='Triângulo'}
    return `<div class="scene-single-shape" role="img" aria-label="${label}"><span class="shape-${shape}"></span></div>`;
  }
  if(world===3){
    if(text.includes('minutos')) return `<div class="scene-clock-icon" aria-label="Relógio">🕒</div>`;
    return `<div class="scene-time-icon" aria-label="Tempo">⏰</div>`;
  }
  if(text.includes('lados')) return `<div class="scene-single-shape" role="img" aria-label="Hexágono"><span class="shape-hexagon"></span></div>`;
  if(text.includes('minutos')||text.includes('horas')) return `<div class="scene-clock-icon" aria-label="Relógio">🕒</div>`;
  return `<div class="scene-math" aria-label="Desafio de matemática">🔢 <span>＋ × ÷</span></div>`;
}

/* =========================
   RENDERIZAR QUESTÃO
========================= */

function render(){
    let p=phases[s.p];
    let q=p.q[s.q];
    document.body.dataset.world=String(s.p+1);

    $("ptitle").textContent=p.t;
    $("qcount").textContent=`${s.q+1}/${p.q.length}`;
    $("bar").style.width=`${s.q/p.q.length*100}%`;
    $("score").textContent=s.score;

    $("feedback").className="";
    $("feedback").textContent="";

    $("next").textContent="Próximo desafio →";
    $("next").classList.add("hidden");

    $("content").innerHTML=`
        <div class="questionbox world-question world-question-${s.p+1}">
            <div class="tag">${p.i} ${p.d}</div>
            <div class="question-scene" aria-hidden="true">${sceneFor(s.p,q[0])}</div>
            <div class="question">${q[0]}</div>
            <div class="options">
                ${opts(q[1])
                    .map(x=>`
                        <button
                            class="answer"
                            data-v="${x}">
                            ${x}
                        </button>
                    `)
                    .join("")}
            </div>
        </div>
    `;

    document
        .querySelectorAll(".answer")
        .forEach(b=>{
            b.onclick=()=>answer(+b.dataset.v,b);
        });
}


/* =========================
   RESPONDER
========================= */

function answer(v,b){
    const c=phases[s.p].q[s.q][1];
    if(b.disabled)return;

    if(v===c){
        document.querySelectorAll(".answer").forEach(x=>x.disabled=true);
        b.classList.add("correct");
        s.score+=100;
        $("feedback").className="ok";
        $("feedback").textContent="🎉 CORRETO! +100 pontos! 🦊";
        $("next").textContent=s.q<phases[s.p].q.length-1?"Próximo desafio →":"Concluir fase 🏆";
        $("next").classList.remove("hidden");
        save();
    }else{
        b.classList.add("wrong");
        b.disabled=true;
        $("feedback").className="bad";
        $("feedback").textContent="🙈 Quase! Tente outra resposta.";
    }
    $("score").textContent=s.score;
}


/* =========================
   PRÓXIMA QUESTÃO
========================= */

function next(){
    if(s.q<phases[s.p].q.length-1){
        s.q++;
        render();
    }else{
        finish();
    }
}


/* =========================
   FINALIZAR FASE
========================= */

function finish(){
    if(!s.done.includes(s.p))
        s.done.push(s.p);

    s.scores[s.p]=s.score;

    s.unlocked=Math.max(
        s.unlocked,
        Math.min(phases.length,s.p+2)
    );

    save();

    $("rscore").textContent=s.score;

    $("rmsg").textContent=
        s.p===4
        ?"Você completou todas as aventuras! 🏆"
        :"Nova aventura desbloqueada. Continue assim!";

    $("ricon").textContent=
        s.p===4?"🏆":"🎉";

    show("result");
}


/* =========================
   RESETAR PROGRESSO
========================= */

async function reset(){
    if(!confirm("Apagar o progresso salvo neste navegador?"))
        return;

    s.unlocked=1;
    s.done=[];
    s.scores={};
    s.p=0;
    s.q=0;
    s.score=0;

    localStorage.setItem(
        "aventurasMatematicas",
        JSON.stringify(s)
    );

    if(cloudUserId&&s.nick){
        try{
            const {error}=await db
                .from("progresso_jogadores")
                .update({
                    unlocked:1,
                    done:[],
                    scores:{},
                    updated_at:new Date().toISOString()
                })
                .eq("user_id",cloudUserId);

            if(error)throw error;

        }catch(e){
            console.warn("Supabase reset:",e);
        }
    }

    location.reload();
}


/* =========================
   INSTRUÇÕES POR VOZ
========================= */

function speak(){
    if("speechSynthesis"in window){
        speechSynthesis.cancel();

        speechSynthesis.speak(
            new SpeechSynthesisUtterance(
                "Escolha um apelido e um personagem. Complete as fases em ordem. Escolha uma resposta e receba feedback imediatamente. Se errar, tente aprender com o desafio. Boa aventura!"
            )
        );
    }
}


/* =========================
   BOTÕES
========================= */

$("begin").onclick=()=>{
    let n=$("nick").value.trim();

    if(!n){
        $("err").textContent=
            "Escolha um apelido para começar.";
        return;
    }

    s.nick=n;

    save();

    menu();
    show("menu");
};

$("how").onclick=()=>show("info");

$("instructions").onclick=()=>show("info");

$("backstart").onclick=()=>show("start");

$("speak").onclick=speak;

$("next").onclick=next;

$("back").onclick=()=>{
    menu();
    show("menu");
};

$("rnext").onclick=()=>{
    const nextPhase=s.p+1;
    if(nextPhase<phases.length&&nextPhase<s.unlocked){
        start(nextPhase);
    }else{
        menu();
        show("menu");
    }
};

$("rmenu").onclick=()=>{
    menu();
    show("menu");
};

$("reset").onclick=reset;


/* =========================
   INICIALIZAÇÃO
========================= */

async function boot(){
    await initCloud();

    $("nick").value=s.nick;

    avatarsUI();
}

boot();
