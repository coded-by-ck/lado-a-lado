const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

const db = admin.firestore();
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const EMAIL_DESTINO = "miglegame@gmail.com";
const EMAIL_FROM = "Barbearia Lado a Lado <onboarding@resend.dev>";

const TIMEZONE_OFFSET = "-04:00";
const BARBEIROS_VALIDOS = ["Matheus", "Diogo"];

const SERVICOS = {
  "Corte": { preco: "50,00" },
  "Barba": { preco: "40,00" },
  "Acabamento e barba": { preco: "50,00" },
  "Alisamento capilar": { preco: "90,00" },
  "Barba (com Matheus)": { preco: "45,00", barbeiroFixo: "Matheus" },
  "Cabelo + barba + sobrancelha (com Matheus)": { preco: "100,00", barbeiroFixo: "Matheus" },
  "Cabelo + sobrancelha - navalha": { preco: "55,00" },
  "Corte + barba + sobrancelha": { preco: "90,00" },
  "Corte e barba (com Matheus)": { preco: "90,00", barbeiroFixo: "Matheus" },
  "Corte e cavanhaque": { preco: "60,00" },
  "Corte e hidratação": { preco: "85,00" },
  "Corte e sobrancelha (com Matheus)": { preco: "60,00", barbeiroFixo: "Matheus" },
  "Corte sobrancelha e cavanhaque": { preco: "70,00" },
  "Limpeza de pele": { preco: "60,00" },
  "Luzes": { preco: "150,00" },
  "Nevou": { preco: "170,00" },
  "Pezinho": { preco: "20,00" },
  "Pigmentação": { preco: "40,00" },
  "Pigmentação + corte": { preco: "85,00" },
  "Restauração capilar": { preco: "45,00" },
  "Selagem": { preco: "120,00" }
};

const HORARIOS_VALIDOS = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

function validarTelefone(telefone) {
  return typeof telefone === "string" &&
    telefone.length >= 8 &&
    telefone.length <= 20 &&
    /^[0-9+() -]+$/.test(telefone);
}

function validarData(data) {
  return typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data);
}

function validarEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function gerarHorarioId(barbeiro, data, hora) {
  return `${barbeiro}_${data}_${hora}`.replace(/[^\w-]/g, "_");
}

function criarDataHoraMS(data, hora) {
  return new Date(`${data}T${hora}:00${TIMEZONE_OFFSET}`);
}

function diaFechado(data) {
  const d = new Date(`${data}T00:00:00${TIMEZONE_OFFSET}`);
  return d.getUTCDay() === 0; // domingo
}

exports.criarAgendamento = onCall(async (request) => {
  const dados = request.data || {};

  const nome = (dados.nome || "").trim();
  const telefone = (dados.telefone || "").trim();
  const email = (dados.email || "").trim().toLowerCase();
  const lembreteEmail = Boolean(dados.lembreteEmail);
  const servico = (dados.servico || "").trim();
  const preco = (dados.preco || "").trim();
  const barbeiro = (dados.barbeiro || "").trim();
  const data = (dados.data || "").trim();
  const hora = (dados.hora || "").trim();

  if (nome.length < 2 || nome.length > 60) {
    throw new HttpsError("invalid-argument", "Nome inválido.");
  }

  if (!validarTelefone(telefone)) {
    throw new HttpsError("invalid-argument", "Telefone inválido.");
  }

  if (lembreteEmail && !validarEmail(email)) {
    throw new HttpsError("invalid-argument", "Informe um e-mail válido para receber lembrete.");
  }

  if (!BARBEIROS_VALIDOS.includes(barbeiro)) {
    throw new HttpsError("invalid-argument", "Barbeiro inválido.");
  }

  if (!validarData(data)) {
    throw new HttpsError("invalid-argument", "Data inválida.");
  }

  if (diaFechado(data)) {
    throw new HttpsError("failed-precondition", "Não atendemos aos domingos.");
  }

  if (!HORARIOS_VALIDOS.includes(hora)) {
    throw new HttpsError("invalid-argument", "Horário inválido.");
  }

  if (!SERVICOS[servico]) {
    throw new HttpsError("invalid-argument", "Serviço inválido.");
  }

  if (SERVICOS[servico].preco !== preco) {
    throw new HttpsError("invalid-argument", "Preço inválido.");
  }

  if (SERVICOS[servico].barbeiroFixo && SERVICOS[servico].barbeiroFixo !== barbeiro) {
    throw new HttpsError("invalid-argument", `Este serviço deve ser com ${SERVICOS[servico].barbeiroFixo}.`);
  }

  const dataHoraAgendamento = criarDataHoraMS(data, hora);
  const agora = new Date();

  if (dataHoraAgendamento <= agora) {
    throw new HttpsError("failed-precondition", "Não é possível agendar um horário que já passou.");
  }

  const horarioId = gerarHorarioId(barbeiro, data, hora);
  const horarioRef = db.collection("horarios_ocupados").doc(horarioId);
  const agendamentoRef = db.collection("agendamentos").doc();

  await db.runTransaction(async (transaction) => {
    const horarioDoc = await transaction.get(horarioRef);

    if (horarioDoc.exists) {
      throw new HttpsError("already-exists", "Este horário já foi ocupado.");
    }

    transaction.set(agendamentoRef, {
      nome,
      telefone,
      email: email || "",
      lembreteEmail,
      servico,
      preco,
      barbeiro,
      data,
      hora,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      lembrete30Enviado: false,
      status: "pendente"
    });

    transaction.set(horarioRef, {
      barbeiro,
      data,
      hora,
      agendamentoId: agendamentoRef.id,
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return {
    ok: true,
    id: agendamentoRef.id
  };
});

exports.enviarEmailNovoAgendamento = onDocumentCreated(
  {
    document: "agendamentos/{id}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const dados = event.data.data();
    const resend = new Resend(RESEND_API_KEY.value());

    await resend.emails.send({
      from: EMAIL_FROM,
      to: [EMAIL_DESTINO],
      subject: "Novo agendamento 💈",
      html: `
        <h2>Novo agendamento</h2>
        <p><strong>Cliente:</strong> ${dados.nome || "-"}</p>
        <p><strong>Telefone:</strong> ${dados.telefone || "-"}</p>
        <p><strong>E-mail:</strong> ${dados.email || "-"}</p>
        <p><strong>Serviço:</strong> ${dados.servico || "-"}</p>
        <p><strong>Barbeiro:</strong> ${dados.barbeiro || "-"}</p>
        <p><strong>Data:</strong> ${dados.data || "-"}</p>
        <p><strong>Hora:</strong> ${dados.hora || "-"}</p>
      `,
    });

    console.log("Email do admin enviado 🔥");
  }
);

exports.lembrete30min = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Campo_Grande",
    secrets: [RESEND_API_KEY],
  },
  async () => {
    const resend = new Resend(RESEND_API_KEY.value());

    const agora = new Date();
    const inicio = new Date(agora.getTime() + 29 * 60000);
    const fim = new Date(agora.getTime() + 31 * 60000);

    const snapshot = await db.collection("agendamentos").get();

    for (const docSnap of snapshot.docs) {
      const d = docSnap.data();

      if (d.lembrete30Enviado) continue;
      if (d.status === "cancelado" || d.status === "concluido") continue;
      if (!d.lembreteEmail) continue;
      if (!d.email || !validarEmail(d.email)) continue;
      if (!d.data || !d.hora) continue;

      const dataHora = criarDataHoraMS(d.data, d.hora);

      if (dataHora >= inicio && dataHora <= fim) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: [d.email],
          subject: "Seu agendamento é em 30 minutos 💈",
          html: `
            <h2>Seu horário está chegando</h2>
            <p><strong>Cliente:</strong> ${d.nome || "-"}</p>
            <p><strong>Serviço:</strong> ${d.servico || "-"}</p>
            <p><strong>Barbeiro:</strong> ${d.barbeiro || "-"}</p>
            <p><strong>Data:</strong> ${d.data || "-"}</p>
            <p><strong>Hora:</strong> ${d.hora || "-"}</p>
            <p>Te esperamos em 30 minutos 💈</p>
          `,
        });

        await docSnap.ref.update({
          lembrete30Enviado: true,
        });

        console.log(`Lembrete enviado para ${d.email} 🔥`);
      }
    }
  }
);