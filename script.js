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

    $("phases").innerHTML=phases
        .map((p,i)=>{
            let done=s.done.includes(i);
            let lock=i>=s.unlocked;

            return `
                <button
                    class="phase"
                    ${lock?"disabled":""}
                    data-p="${i}">
                    
                    <div class="pi">${p.i}</div>

                    <div class="pinfo">
                        <b>${i+1}. ${p.t}</b>
                        <small>${p.d}</small>
                    </div>

                    <span class="status ${done?"done":""}">
                        ${done?"✓ Concluída":lock?"🔒 Bloqueada":"Jogar ➜"}
                    </span>

                </button>
            `;
        })
        .join("");

    document
        .querySelectorAll(".phase:not(:disabled)")
        .forEach(b=>{
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
    s.q=0;
    s.score=0;

    show("game");
    render();
}


/* =========================
   RENDERIZAR QUESTÃO
========================= */

function render(){
    let p=phases[s.p];
    let q=p.q[s.q];

    $("ptitle").textContent=p.t;
    $("qcount").textContent=`${s.q+1}/${p.q.length}`;
    $("bar").style.width=`${s.q/p.q.length*100}%`;
    $("score").textContent=s.score;

    $("feedback").className="";
    $("feedback").textContent="";

    $("next").classList.add("hidden");

    $("content").innerHTML=`
        <div class="questionbox">
            <div class="tag">${p.i} ${p.d}</div>

            <div class="question">
                ${q[0]}
            </div>

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
    let c=phases[s.p].q[s.q][1];

    document
        .querySelectorAll(".answer")
        .forEach(x=>x.disabled=true);

    if(v===c){
        b.classList.add("correct");

        s.score+=100;

        $("feedback").className="ok";
        $("feedback").textContent=
            "🎉 Muito bem! Resposta correta!";

    }else{
        b.classList.add("wrong");

        $("feedback").className="bad";
        $("feedback").textContent=
            `💡 A resposta correta é ${c}. Tente aprender com o desafio!`;
    }

    $("score").textContent=s.score;
    $("next").classList.remove("hidden");

    save();
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
    menu();
    show("menu");
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
