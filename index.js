const imagens = document.querySelectorAll('.imagem');
const botoes = document.querySelectorAll('.botao');

let indexAtual = 0;
let intervalo;
let unsubscribeHorarios = null;

function mudarSlide(index) {
    botoes.forEach((btn) => btn.classList.remove('selecionado'));
    imagens.forEach((img) => img.classList.remove('ativa'));

    if (imagens[index] && botoes[index]) {
        imagens[index].classList.add('ativa');
        botoes[index].classList.add('selecionado');
        indexAtual = index;
    }
}

function proximoSlide() {
    const proximo = (indexAtual + 1) % imagens.length;
    mudarSlide(proximo);
}

function iniciarAutoplay() {
    clearInterval(intervalo);
    intervalo = setInterval(proximoSlide, 4000);
}

if (imagens.length > 0 && imagens.length === botoes.length) {
    botoes.forEach((botao, i) => {
        botao.addEventListener('click', () => {
            mudarSlide(i);
            iniciarAutoplay();
        });
    });

    iniciarAutoplay();
}

console.log("Carrossel Premium Ativado!");

let agendamento = {
    servico: "",
    preco: "",
    barbeiro: "",
    data: "",
    hora: ""
};

const horariosBase = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
];

const WHATSAPP_BARBEARIA = "556799995999";

// categorias
document.querySelectorAll('.btn-categoria').forEach((btn) => {
    btn.addEventListener('click', () => {
        const listaAtual = btn.nextElementSibling;
        if (!listaAtual) return;

        const todasListas = document.querySelectorAll('.servicos-lista');

        todasListas.forEach((lista) => {
            if (lista !== listaAtual) lista.style.display = 'none';
        });

        listaAtual.style.display = listaAtual.style.display === 'block' ? 'none' : 'block';
    });
});

// escolher serviço
document.querySelectorAll('.item-servico').forEach((item) => {
    const btn = item.querySelector('.btn-selecionar');

    btn?.addEventListener('click', () => {
        agendamento.servico = item.dataset.nome || "";
        agendamento.preco = item.dataset.preco || "";
        agendamento.barbeiro = "";
        agendamento.data = "";
        agendamento.hora = "";

        const passoProfissionais = document.getElementById('passo-profissionais');
        const formAgendamento = document.getElementById('formAgendamento');
        const horariosDiv = document.getElementById('horarios');

        if (passoProfissionais) {
            passoProfissionais.classList.add('ativo');
            passoProfissionais.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (formAgendamento) formAgendamento.style.display = 'none';
        if (horariosDiv) horariosDiv.innerHTML = "";

        document.querySelectorAll('.card-profissional').forEach((card) => {
            card.classList.remove('selecionado');
        });

        if (unsubscribeHorarios) {
            unsubscribeHorarios();
            unsubscribeHorarios = null;
        }
    });
});

// voltar
const btnVoltar = document.querySelector('.btn-voltar');

btnVoltar?.addEventListener('click', () => {
    const passoServicos = document.getElementById('passo-servicos');
    const passoProfissionais = document.getElementById('passo-profissionais');
    const formAgendamento = document.getElementById('formAgendamento');

    if (passoProfissionais) passoProfissionais.classList.remove('ativo');

    if (passoServicos) {
        passoServicos.classList.add('ativo');
        passoServicos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (formAgendamento) formAgendamento.style.display = 'none';

    if (unsubscribeHorarios) {
        unsubscribeHorarios();
        unsubscribeHorarios = null;
    }
});

// escolher barbeiro
document.querySelectorAll('.btn-escolher-barbeiro').forEach((btn) => {
    btn.addEventListener('click', function () {
        const card = this.parentElement;
        if (!card) return;

        agendamento.barbeiro = card.dataset.barbeiro || "";
        agendamento.data = "";
        agendamento.hora = "";

        document.querySelectorAll('.card-profissional').forEach((cardItem) => {
            cardItem.classList.remove('selecionado');
        });

        card.classList.add('selecionado');

        const formAgendamento = document.getElementById('formAgendamento');
        const horariosDiv = document.getElementById('horarios');
        const inputData = document.getElementById('data');

        if (formAgendamento) {
            formAgendamento.style.display = 'block';

            setTimeout(() => {
                formAgendamento.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }

        if (horariosDiv) horariosDiv.innerHTML = "";
        if (inputData) inputData.value = "";

        if (unsubscribeHorarios) {
            unsubscribeHorarios();
            unsubscribeHorarios = null;
        }
    });
});

// data
document.getElementById("data")?.addEventListener("change", (e) => {
    agendamento.data = e.target.value;
    agendamento.hora = "";

    if (!agendamento.barbeiro || !agendamento.data) return;
    escutarHorarios(agendamento.barbeiro, agendamento.data);
});

// tempo passado
function horarioJaPassou(data, hora) {
    const agora = new Date();
    const dataHora = new Date(`${data}T${hora}:00`);
    return dataHora <= agora;
}

// renderizar horários
function renderizarHorarios(barbeiro, data, ocupados) {
    const horariosDiv = document.getElementById("horarios");
    if (!horariosDiv) return;

    horariosDiv.innerHTML = "";

    const dataObj = new Date(`${data}T00:00:00`);
    const diaSemana = dataObj.getDay();

    if (diaSemana === 0) {
        horariosDiv.innerHTML = `<p class="horarios-vazio">Fechado neste dia.</p>`;
        return;
    }

    horariosBase.forEach(hora => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = hora;
        btn.classList.add("horario-btn");

        const ocupado = ocupados.includes(hora);
        const passado = horarioJaPassou(data, hora);

        if (ocupado || passado) {
            btn.disabled = true;
            btn.classList.add("horario-ocupado");
        } else {
            btn.onclick = () => {
                agendamento.hora = hora;

                document.querySelectorAll(".horario-btn").forEach(b => {
                    b.classList.remove("horario-selecionado");
                });

                btn.classList.add("horario-selecionado");

                document.getElementById('btnConfirmarAgendamento')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        }

        horariosDiv.appendChild(btn);
    });
}

// escutar horários em tempo real
function escutarHorarios(barbeiro, data) {
    if (!window.db || !window.collection || !window.onSnapshot) {
        console.error("Firebase não está disponível no window.");
        return;
    }

    if (unsubscribeHorarios) {
        unsubscribeHorarios();
        unsubscribeHorarios = null;
    }

    const horariosRef = window.collection(window.db, "horarios_ocupados");

    unsubscribeHorarios = window.onSnapshot(horariosRef, (snapshot) => {
        const ocupados = [];

        snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.barbeiro === barbeiro && d.data === data) {
                ocupados.push(d.hora);
            }
        });

        renderizarHorarios(barbeiro, data, ocupados);
    }, (erro) => {
        console.error("Erro ao escutar horários:", erro);
        const horariosDiv = document.getElementById("horarios");
        if (horariosDiv) {
            horariosDiv.innerHTML = `<p class="horarios-vazio">Erro ao carregar horários.</p>`;
        }
    });
}

// confirmar
const btnConfirmar = document.getElementById('btnConfirmarAgendamento');

btnConfirmar?.addEventListener('click', async () => {
    const nomeCliente = document.getElementById('nomeCliente')?.value.trim() || "";
    const telefoneCliente = document.getElementById('telefoneCliente')?.value.trim() || "";
    const emailCliente = document.getElementById('emailCliente')?.value.trim() || "";
    const lembrarEmail = document.getElementById('lembrarEmail')?.checked || false;

    if (!nomeCliente || !telefoneCliente || !agendamento.servico || !agendamento.barbeiro || !agendamento.data || !agendamento.hora) {
        alert("Preencha tudo");
        return;
    }

    if (lembrarEmail && !emailCliente) {
        alert("Informe o e-mail");
        return;
    }

    if (horarioJaPassou(agendamento.data, agendamento.hora)) {
        alert("Esse horário já passou.");
        return;
    }

    try {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Confirmando...";

        const criarAgendamento = window.httpsCallable(window.functions, "criarAgendamento");

        await criarAgendamento({
            nome: nomeCliente,
            telefone: telefoneCliente,
            email: emailCliente,
            lembreteEmail: lembrarEmail,
            ...agendamento
        });

        if ("vibrate" in navigator) {
            navigator.vibrate([120, 50, 120]);
        }

        const mensagemWhatsApp = `Olá! Acabei de agendar meu horário 💈

Nome: ${nomeCliente}
Serviço: ${agendamento.servico}
Barbeiro: ${agendamento.barbeiro}
Data: ${agendamento.data}
Hora: ${agendamento.hora}`;

        abrirModalSucesso(mensagemWhatsApp, {
            servico: agendamento.servico,
            barbeiro: agendamento.barbeiro,
            data: agendamento.data,
            hora: agendamento.hora
        });

        document.getElementById('nomeCliente').value = "";
        document.getElementById('telefoneCliente').value = "";
        document.getElementById('emailCliente').value = "";
        document.getElementById('lembrarEmail').checked = true;
        document.getElementById('data').value = "";
        document.getElementById('horarios').innerHTML = "";

        document.querySelectorAll('.card-profissional').forEach((cardItem) => {
            cardItem.classList.remove('selecionado');
        });

        agendamento = {
            servico: "",
            preco: "",
            barbeiro: "",
            data: "",
            hora: ""
        };

        if (unsubscribeHorarios) {
            unsubscribeHorarios();
            unsubscribeHorarios = null;
        }

    } catch (e) {
        alert(e.message);
    }

    btnConfirmar.disabled = false;
    btnConfirmar.textContent = "Confirmar Agendamento";
});

// modal
function abrirModalSucesso(mensagemWhatsApp, dadosResumo) {
    const modal = document.getElementById("modalSucesso");
    const btnFechar = document.getElementById("fecharModalSucesso");
    const btnWhats = document.getElementById("abrirWhatsModal");
    const modalInfo = document.getElementById("modalInfoAgendamento");

    if (!modal || !btnFechar || !btnWhats || !modalInfo) return;

    modalInfo.innerHTML = `
        <div><b>Serviço:</b> ${dadosResumo.servico}</div>
        <div><b>Barbeiro:</b> ${dadosResumo.barbeiro}</div>
        <div><b>Data:</b> ${dadosResumo.data}</div>
        <div><b>Hora:</b> ${dadosResumo.hora}</div>
    `;

    modal.classList.add("ativo");
    document.body.style.overflow = "hidden";

    btnFechar.onclick = () => {
        modal.classList.remove("ativo");
        document.body.style.overflow = "";
    };

    btnWhats.onclick = () => {
        window.open(
            `https://wa.me/${WHATSAPP_BARBEARIA}?text=${encodeURIComponent(mensagemWhatsApp)}`,
            "_blank"
        );
        modal.classList.remove("ativo");
        document.body.style.overflow = "";
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove("ativo");
            document.body.style.overflow = "";
        }
    };
}

// menu mobile
function abrirMenu() {
    const menuLateral = document.getElementById("menuLateral");
    if (menuLateral) menuLateral.classList.add("aberto");
}

function fecharMenu() {
    const menuLateral = document.getElementById("menuLateral");
    if (menuLateral) menuLateral.classList.remove("aberto");
}

window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;

document.querySelectorAll('.menu-lateral a').forEach((link) => {
    link.addEventListener('click', () => {
        fecharMenu();
    });
});

// flatpickr
if (typeof flatpickr !== "undefined") {
    flatpickr("#data", {
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "pt",
        disableMobile: true,
        monthSelectorType: "dropdown"
    });
}