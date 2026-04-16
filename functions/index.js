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

const BARBEIROS_VALIDOS = ["Matheus", "Diogo"];
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

function validarServicoPreco(servico, preco) {
  return (
    (servico === "Corte" && preco === "45,00") ||
    (servico === "Barba" && preco === "40,00")
  );
}

function gerarHorarioId(barbeiro, data, hora) {
  return `${barbeiro}_${data}_${hora}`.replace(/[^\w-]/g, "_");
}

// 🔒 CRIAR AGENDAMENTO COM TRAVA REAL
exports.criarAgendamento = onCall(async (request) => {
  const dados = request.data || {};

  const nome = (dados.nome || "").trim();
  const telefone = (dados.telefone || "").trim();
  const email = (dados.email || "").trim().toLowerCase();
  const lembreteEmail = Boolean(dados.lembreteEmail);
  const servico = dados.servico || "";
  const preco = dados.preco || "";
  const barbeiro = dados.barbeiro || "";
  const data = dados.data || "";
  const hora = dados.hora || "";

  if (nome.length < 2 || nome.length > 60) {
    throw new HttpsError("invalid-argument", "Nome inválido.");
  }

  if (!validarTelefone(telefone)) {
    throw new HttpsError("invalid-argument", "Telefone inválido.");
  }

  if (lembreteEmail && !validarEmail(email)) {
    throw new HttpsError("invalid-argument", "Informe um e-mail válido para receber lembrete.");
  }

  if (!validarServicoPreco(servico, preco)) {
    throw new HttpsError("invalid-argument", "Serviço inválido.");
  }

  if (!BARBEIROS_VALIDOS.includes(barbeiro)) {
    throw new HttpsError("invalid-argument", "Barbeiro inválido.");
  }

  if (!validarData(data)) {
    throw new HttpsError("invalid-argument", "Data inválida.");
  }

  if (!HORARIOS_VALIDOS.includes(hora)) {
    throw new HttpsError("invalid-argument", "Horário inválido.");
  }

  // bloqueia horário passado no backend também
  const agora = new Date();
  const dataHoraAgendamento = new Date(`${data}T${hora}:00`);
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

// 🔥 EMAIL PARA O ADMIN NA HORA DO AGENDAMENTO
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

// ⏰ LEMBRETE 30 MIN ANTES PARA O CLIENTE
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

    for (const doc of snapshot.docs) {
      const d = doc.data();

      if (d.lembrete30Enviado) continue;
      if (d.status === "cancelado" || d.status === "concluido") continue;
      if (!d.lembreteEmail) continue;
      if (!d.email || !validarEmail(d.email)) continue;
      if (!d.data || !d.hora) continue;

      const dataHora = new Date(`${d.data}T${d.hora}:00`);

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

        await doc.ref.update({
          lembrete30Enviado: true,
        });

        console.log(`Lembrete enviado para ${d.email} 🔥`);
      }
    }
  }
);