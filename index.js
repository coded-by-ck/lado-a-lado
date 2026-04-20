const imagens = document.querySelectorAll('.imagem');
const botoes = document.querySelectorAll('.botao');

let indexAtual = 0;
let intervalo;
let unsubscribeHorarios = null;

const TIMEZONE_OFFSET = "-04:00";

const SERVICOS = {
    "Corte": { preco: "50,00", duracao: 30 },
    "Barba": { preco: "40,00", duracao: 30 },
    "Acabamento e barba": { preco: "50,00", duracao: 30 },
    "Alisamento capilar": { preco: "90,00", duracao: 90 },
    "Barba (com Matheus)": { preco: "45,00", duracao: 30, barbeiroFixo: "Matheus" },
    "Cabelo + barba + sobrancelha (com Matheus)": { preco: "100,00", duracao: 60, barbeiroFixo: "Matheus" },
    "Cabelo + sobrancelha - navalha": { preco: "55,00", duracao: 30 },
    "Corte + barba + sobrancelha": { preco: "90,00", duracao: 60 },
    "Corte e barba (com Matheus)": { preco: "90,00", duracao: 60, barbeiroFixo: "Matheus" },
    "Corte e cavanhaque": { preco: "60,00", duracao: 30 },
    "Corte e hidratação": { preco: "85,00", duracao: 30 },
    "Corte e sobrancelha (com Matheus)": { preco: "60,00", duracao: 30, barbeiroFixo: "Matheus" },
    "Corte sobrancelha e cavanhaque": { preco: "70,00", duracao: 30 },
    "Limpeza de pele": { preco: "60,00", duracao: 30 },
    "Luzes": { preco: "150,00", duracao: 30 },
    "Nevou": { preco: "170,00", duracao: 120 },
    "Pezinho": { preco: "20,00", duracao: 30 },
    "Pigmentação": { preco: "40,00", duracao: 30 },
    "Pigmentação + corte": { preco: "85,00", duracao: 60 },
    "Restauração capilar": { preco: "45,00", duracao: 30 },
    "Selagem": { preco: "120,00", duracao: 60 }
};

const HORARIOS_VALIDOS = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
];

const WHATSAPP_BARBEARIA = "556799995999";

let agendamento = {
    servico: "",
    preco: "",
    barbeiro: "",
    data: "",
    hora: ""
};

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

document.querySelectorAll('.btn-categoria').forEach((btn) => {
    btn.addEventListener('click', () => {
        const listaAtual = btn.nextElementSibling;
        if (!listaAtual) return;

        const todasListas = document.querySelectorAll('.servicos-lista');
        const todosBotoes = document.querySelectorAll('.btn-categoria');

        todasListas.forEach((lista) => {
            if (lista !== listaAtual) {
                lista.style.display = 'none';
            }
        });

        todosBotoes.forEach((b) => {
            if (b !== btn) b.classList.remove('ativa');
        });

        const estaAberta = listaAtual.style.display === 'block';

        if (estaAberta) {
            listaAtual.style.display = 'none';
            btn.classList.remove('ativa');
        } else {
            listaAtual.style.display = 'block';
            btn.classList.add('ativa');
        }
    });
});

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

document.querySelectorAll('.btn-escolher-barbeiro').forEach((btn) => {
    btn.addEventListener('click', function () {
        const card = this.parentElement;
        if (!card) return;

        const barbeiroEscolhido = card.dataset.barbeiro || "";

        if (SERVICOS[agendamento.servico]?.barbeiroFixo &&
            SERVICOS[agendamento.servico].barbeiroFixo !== barbeiroEscolhido) {
            alert(`Esse serviço deve ser com ${SERVICOS[agendamento.servico].barbeiroFixo}.`);
            return;
        }

        agendamento.barbeiro = barbeiroEscolhido;
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

function criarDataHoraMS(data, hora) {
    return new Date(`${data}T${hora}:00${TIMEZONE_OFFSET}`);
}

function diaFechado(data) {
    const d = new Date(`${data}T00:00:00-04:00`);
    return d.getUTCDay() === 0;
}

function calcularSlotsServico(horaInicial, duracao) {
    const quantidade = Math.ceil(duracao / 30);
    const indiceInicial = HORARIOS_VALIDOS.indexOf(horaInicial);

    if (indiceInicial === -1) return null;

    const slots = [];

    for (let i = 0; i < quantidade; i++) {
        const indiceAtual = indiceInicial + i;

        if (indiceAtual >= HORARIOS_VALIDOS.length) {
            return null;
        }

        slots.push(HORARIOS_VALIDOS[indiceAtual]);
    }

    return slots;
}

function horarioJaPassou(data, hora) {
    const agora = new Date();
    const dataHora = criarDataHoraMS(data, hora);
    return dataHora <= agora;
}

document.getElementById("data")?.addEventListener("change", (e) => {
    agendamento.data = e.target.value;
    agendamento.hora = "";

    if (!agendamento.barbeiro || !agendamento.data) return;

    if (diaFechado(agendamento.data)) {
        const horariosDiv = document.getElementById("horarios");
        if (horariosDiv) horariosDiv.innerHTML = `<p class="horarios-vazio">Fechado neste dia.</p>`;
        return;
    }

    escutarHorarios(agendamento.barbeiro, agendamento.data);
});

function renderizarHorarios(barbeiro, data, ocupados) {
    const horariosDiv = document.getElementById("horarios");
    if (!horariosDiv) return;

    horariosDiv.innerHTML = "";

    if (diaFechado(data)) {
        horariosDiv.innerHTML = `<p class="horarios-vazio">Fechado neste dia.</p>`;
        return;
    }

    const duracao = SERVICOS[agendamento.servico]?.duracao || 30;

    HORARIOS_VALIDOS.forEach(hora => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = hora;
        btn.classList.add("horario-btn");

        const slotsNecessarios = calcularSlotsServico(hora, duracao);
        const passado = horarioJaPassou(data, hora);

        let ocupado = false;

        if (!slotsNecessarios) {
            ocupado = true;
        } else {
            ocupado = slotsNecessarios.some(slot => ocupados.includes(slot));
        }

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

const btnConfirmar = document.getElementById('btnConfirmarAgendamento');

btnConfirmar?.addEventListener('click', async () => {
    const nomeCliente = document.getElementById('nomeCliente')?.value.trim() || "";
    const telefoneCliente = document.getElementById('telefoneCliente')?.value.trim() || "";
    const emailCliente = document.getElementById('emailCliente')?.value.trim() || "";
    const lembrarEmail = document.getElementById('lembrarEmail')?.checked || false;

    if (!nomeCliente || !telefoneCliente || !agendamento.servico || !agendamento.barbeiro || !agendamento.data || !agendamento.hora) {
        alert("Preencha tudo.");
        return;
    }

    if (lembrarEmail && !emailCliente) {
        alert("Informe o e-mail.");
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
            servico: agendamento.servico,
            preco: agendamento.preco,
            barbeiro: agendamento.barbeiro,
            data: agendamento.data,
            hora: agendamento.hora
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
        alert(e.message || "Erro ao agendar.");
    }

    btnConfirmar.disabled = false;
    btnConfirmar.textContent = "Confirmar Agendamento";
});

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

if (typeof flatpickr !== "undefined") {
    flatpickr("#data", {
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "pt",
        disableMobile: true,
        monthSelectorType: "dropdown"
    });
}