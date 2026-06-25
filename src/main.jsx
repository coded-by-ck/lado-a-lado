import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import flatpickr from "flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import "flatpickr/dist/flatpickr.min.css";
import "../CSS/style.css";
import "../CSS/responsivo.css";
import "../CSS/admin.css";
import "../CSS/ck-loader.css";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db, functions, provider } from "./firebase";
import {
  CATEGORIAS,
  EMAIL_AUTORIZADO,
  HORARIOS_VALIDOS,
  SERVICOS,
  TIMEZONE_OFFSET,
  WHATSAPP_BARBEARIA
} from "./data";

import abelhinha from "../img/abelhinha.png";
import ladoADeus from "../img/lado-a-deus.png";
import heroPri from "../img/hero-pri.png";
import tenis from "../img/tenis.jpg";
import barber3 from "../img/barber-3.jpg";
import barber4 from "../img/barber-4.jpg";
import dragon from "../img/dragon.jpg";
import barber1 from "../img/barber-1.jpg";
import matheus from "../img/mat.jpg";
import diogo from "../img/dg.jpg";

const initialBooking = {
  servico: "",
  preco: "",
  barbeiro: "",
  data: "",
  hora: ""
};

function criarDataHoraMS(data, hora) {
  return new Date(`${data}T${hora}:00${TIMEZONE_OFFSET}`);
}

function diaFechado(data) {
  const d = new Date(`${data}T00:00:00${TIMEZONE_OFFSET}`);
  return d.getUTCDay() === 0;
}

function calcularSlotsServico(horaInicial, duracao) {
  const quantidade = Math.ceil(duracao / 30);
  const indiceInicial = HORARIOS_VALIDOS.indexOf(horaInicial);
  if (indiceInicial === -1) return null;

  const slots = [];
  for (let i = 0; i < quantidade; i += 1) {
    const indiceAtual = indiceInicial + i;
    if (indiceAtual >= HORARIOS_VALIDOS.length) return null;
    slots.push(HORARIOS_VALIDOS[indiceAtual]);
  }
  return slots;
}

function horarioJaPassou(data, hora) {
  return criarDataHoraMS(data, hora) <= new Date();
}

function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const links = [
    ["#home", "Home"],
    ["#sobre", "Sobre"],
    ["#servicos", "Serviços"],
    ["#feedbacks", "Feedbacks"],
    ["#localizacao", "Localização"]
  ];

  return (
    <header>
      <a href="#home"><img src={abelhinha} className="logo" alt="Logo Lado a Lado" /></a>
      <button className="menu-mobile" type="button" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
        <i className="fas fa-bars" />
      </button>
      <nav className="menu">
        <ul>{links.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      </nav>
      <div className="social">
        <a href="https://contate.me/556799995999" target="_blank" rel="noreferrer" className="icon-link"><i className="fab fa-whatsapp" /></a>
        <a href="https://www.instagram.com/ladoalado_barbearia/" target="_blank" rel="noreferrer" className="icon-link"><i className="fab fa-instagram" /></a>
      </div>
      <div className={`menu-lateral ${menuAberto ? "aberto" : ""}`} id="menuLateral">
        <button className="btn-fechar" type="button" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">&times;</button>
        <ul>{links.map(([href, label]) => <li key={href}><a href={href} onClick={() => setMenuAberto(false)}>{label}</a></li>)}</ul>
        <div className="social-mobile">
          <a href="https://contate.me/556799995999" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp" /></a>
          <a href="https://www.instagram.com/ladoalado_barbearia/" target="_blank" rel="noreferrer"><i className="fab fa-instagram" /></a>
        </div>
      </div>
    </header>
  );
}

function BeeLoader() {
  const bees = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const isLeftToRight = Math.random() > 0.48;
    return {
      id: index,
      style: {
        "--start-x": isLeftToRight ? "-18vw" : "118vw",
        "--start-y": `${Math.random() * 78 + 11}vh`,
        "--bee-size": `${Math.random() * 28 + 28}px`,
        "--bee-scale": (Math.random() * 0.38 + 0.78).toFixed(2),
        "--bee-duration": `${(Math.random() * 4.8 + 8.2).toFixed(2)}s`,
        "--bee-delay": `${(Math.random() * -9.5).toFixed(2)}s`,
        "--fly-distance": isLeftToRight ? "132vw" : "-132vw",
        "--fly-a": isLeftToRight ? "28vw" : "-28vw",
        "--fly-b": isLeftToRight ? "64vw" : "-64vw",
        "--fly-c": isLeftToRight ? "100vw" : "-100vw",
        "--wave-a": `${(Math.random() * 64 - 32).toFixed(1)}px`,
        "--wave-b": `${(Math.random() * 82 - 41).toFixed(1)}px`,
        "--wave-c": `${(Math.random() * 64 - 32).toFixed(1)}px`,
        "--wave-d": `${(Math.random() * 44 - 22).toFixed(1)}px`,
        "--start-rot": `${Math.random() * 10 - 5}deg`,
        "--mid-rot-a": `${Math.random() * 12 - 6}deg`,
        "--mid-rot-b": `${Math.random() * 12 - 6}deg`,
        "--mid-rot-c": `${Math.random() * 12 - 6}deg`,
        "--end-rot": `${Math.random() * 10 - 5}deg`,
        "--z-depth": `${Math.random() * 70 - 20}px`,
        "--bee-depth": Math.random() > 0.78 ? 5 : 2,
        "--bee-opacity": (Math.random() * 0.22 + 0.34).toFixed(2)
      }
    };
  }), []);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHide(true), 4300);
    return () => clearTimeout(timer);
  }, []);

  if (hide) return null;
  return (
    <div id="bee-loader">
      <div className="bees">{bees.map((bee) => <span key={bee.id} className="bee" style={bee.style} />)}</div>
      <img src={ladoADeus} alt="Lado a Lado" className="loader-logo" />
    </div>
  );
}

function DecorativeBees() {
  const [captures, setCaptures] = useState([]);
  function captureBee(event, index) {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = `${index}-${Date.now()}`;
    setCaptures((items) => [...items, { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
    event.currentTarget.style.opacity = "0";
    setTimeout(() => {
      event.currentTarget.style.opacity = "";
      setCaptures((items) => items.filter((item) => item.id !== id));
    }, 1400);
  }
  return (
    <>
      <div className="site-bees" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => <span key={index} className="site-bee" onClick={(event) => captureBee(event, index)} />)}
      </div>
      {captures.map((item) => (
        <span key={item.id} className="bee-capture" style={{ "--bee-x": `${item.x}px`, "--bee-y": `${item.y}px` }} />
      ))}
    </>
  );
}

function Hero() {
  const imagens = [heroPri, tenis, barber3, barber4];
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((current) => (current + 1) % imagens.length), 4000);
    return () => clearInterval(id);
  }, [imagens.length]);

  return (
    <main>
      <div className="carrossel" id="home">
        {imagens.map((imagem, index) => <img key={imagem} className={`imagem img${index + 1} ${slide === index ? "ativa" : ""}`} src={imagem} alt="" />)}
        <div className="conteudo-hero">
          <img src={ladoADeus} className="logo-centro" alt="Lado a Lado" />
          <h1>CUIDAMOS DA SUA <strong>AUTOESTIMA</strong></h1>
          <p>CORTE NO TEMPO ESTILO ATEMPORAL</p>
          <div className="botoes-carrossel">
            {imagens.map((imagem, index) => <button key={imagem} type="button" className={`botao ${slide === index ? "selecionado" : ""}`} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}
          </div>
          <a href="#servicos" className="btn-agendar">AGENDE SEU HORARIO</a>
        </div>
      </div>
    </main>
  );
}

function AboutSections() {
  return (
    <>
      <section className="sobre" id="sobre">
        <div className="container-sobre">
          <div className="sobre-imagem"><div className="moldura-dourada"><img src={dragon} alt="Nossa Barbearia" className="foto-perfil" /></div></div>
          <div className="sobre-conteudo">
            <h2 className="titulo-sessao">Nossa <span>História</span></h2>
            <p className="texto-destaque">Tradição, Estilo e Atitude lado a lado com você.</p>
            <p className="descricao">A Barbearia Lado a Lado é um espaço dedicado a oferecer serviços de barbearia de alta qualidade, onde a tradição e a modernidade se encontram para criar uma experiência única. Fundada com o objetivo de proporcionar cortes de cabelo e cuidados excepcionais, nos destacamos pela nossa equipe apaixonada e um ambiente onde você pode relaxar e se sentir valorizado.</p>
            <div className="detalhe-barber">✂</div>
          </div>
        </div>
      </section>
      <section className="origem" id="origem">
        <div className="container-origem">
          <div className="origem-conteudo">
            <h2 className="titulo-sessao">Como tudo <span>Começou</span></h2>
            <p className="texto-destaque">De um sonho de bancada à referência na região.</p>
            <p className="descricao">Tudo começou quando eu varria o chão de uma barbearia e colocava as toalhas para esquentar. Eu não ganhava nada para fazer isso... Na real, ganhava muito: ganhava conhecimento, aprendia técnicas de corte, mas ainda não cortava. Hoje, sendo proprietário da @ladoalado_barbearia, varrer o chão é uma das partes mais gostosas! Muito obrigado por tudo, @ladoalado_barbearia, e aos meus parceiros que trabalham comigo! @mr.cortexx e @pablosilva_barberr</p>
            <div className="detalhe-barber">💈</div>
          </div>
          <div className="origem-imagem"><div className="moldura-dourada-direita"><img src={barber1} alt="Origem da Barbearia" className="foto-origem" /></div></div>
        </div>
      </section>
    </>
  );
}

function Booking() {
  const [categoriaAberta, setCategoriaAberta] = useState("");
  const [agendamento, setAgendamento] = useState(initialBooking);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", lembreteEmail: true });
  const [ocupados, setOcupados] = useState([]);
  const [statusHorarios, setStatusHorarios] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [modal, setModal] = useState(null);
  const dateRef = useRef(null);
  const profissionaisRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!dateRef.current) return undefined;
    const instance = flatpickr(dateRef.current, {
      dateFormat: "Y-m-d",
      minDate: "today",
      locale: Portuguese,
      disableMobile: true,
      monthSelectorType: "dropdown",
      onChange: (_, dateStr) => setAgendamento((current) => ({ ...current, data: dateStr, hora: "" }))
    });
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    if (!agendamento.barbeiro || !agendamento.data) {
      setOcupados([]);
      return undefined;
    }
    if (diaFechado(agendamento.data)) {
      setStatusHorarios("Fechado neste dia.");
      setOcupados([]);
      return undefined;
    }
    setStatusHorarios("");
    const unsubscribe = onSnapshot(collection(db, "horarios_ocupados"), (snapshot) => {
      const novosOcupados = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.barbeiro === agendamento.barbeiro && d.data === agendamento.data) novosOcupados.push(d.hora);
      });
      setOcupados(novosOcupados);
    }, () => setStatusHorarios("Erro ao carregar horários."));
    return unsubscribe;
  }, [agendamento.barbeiro, agendamento.data]);

  function selecionarServico(nome) {
    setAgendamento({ ...initialBooking, servico: nome, preco: SERVICOS[nome].preco });
    setTimeout(() => profissionaisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function selecionarBarbeiro(barbeiro) {
    const fixo = SERVICOS[agendamento.servico]?.barbeiroFixo;
    if (fixo && fixo !== barbeiro) {
      alert(`Esse serviço deve ser com ${fixo}.`);
      return;
    }
    setAgendamento((current) => ({ ...current, barbeiro, data: "", hora: "" }));
    if (dateRef.current?._flatpickr) dateRef.current._flatpickr.clear();
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  const horarios = useMemo(() => {
    if (!agendamento.data || diaFechado(agendamento.data)) return [];
    const duracao = SERVICOS[agendamento.servico]?.duracao || 30;
    return HORARIOS_VALIDOS.map((hora) => {
      const slotsNecessarios = calcularSlotsServico(hora, duracao);
      const ocupado = !slotsNecessarios || slotsNecessarios.some((slot) => ocupados.includes(slot));
      return { hora, disabled: ocupado || horarioJaPassou(agendamento.data, hora) };
    });
  }, [agendamento.data, agendamento.servico, ocupados]);

  async function confirmarAgendamento() {
    if (!form.nome.trim() || !form.telefone.trim() || !agendamento.servico || !agendamento.barbeiro || !agendamento.data || !agendamento.hora) {
      alert("Preencha tudo.");
      return;
    }
    if (form.lembreteEmail && !form.email.trim()) {
      alert("Informe o e-mail.");
      return;
    }
    if (horarioJaPassou(agendamento.data, agendamento.hora)) {
      alert("Esse horário já passou.");
      return;
    }

    try {
      setConfirmando(true);
      const criarAgendamento = httpsCallable(functions, "criarAgendamento");
      await criarAgendamento({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        lembreteEmail: form.lembreteEmail,
        servico: agendamento.servico,
        preco: agendamento.preco,
        barbeiro: agendamento.barbeiro,
        data: agendamento.data,
        hora: agendamento.hora
      });

      if ("vibrate" in navigator) navigator.vibrate([120, 50, 120]);
      const mensagemWhatsApp = `Olá! Acabei de agendar meu horário 💈\n\nNome: ${form.nome.trim()}\nServiço: ${agendamento.servico}\nBarbeiro: ${agendamento.barbeiro}\nData: ${agendamento.data}\nHora: ${agendamento.hora}`;
      setModal({ mensagemWhatsApp, resumo: { ...agendamento } });
      setForm({ nome: "", telefone: "", email: "", lembreteEmail: true });
      setAgendamento(initialBooking);
      if (dateRef.current?._flatpickr) dateRef.current._flatpickr.clear();
    } catch (error) {
      alert(error.message || "Erro ao agendar.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <section className="agendamento-premium" id="servicos">
      <div className="fluxo-agendamento">
        <h2 className="titulo-sessao">Agende seu <span>Estilo</span></h2>
        <div className="passo ativo" id="passo-servicos">
          <div className="header-passo"><span className="numero">01</span><h3>Selecione o Serviço</h3></div>
          <div className="lista-categorias">
            {CATEGORIAS.map((categoria) => (
              <div className="categoria-item" key={categoria.titulo}>
                <button className={`btn-categoria ${categoriaAberta === categoria.titulo ? "ativa" : ""}`} type="button" onClick={() => setCategoriaAberta((atual) => atual === categoria.titulo ? "" : categoria.titulo)}>
                  {categoria.icone} {categoria.titulo} <span className="seta">+</span>
                </button>
                <div className="servicos-lista" style={{ display: categoriaAberta === categoria.titulo ? "block" : "none" }}>
                  {categoria.servicos.map((nome) => <div className="item-servico" key={nome}><div className="info"><strong>{nome}</strong><span>R$ {SERVICOS[nome].preco}</span></div><button className="btn-selecionar" type="button" onClick={() => selecionarServico(nome)}>Selecionar</button></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div ref={profissionaisRef} className={`passo ${agendamento.servico ? "ativo" : ""}`} id="passo-profissionais">
          <div className="header-passo">
            <span className="numero">02</span><h3>Escolha o Profissional</h3>
            <button className="btn-voltar" type="button" onClick={() => setAgendamento(initialBooking)}>← Voltar</button>
          </div>
          <div className="grade-profissionais">
            {[["Matheus", "Especialista", matheus], ["Diogo", "Mestre Barbeiro", diogo]].map(([nome, cargo, foto]) => <div key={nome} className={`card-profissional ${agendamento.barbeiro === nome ? "selecionado" : ""}`}><img src={foto} alt={nome} /><h4>{nome}</h4><span>{cargo}</span><button className="btn-escolher-barbeiro" type="button" onClick={() => selecionarBarbeiro(nome)}>Escolher {nome}</button></div>)}
          </div>
          <div ref={formRef} className="form-agendamento" id="formAgendamento" style={{ display: agendamento.barbeiro ? "block" : "none" }}>
            <h4>Finalize seu agendamento</h4>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" />
            <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="Seu WhatsApp" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Seu e-mail (opcional)" />
            <div className="lembrar-email-box"><input type="checkbox" id="lembrarEmail" checked={form.lembreteEmail} onChange={(e) => setForm({ ...form, lembreteEmail: e.target.checked })} /><label htmlFor="lembrarEmail">Quero receber lembrete por e-mail</label></div>
            <input ref={dateRef} type="text" placeholder="Selecione a data" />
            <div className="horarios-container">
              <h4>Escolha o horário</h4>
              <div id="horarios">
                {statusHorarios && <p className="horarios-vazio">{statusHorarios}</p>}
                {!statusHorarios && horarios.map(({ hora, disabled }) => <button key={hora} type="button" disabled={disabled} className={`horario-btn ${disabled ? "horario-ocupado" : ""} ${agendamento.hora === hora ? "horario-selecionado" : ""}`} onClick={() => setAgendamento((current) => ({ ...current, hora }))}>{hora}</button>)}
              </div>
            </div>
            <button className="btn-finalizar-agendamento" type="button" disabled={confirmando} onClick={confirmarAgendamento}>{confirmando ? "Confirmando..." : "Confirmar Agendamento"}</button>
          </div>
        </div>
      </div>
      {modal && <SuccessModal modal={modal} onClose={() => setModal(null)} />}
    </section>
  );
}

function SuccessModal({ modal, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const { resumo, mensagemWhatsApp } = modal;
  return (
    <div className="modal-sucesso ativo" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-sucesso-box">
        <div className="modal-icone">💈</div>
        <h3>Agendamento confirmado</h3>
        <p>Seu horário foi reservado com sucesso.</p>
        <div className="modal-info"><div><b>Serviço:</b> {resumo.servico}</div><div><b>Barbeiro:</b> {resumo.barbeiro}</div><div><b>Data:</b> {resumo.data}</div><div><b>Hora:</b> {resumo.hora}</div></div>
        <div className="modal-sucesso-botoes">
          <button className="btn-modal-fechar" type="button" onClick={onClose}>Fechar</button>
          <button className="btn-modal-whats" type="button" onClick={() => { window.open(`https://wa.me/${WHATSAPP_BARBEARIA}?text=${encodeURIComponent(mensagemWhatsApp)}`, "_blank"); onClose(); }}>WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackLocationFooter() {
  return (
    <>
      <section className="feedbacks" id="feedbacks">
        <div className="container-feedbacks">
          <div className="sessao-header"><h2 className="titulo-sessao">O que dizem os <span>Clientes</span></h2><div className="google-rating"><span>Avaliação 5.0 no Google Maps</span></div></div>
          <div className="grade-feedbacks">
            {[["Ricardo Silva", "Cliente há 2 anos", "Melhor barbearia da região! O atendimento do Matheus é diferenciado e o ambiente é muito top. Recomendo de olhos fechados."], ["André Oliveira", "Local Guide", "Lugar de extremo bom gosto. O Pablo é um mestre na tesoura, o corte ficou exatamente como eu queria. Cerveja gelada e resenha boa."], ["Bruno Souza", "Cliente VIP", "Fiz a barba com o Marcos e foi uma experiência relaxante. Toalha quente e produtos de primeira. Nota 10!"]].map(([nome, subtitulo, texto]) => <div className="card-feedback" key={nome}><div className="estrelas">★★★★★</div><p className="depoimento">"{texto}"</p><div className="cliente-info"><strong>{nome}</strong><span>{subtitulo}</span></div></div>)}
          </div>
          <div className="feedback-footer"><a href="LINK_DO_SEU_GOOGLE_MAPS_AQUI" target="_blank" rel="noreferrer" className="btn-google">Ver todas no Google</a></div>
        </div>
      </section>
      <section className="localizacao" id="localizacao">
        <div className="container-local"><div className="local-grid"><div className="local-info"><h2 className="titulo-sessao">Onde <span>Estamos</span></h2><p className="endereco"><i className="fas fa-map-marker-alt" /> Av. Brasil, 324 - Centro<br />Ivinhema - MS, 79740-000</p><div className="horarios"><h3><i className="fas fa-clock" /> Horário de Funcionamento</h3><ul><li><span>Segunda - Sexta:</span> 08:00 - 19:00</li><li><span>Sábado:</span> 08:00 - 17:00</li><li><span>Domingo:</span> Fechado</li></ul></div><a href="https://maps.app.goo.gl/FWSjstqdHbVovicq8" target="_blank" rel="noreferrer" className="btn-rota">Como Chegar (Google Maps)</a></div><div className="local-mapa"><iframe title="Mapa Lado a Lado" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.2667328915936!2d-53.824322699999996!3d-22.305749899999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x948ebba0b6d17a9f%3A0xc3292510ad2968dd!2sLado%20a%20Lado!5e0!3m2!1spt-BR!2sbr!4v1775319709361!5m2!1spt-BR!2sbr" width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></div></div>
      </section>
      <footer className="rodape"><div className="container-rodape"><div className="rodape-content"><div className="rodape-logo"><h2>Barbearia <span>Lado a Lado</span></h2><p>Onde a tradição encontra o estilo.</p></div><div className="rodape-links"><h4>Navegação</h4><ul><li><a href="#home">Home</a></li><li><a href="#sobre">Sobre</a></li><li><a href="#servicos">Serviços</a></li><li><a href="#feedbacks">Avaliações</a></li></ul></div><div className="rodape-social"><h4>Siga-nos</h4><div className="social-icons"><a href="https://www.instagram.com/ladoalado_barbearia/" aria-label="Instagram" target="_blank" rel="noreferrer"><i className="fab fa-instagram" /></a><a href="https://contate.me/556799995999" aria-label="WhatsApp" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp" /></a><a href="https://web.facebook.com/matheus.hermenegildo.1" aria-label="Facebook" target="_blank" rel="noreferrer"><i className="fab fa-facebook" /></a></div></div></div><hr className="divisor-rodape" /><div><a href="https://www.instagram.com/codedby.ck/" rel="noopener noreferrer" data-ck-signature><p className="assinatura">© 2026 Coded by <strong>CK</strong></p></a></div></div></footer>
    </>
  );
}

function PublicApp() {
  return (
    <>
      <BeeLoader />
      <DecorativeBees />
      <Header />
      <Hero />
      <AboutSections />
      <Booking />
      <FeedbackLocationFooter />
    </>
  );
}

function gerarHorarioId(barbeiro, data, hora) {
  return `${barbeiro}_${data}_${hora}`.replace(/[^\w-]/g, "_");
}

function AdminApp() {
  const [user, setUser] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser && currentUser.email !== EMAIL_AUTORIZADO) {
      alert("Acesso negado.");
      await signOut(auth);
      return;
    }
    setUser(currentUser);
    setCarregandoAuth(false);
  }), []);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = onSnapshot(collection(db, "agendamentos"), (snapshot) => {
      const novos = [];
      snapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        novos.push({
          id: docSnap.id,
          nome: dados.nome || "Sem nome",
          telefone: dados.telefone || "-",
          email: dados.email || "-",
          servico: dados.servico || "-",
          preco: dados.preco || "-",
          duracao: dados.duracao || 30,
          barbeiro: dados.barbeiro || "-",
          data: dados.data || "-",
          hora: dados.hora || "-",
          slots: Array.isArray(dados.slots) ? dados.slots : [],
          status: dados.status || "pendente"
        });
      });
      novos.sort((a, b) => new Date(`${a.data}T${a.hora || "00:00"}${TIMEZONE_OFFSET}`) - new Date(`${b.data}T${b.hora || "00:00"}${TIMEZONE_OFFSET}`));
      setAgendamentos(novos);
    });
    return unsubscribe;
  }, [user]);

  const filtrados = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const agora = new Date();
    return agendamentos.filter((item) => {
      if (filtro === "todos") return true;
      if (["pendente", "concluido", "cancelado"].includes(filtro)) return item.status === filtro;
      if (filtro === "hoje") return item.data === hoje;
      if (filtro === "proximos") return new Date(`${item.data}T${item.hora || "00:00"}${TIMEZONE_OFFSET}`) >= agora && item.status !== "cancelado";
      return true;
    });
  }, [agendamentos, filtro]);

  async function removerSlotsPorAgendamento(dados, agendamentoId) {
    if (Array.isArray(dados.slots)) {
      for (const horaSlot of dados.slots) {
        await deleteDoc(doc(db, "horarios_ocupados", gerarHorarioId(dados.barbeiro, dados.data, horaSlot))).catch(() => {});
      }
    }
    const snap = await getDocs(query(collection(db, "horarios_ocupados"), where("agendamentoId", "==", agendamentoId)));
    for (const item of snap.docs) await deleteDoc(doc(db, "horarios_ocupados", item.id));
  }

  async function recriarSlotsPorAgendamento(dados, agendamentoId) {
    if (!Array.isArray(dados.slots) || dados.slots.length === 0) return;
    for (let index = 0; index < dados.slots.length; index += 1) {
      const horaSlot = dados.slots[index];
      const horarioRef = doc(db, "horarios_ocupados", gerarHorarioId(dados.barbeiro, dados.data, horaSlot));
      const horarioSnap = await getDoc(horarioRef);
      if (!horarioSnap.exists()) await setDoc(horarioRef, { barbeiro: dados.barbeiro, data: dados.data, hora: horaSlot, slotIndex: index, agendamentoId, servico: dados.servico });
    }
  }

  async function atualizarStatus(id, novoStatus) {
    const dados = agendamentos.find((item) => item.id === id);
    if (!dados) return;
    await updateDoc(doc(db, "agendamentos", id), { status: novoStatus });
    if (novoStatus === "cancelado") await removerSlotsPorAgendamento(dados, id);
    if (novoStatus === "pendente" || novoStatus === "concluido") await recriarSlotsPorAgendamento(dados, id);
  }

  async function excluirAgendamento(id) {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
    const dados = agendamentos.find((item) => item.id === id);
    if (dados) await removerSlotsPorAgendamento(dados, id);
    await deleteDoc(doc(db, "agendamentos", id));
    alert("Agendamento excluído com sucesso.");
  }

  return (
    <main className="admin-page">
      <section className="admin-box">
        <div className="admin-header"><h1>Painel do Barbeiro</h1><p>Barbearia Lado a Lado</p></div>
        {!carregandoAuth && !user && <div className="login-area" style={{ display: "flex" }}><button className="btn-principal" type="button" onClick={() => signInWithPopup(auth, provider).catch(() => alert("Erro no login"))}>Entrar com Google</button></div>}
        {user && <div className="painel" style={{ display: "block" }}><div className="painel-topo"><h2>Agendamentos</h2><div className="topo-acoes"><div className="filtros">{[["todos", "Todos"], ["pendente", "Pendentes"], ["concluido", "Concluídos"], ["cancelado", "Cancelados"], ["hoje", "Hoje"], ["proximos", "Próximos"]].map(([id, label]) => <button key={id} className={`btn-filtro ${filtro === id ? "ativo" : ""}`} type="button" onClick={() => setFiltro(id)}>{label}</button>)}</div><button className="btn-logout" type="button" onClick={() => signOut(auth)}>Sair</button></div></div><div className="lista-agendamentos">{filtrados.length === 0 && <p className="mensagem">Nenhum agendamento encontrado.</p>}{filtrados.map((dados) => <div className="card-agendamento" key={dados.id}><div className="card-topo"><h3>{dados.nome}</h3><span className={`status status-${dados.status}`}>{dados.status}</span></div><div className="card-info"><p><strong>Telefone:</strong> <a className="telefone-link" href={`https://wa.me/55${String(dados.telefone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{dados.telefone}</a></p><p><strong>E-mail:</strong> {dados.email || "-"}</p><p><strong>Serviço:</strong> {dados.servico}</p><p><strong>Duração:</strong> {dados.duracao || "-"} min</p><p><strong>Preço:</strong> R$ {dados.preco}</p><p><strong>Barbeiro:</strong> {dados.barbeiro}</p><p><strong>Data:</strong> {dados.data}</p><p><strong>Hora:</strong> {dados.hora}</p></div><div className="card-acoes"><button className="btn-acao btn-confirmar" type="button" onClick={() => atualizarStatus(dados.id, "pendente")}>Pendente</button><button className="btn-acao btn-concluir" type="button" onClick={() => atualizarStatus(dados.id, "concluido")}>Concluir</button><button className="btn-acao btn-cancelar" type="button" onClick={() => atualizarStatus(dados.id, "cancelado")}>Cancelar</button><button className="btn-excluir" type="button" onClick={() => excluirAgendamento(dados.id)}>Excluir</button></div></div>)}</div></div>}
      </section>
    </main>
  );
}

const isAdmin = window.location.pathname.endsWith("/admin.html") || window.location.pathname.endsWith("/admin");
createRoot(document.getElementById("root")).render(<React.StrictMode>{isAdmin ? <AdminApp /> : <PublicApp />}</React.StrictMode>);
