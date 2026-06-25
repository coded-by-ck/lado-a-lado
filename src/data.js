export const TIMEZONE_OFFSET = "-04:00";
export const WHATSAPP_BARBEARIA = "556799995999";
export const EMAIL_AUTORIZADO = "miglegame@gmail.com";

export const SERVICOS = {
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

export const CATEGORIAS = [
  {
    titulo: "Corte",
    icone: "✂️",
    servicos: ["Corte", "Corte e cavanhaque", "Corte e hidratação", "Corte e barba (com Matheus)", "Corte e sobrancelha (com Matheus)", "Corte sobrancelha e cavanhaque"]
  },
  {
    titulo: "Barba",
    icone: "🧔",
    servicos: ["Barba", "Acabamento e barba", "Barba (com Matheus)"]
  },
  {
    titulo: "Combos",
    icone: "💎",
    servicos: ["Cabelo + barba + sobrancelha (com Matheus)", "Cabelo + sobrancelha - navalha", "Corte + barba + sobrancelha", "Pigmentação + corte"]
  },
  {
    titulo: "Tratamentos",
    icone: "🧴",
    servicos: ["Alisamento capilar", "Limpeza de pele", "Luzes", "Nevou", "Restauração capilar", "Selagem"]
  },
  {
    titulo: "Extras",
    icone: "⚡",
    servicos: ["Pezinho", "Pigmentação"]
  }
];

export const HORARIOS_VALIDOS = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "21:25", "18:00"
];
