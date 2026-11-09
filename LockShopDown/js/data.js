'use strict';
/* =========================================================
   LOCKSHOPDOWN — dados: itens, personagens, história, eventos
   ========================================================= */

const ITEMS = {
  comida:     { n: 'Comida enlatada', short: 'Comida', w: 1, pick: 3, desc: 'Uma caixa com 3 latas. Sardinha, milho, salsicha. A tríade.' },
  agua:       { n: 'Fardo de água', short: 'Água', w: 1, pick: 4, desc: '4 garrafas, bem amarradas. Vale cada gota.' },
  remedio:    { n: 'Remédios', short: 'Remédio', w: 1, pick: 2, desc: 'Cura ferimentos e doenças. Não cura A Calma.' },
  pilhas:     { n: 'Pilhas', short: 'Pilhas', w: 1, pick: 3, desc: 'Para o rádio, a lanterna e a luz de emergência.' },
  tabuas:     { n: 'Tábuas', short: 'Tábuas', w: 2, pick: 2, desc: 'Reforçam a barricada da porta.' },
  mascara:    { n: 'Máscaras', short: 'Máscara', w: 1, pick: 2, desc: 'Reduzem a chance de infecção nas expedições.' },
  cobertor:   { n: 'Cobertor', short: 'Cobertor', w: 1, pick: 1, desc: 'Evita que quem está na câmara fria congele.' },
  termometro: { n: 'Termômetro', short: 'Termômetro', w: 1, u: 1, desc: 'Detecta febre, que aparece a partir do 2º estágio da Calma.' },
  lanterna:   { n: 'Lanterna UV', short: 'Lanterna', w: 1, u: 1, desc: 'Pupilas infectadas não reagem à luz. Gasta 1 pilha por uso.' },
  radio:      { n: 'Rádio de ondas curtas', short: 'Rádio', w: 1, u: 1, desc: 'A única forma de pedir resgate.' },
  marreta:    { n: 'Marreta', short: 'Marreta', w: 2, u: 1, desc: 'Defesa. Ajuda em brigas, invasões e expedições.' },
  videogame:  { n: 'Videogame portátil', short: 'Videogame', w: 1, u: 1, desc: 'Torneio diário de blocos caindo: reduz o estresse do grupo.' },
  kit:        { n: 'Teste rápido', short: 'Teste', w: 1, pick: 1, desc: 'Diz com certeza se alguém está infectado. Uso único.' },
  soro:       { n: 'Soro experimental', short: 'Soro', w: 1, pick: 1, desc: 'Neutraliza A Calma, se aplicado antes da fase final.' },
  amostra:    { n: 'Amostra de Serenitá', short: 'Amostra', w: 1, u: 1, desc: 'Um copinho lacrado da bebida. Não beba.' },
  chaves:     { n: 'Chave do Fiat', short: 'Chaves', w: 1, u: 1, desc: 'Chave reserva do carro do Lacerda.' },
  racao:      { n: 'Ração premium', short: 'Ração', w: 1, pick: 3, as: 'comida', desc: 'Tecnicamente comestível. Conta como comida.' },
};
const INV_ORDER = ['comida', 'agua', 'remedio', 'pilhas', 'tabuas', 'mascara', 'cobertor', 'kit', 'soro', 'termometro', 'lanterna', 'radio', 'marreta', 'videogame', 'amostra', 'chaves'];

const SKIN = ['#f3cfaa', '#e5b088', '#c98e5f', '#9a6440', '#6b4128'];

/* ---------------- protagonistas ---------------- */
const PROTAGONISTS = [
  { key: 'rafa', name: 'Rafa', role: 'Reposição · Supermercado Bom Preço',
    perk: 'Revista prateleiras 40% mais rápido. Conhece o estoque de olhos fechados.',
    look: { skin: SKIN[2], hair: '#3b2416', hs: 'short', shirt: '#2e86de', pants: '#34495e', shoes: '#222', acc: ['apron', 'badge'], apron: '#d64933', seed: 1 } },
  { key: 'jo', name: 'Jô', role: 'Segurança noturna · LockShop Center',
    perk: 'Mais fôlego para correr e se solta mais rápido dos abraços. Ganha brigas no abrigo.',
    look: { skin: SKIN[4], hair: '#111', hs: 'buzz', shirt: '#2c3e66', pants: '#1f2a44', shoes: '#111', acc: ['cap', 'badge'], seed: 2 } },
  { key: 'dani', name: 'Dani', role: 'Vendas · Eletro Mega',
    perk: 'Lábia: faz uma pergunta a mais na porta. Começa com uma lanterna UV no bolso.',
    look: { skin: SKIN[0], hair: '#7a3e1d', hs: 'curly', shirt: '#f1c40f', pants: '#2d3436', shoes: '#c0392b', acc: ['glasses', 'badge', 'headset'], seed: 3 } },
];

/* ---------------- sobreviventes e visitantes ---------------- */
const TRAITS = {
  zen:      { n: 'Tranquilo', d: 'Calmo por natureza. Sim, isso confunde.' },
  piadista: { n: 'Piadista', d: 'Reduz o estresse do grupo todo dia.' },
  forte:    { n: 'Forte', d: 'Melhor em expedições e brigas.' },
  medico:   { n: 'Cuida de feridos', d: 'Recupera a saúde de alguém toda noite.' },
  tecnico:  { n: 'Entende de rádio', d: 'Dobra a chance de contato pelo rádio.' },
  chorao:   { n: 'Reclamão', d: 'Aumenta o estresse dos outros.' },
  ladrao:   { n: 'Prestativo', d: 'Sempre disposto a ajudar. Sempre.' },
  guia:     { n: 'Conhece o shopping', d: 'Expedições mais seguras.' },
  cozinheiro:{ n: 'Cozinheiro', d: 'Às vezes faz uma lata render para dois.' },
  fofo:     { n: 'Fofo', d: 'Ninguém fica triste perto dessa pessoa.' },
  quimica:  { n: 'Química', d: 'Sabe fabricar o soro, com os ingredientes certos.' },
};

const CHARACTERS = {
  lucia: { name: 'Dona Lúcia', trait: 'zen', offer: { comida: 2 },
    look: { skin: SKIN[1], hair: '#c9c9c9', hs: 'bun', shirt: '#8e6bb8', pants: '#5d4a6b', shoes: '#3b2b2b', acc: ['glasses'], body: 'old', seed: 11 },
    bio: 'Aposentada. Estava na fila do banco desde 2019.',
    intro: 'Meu filho, abre aí. Eu trouxe bolacha.',
    why: 'Eu sei fazer render uma lata de sardinha por três dias. Criei cinco filhos.' },
  kelly: { name: 'Kelly', trait: 'piadista', offer: { pilhas: 1 },
    look: { skin: SKIN[3], hair: '#1b1b1b', hs: 'long', shirt: '#ff6fa5', pants: '#2d3436', shoes: '#fff', acc: ['earring', 'phone'], seed: 12 },
    bio: 'Vendedora do quiosque de capinhas. Ainda tenta te vender uma.',
    intro: 'Capinha anti-mordida, 50% off! Brincadeira. Me deixa entrar, PELO AMOR DE DEUS.',
    why: 'Eu faço vocês rirem. Vocês vão precisar.' },
  jorge: { name: 'Seu Jorge', trait: 'forte', offer: null,
    look: { skin: SKIN[3], hair: '#ddd', hs: 'bald', shirt: '#4a5d7e', pants: '#2b3445', shoes: '#111', acc: ['mustache', 'badge'], beard: '#eee', body: 'old', seed: 13 },
    bio: 'Segurança aposentado do shopping. Ainda usa o crachá.',
    intro: 'Trinta anos de segurança aqui. Nunca vi nada assim. Bom, teve uma Black Friday...',
    why: 'Já segurei porta com multidão de Black Friday do outro lado. Isso aqui é fichinha.' },
  roberto: { name: 'Dr. Roberto', trait: 'medico', offer: { remedio: 1 },
    look: { skin: SKIN[0], hair: '#8a8a8a', hs: 'buzz', shirt: '#7fb3d5', pants: '#34495e', shoes: '#222', acc: ['glasses', 'labcoat'], seed: 14 },
    bio: 'Dentista. Não é bem médico, mas tem anestesia.',
    intro: 'Sou da área da saúde! Bucal, mas é saúde.',
    why: 'Sei costurar, enfaixar e dar bronca por falta de fio dental.' },
  taina: { name: 'Tainá', trait: 'tecnico', offer: { pilhas: 2 },
    look: { skin: SKIN[2], hair: '#2a1a12', hs: 'pony', shirt: '#2d3436', pants: '#3d5a80', shoes: '#eee', acc: ['headband'], band: '#00cec9', seed: 15 },
    bio: '16 anos. Entediada. Só quer o Wi-Fi de volta.',
    intro: 'Vocês têm Wi-Fi aí? Tô brincando. Não tô. Tem?',
    why: 'Eu consigo fazer qualquer rádio pegar. Já hackeei a TV da escola.' },
  edinaldo: { name: 'Pastor Edinaldo', trait: 'zen', offer: { agua: 1 },
    look: { skin: SKIN[3], hair: '#222', hs: 'short', shirt: '#2c2c34', pants: '#1e1e24', shoes: '#111', acc: ['collar', 'mustache'], seed: 16 },
    bio: 'Prega sobre o fim dos tempos. Parece satisfeito.',
    intro: 'Eu avisei, irmão. Avisei por 22 anos. Abre que eu te conto como foi.',
    why: 'A fé me mantém calmo. Calmo do jeito bom. Eu acho.' },
  bruno: { name: 'Bruno', trait: 'forte', offer: { agua: 2 },
    look: { skin: SKIN[1], hair: '#4a2f1d', hs: 'buzz', shirt: '#ff7f50', pants: '#2d3436', shoes: '#0984e3', acc: ['headband'], band: '#fff', body: 'big', seed: 17 },
    bio: 'Personal trainer. Diz que fugir é cardio.',
    intro: 'Mano, corri do 3º andar até aqui. Zona 4 de frequência cardíaca.',
    why: 'Carrego dois fardos de água em cada braço. Ida e volta.' },
  valdirene: { name: 'Valdirene', trait: 'chorao', offer: { cobertor: 1 },
    look: { skin: SKIN[0], hair: '#f0c75e', hs: 'curly', shirt: '#c0392b', pants: '#111', shoes: '#c0392b', acc: ['earring', 'scarf'], scarf: '#f5cd79', seed: 18 },
    bio: 'Gerente da Moda Fashion. Quer falar com o gerente.',
    intro: 'Eu EXIJO entrar. Eu sou GERENTE. De outra loja, mas sou.',
    why: 'Eu organizo. Vocês estão precisando de alguém que organize, isso aí tá um caos.' },
  gilmar: { name: 'Gilmar', trait: 'ladrao', offer: { comida: 3 },
    look: { skin: SKIN[1], hair: '#2b2b2b', hs: 'short', shirt: '#dfe6e9', pants: '#2d3436', shoes: '#111', acc: ['tie', 'glasses'], tie: '#0a3d62', seed: 19 },
    bio: 'Diz que trabalha "no RH". De qual empresa, não fala.',
    intro: 'Boa noite! Gilmar, do RH. Vim fazer um levantamento de clima organizacional.',
    why: 'Sou muito prestativo. Pode me deixar cuidando do estoque.' },
  marta: { name: 'Marta', trait: 'medico', offer: { remedio: 2 },
    look: { skin: SKIN[4], hair: '#1b1b1b', hs: 'pony', shirt: '#48c9b0', pants: '#48c9b0', shoes: '#fff', acc: ['nurse'], seed: 20 },
    bio: 'Enfermeira. Saiu do plantão para comprar um presente. Péssimo timing.',
    intro: 'Sou enfermeira. Posso cuidar de quem estiver ferido. Por favor.',
    why: 'Doze anos de pronto-socorro. Ferimento, febre, desmaio: é comigo.' },
  fabinho: { name: 'Fabinho', trait: 'zen', offer: { comida: 1 },
    look: { skin: SKIN[0], hair: '#eee', hs: 'short', shirt: '#d0312d', pants: '#d0312d', shoes: '#111', acc: ['santa', 'beard'], beard: '#f5f5f5', body: 'big', seed: 21 },
    bio: 'Papai Noel do shopping. Contratado em novembro, por algum motivo.',
    intro: 'Ho... ho... ho. Abre aí, criança. O Papai Noel tá com medo.',
    why: 'Eu tenho uma lista de quem foi bonzinho. Vocês estão nela. Por enquanto.' },
  neide: { name: 'Neide', trait: 'guia', offer: { tabuas: 1 },
    look: { skin: SKIN[3], hair: '#3a2a20', hs: 'short', shirt: '#2e86de', pants: '#2e86de', shoes: '#222', acc: ['headband', 'apron'], band: '#e17055', apron: '#b2bec3', seed: 22 },
    bio: 'Da limpeza. Conhece cada duto e corredor deste lugar.',
    intro: 'Limpo esse shopping há 15 anos. Sei onde fica tudo. Inclusive o que ninguém devia achar.',
    why: 'Eu sei andar por esse shopping sem fazer barulho. Ninguém nunca me vê.' },
  ricardinho: { name: 'Ricardinho', trait: 'piadista', offer: null,
    look: { skin: SKIN[1], hair: '#6c5ce7', hs: 'spiky', shirt: '#fdcb6e', pants: '#0984e3', shoes: '#fff', acc: ['phone'], seed: 23 },
    bio: 'Influencer. Fazendo live. Doze pessoas assistindo.',
    intro: 'Galera, olha, um sobrevivente! Dá um oi pra live! Deixa eu entrar que o sinal aí é melhor.',
    why: 'Se a gente sair dessa, eu viralizo vocês. Prometo.' },
  tonhao: { name: 'Tonhão', trait: 'cozinheiro', offer: { comida: 2 },
    look: { skin: SKIN[2], hair: '#222', hs: 'short', shirt: '#fff', pants: '#2d3436', shoes: '#222', acc: ['apron', 'mustache', 'headband'], apron: '#f5f5f5', band: '#fff', body: 'big', seed: 24 },
    bio: 'Dono da pastelaria da praça. Jura que o pastel de vento é uma escolha.',
    intro: 'Fiquei no freezer da pastelaria dois dias. Tô bem. Tô gelado, mas tô bem.',
    why: 'Eu faço uma lata virar janta pra dois. Truque de pastel de vento.' },
  /* especiais da história */
  enzo: { name: 'Enzo', trait: 'fofo', offer: { comida: 2 }, special: true,
    look: { skin: SKIN[1], hair: '#c27c3a', hs: 'short', shirt: '#55efc4', pants: '#0984e3', shoes: '#d63031', acc: [], body: 'kid', seed: 31 },
    bio: '8 anos. Perdeu a mãe na loja de brinquedos. Tem uma mochila cheia de salgadinho.',
    intro: 'Moço, você viu minha mãe? Ela tava sorrindo muito e eu fiquei com medo.',
    why: 'Eu divido meu salgadinho. E eu sou bom de esconde-esconde.' },
  wagner: { name: 'Sorrisinho', trait: 'piadista', offer: { comida: 1 }, special: true, mascot: true, realName: 'Wagner',
    look: { skin: SKIN[2], hair: '#3b2416', hs: 'short', shirt: '#f6c62f', pants: '#f6c62f', shoes: '#e17055', acc: [], mascot: true, seed: 32 },
    face: { skin: SKIN[2], hair: '#3b2416', hs: 'short', shirt: '#f6c62f', pants: '#f6c62f', shoes: '#e17055', acc: [], seed: 32 },
    bio: 'O mascote oficial do LockShop Center. Sorri por contrato.',
    intro: 'Oi, amiguinhos! É o Sorrisinho! Posso entrar? Tá muito calor aqui dentro da fantasia.',
    why: 'Eu sei animar festa infantil por seis horas seguidas. Vocês não sabem o que é resistência.' },
  helena: { name: 'Dra. Helena', trait: 'quimica', offer: { remedio: 1 }, special: true,
    look: { skin: SKIN[0], hair: '#1b1b1b', hs: 'bun', shirt: '#6c7a89', pants: '#2d3436', shoes: '#111', acc: ['labcoat', 'glasses'], seed: 33 },
    bio: 'Química-chefe do laboratório da Serenitá. Parece não dormir há dias.',
    intro: 'Eu sei o que causou isso. E acho que sei como reverter. Por favor, abram.',
    why: 'Eu posso fabricar um soro. Preciso de uma amostra da Serenitá e de remédios.' },
};
const REGULARS = Object.keys(CHARACTERS).filter(k => !CHARACTERS[k].special);

/* ---------------- falas e pistas ---------------- */
const TALK = {
  calm: [
    'Está tudo bem. De verdade. Pode abrir.',
    'Medo? Não. Por que eu teria medo?',
    'Lá fora está tão tranquilo... vocês deviam sair um pouco.',
    'Eu só quero ficar perto de vocês. Pertinho.',
    'Vocês parecem tão cansados. Eu posso ajudar vocês a descansar.',
  ],
  zen: [
    'Medo eu tenho, mas respiro fundo. Sempre fui assim.',
    'Já passei por coisa pior. A ditadura, a inflação, o Orkut.',
    'Calma, filho. Desespero não abre porta.',
  ],
  nervous: [
    'Pelo amor de Deus, abre! Tem um negócio SORRINDO pra mim no fim do corredor!',
    'Muito medo! Eu não fui mordido, juro! Pode olhar!',
    'Tô com fome, com sede e com muito, muito medo.',
    'Eu vi o que eles fazem. Eles abraçam. Por muito tempo. Depois...',
  ],
  member_calm: [
    'Tô ótimo. Melhor que nunca, na verdade.',
    'Por que você tá me olhando assim? Relaxa.',
    'Sonhei que a gente abria a porta. Foi lindo.',
    'Nem tô com fome. Não sinto mais fome. É ótimo.',
  ],
  member_nervous: [
    'Eu? Infectado? Você que tá estranho.',
    'Não aguento mais sardinha. Mas tô bem.',
    'Ontem eu chorei no banheiro. Normal, né? Normal.',
    'Se um dia eu ficar calmo, me tranca. Promete?',
  ],
};
const OPEN_PLACES = ['do banheiro do 2º andar', 'da loja de colchões', 'do estacionamento G1', 'da lotérica', 'da academia do 3º andar', 'da escada de emergência leste', 'do fraldário', 'da agência dos Correios'];
const CLOSED_PLACES = {
  cinema:     { place: 'do cinema', day: 1, fact: 'O cinema foi lacrado antes da porta baixar. Ninguém saiu de lá.' },
  praca:      { place: 'da praça de alimentação', day: 4, fact: 'A praça de alimentação foi tomada pelos Calmos (dia 4).' },
  brinquedos: { place: 'da Brinquedolândia', day: 6, fact: 'A Brinquedolândia está infestada desde o dia 6.' },
  controle:   { place: 'da sala de controle', day: 10, fact: 'A sala de controle caiu. O Lacerda virou um deles (dia 10).' },
};
const SIGNS_TEXT = {
  pale: 'A pele está pálida, meio esverdeada.',
  sweat: 'Está suando muito.',
  smile: 'Sorri o tempo todo. Mesmo quando para de falar.',
  bandage: 'Tem um curativo no pescoço.',
  glassy: 'Os olhos parecem leitosos.',
  scratch: 'Tem arranhões no rosto.',
};
const INF_CLUES = [
  '{n} passou a noite cantarolando baixinho, de olhos abertos.',
  '{n} não tocou na comida. Disse que "não sente mais necessidade".',
  'Às 4h, {n} estava de pé em frente à porta. Só olhando.',
  '{n} está quentinho demais. "Febre? Não, é carinho."',
  '{n} abraçou todo mundo de manhã. Por tempo demais.',
  '{n} sorri enquanto dorme.',
];
const HERRING_CLUES = [
  '{n} tossiu a noite toda. "É rinite", jura.',
  '{n} está falando sozinho. "Tô rezando", diz.',
  '{n} acordou suando. Pesadelo, provavelmente.',
  '{n} comeu escondido uma lata inteira. Suspeito, mas por outro motivo.',
];
const PLAYER_CLUES = [
  'Você acordou se sentindo estranhamente descansado. Bem até demais.',
  'Você se pegou sorrindo para a porta. Por quanto tempo?',
  'Você não sente fome. Nem medo. Que alívio. Que... alívio?',
];
const FB_INF = [
  'De madrugada, vocês ouviram {n} cantarolando no corredor. Por horas.',
  '{n} bateu na porta de novo às 3h. Educadamente. A cada quinze minutos.',
  'Pela fresta, vocês viram {n} abraçando um manequim. Por muito tempo.',
];
const FB_OK = [
  'Ouviram gritos no corredor. Era a voz de {n}. Depois, silêncio.',
  'De manhã havia um bilhete embaixo da porta: "obrigado por nada". Assinado: {n}.',
];
const RADIO_FAIL = [
  'Só chiado. E uma rádio evangélica pedindo dízimo via Pix.',
  'Você pegou um programa de receitas. Ainda no ar. Admirável.',
  'Uma voz calma: "Venham pra rua. Tá tão bom aqui." Você desligou rápido.',
  'Chiado. Chiado. Alguém tossindo. Chiado.',
  'Um locutor anuncia a Liquidação Final. É uma gravação. Ninguém desligou.',
];

/* ---------------- arquivo (lore) ---------------- */
const NOTES = {
  memo:      { t: 'Memorando do Marketing', x: '"Lançamento da SERENITÁ na Liquidação Final. Meta: 5.000 amostras grátis na praça de alimentação. Slogan aprovado: BEBA A CALMA." Alguém escreveu na margem: "genial!!!".' },
  email:     { t: 'E-mail impresso do laboratório', x: '"Fase 2 dos testes: efeito colateral de tranquilidade irreversível e afeto excessivo. Diretoria decidiu lançar mesmo assim. Prazo é prazo."' },
  diario:    { t: 'Diário do Sorrisinho', x: '"Tomei três copinhos de Serenitá entre um abraço e outro nas crianças. Nunca me senti tão bem. Será que alguém percebe que eu não paro de sorrir? Ah. A fantasia."' },
  bilhete:   { t: 'Bilhete do Lacerda', x: '"Chave reserva do Fiat no cofre da sala de controle. Senha: 1-9-9-4. NÃO contar pra diretoria." O Fiat está no estacionamento G2.' },
  relatorio: { t: 'Relatório técnico rasgado', x: '"...o agente fica lento abaixo de 4°C. Exposição prolongada ao frio força os sintomas a aparecer..." Então é por isso que a câmara fria funciona.' },
  formula:   { t: 'Anotação de laboratório', x: '"Neutralizante: amostra concentrada + ácido ascórbico em dose alta (os remédios da drogaria servem). Funciona se aplicado ANTES da fase final."' },
  entrega:   { t: 'Comprovante de entrega', x: '"Pedido #4471: 40 Serenitás geladas para a sala de controle. Cliente: Lacerda. Obs.: o entregador vai esperar na câmara fria do depósito 3B até alguém assinar." Ninguém assinou.' },
  cupom:     { t: 'Cupom fiscal amassado', x: '"1x SERENITÁ 300ml ........ R$ 0,00 (AMOSTRA GRÁTIS). Cliente: Valéria. Acompanhante: Enzo (não bebeu, achou amargo)." Crianças às vezes têm razão.' },
  helena:    { t: 'Carta de demissão', x: '"Eu avisei sobre a fase 2. Não vou assinar o laudo de segurança. Guardei uma cópia da fórmula do neutralizante no meu jaleco. Se tudo der errado, me procurem no laboratório do 3º andar. Dra. Helena."' },
  neide:     { t: 'Bilhete da Neide', x: '"Os dutos de ventilação do depósito descem até a galeria de esgoto da avenida. Dá pra sair por ali. Mas só cabe gente magra, corajosa e que não liga pra rato. Ass.: Neide (limpeza)."' },
  militar:   { t: 'Comunicado militar interceptado', x: '"Operação Telhado Limpo. Prioridade: civis assintomáticos. Civis SORRIDENTES: NÃO EMBARCAR. Prazo de evacuação: dia 18. Depois, protocolo Concreto."' },
  desenho:   { t: 'Desenho de criança', x: 'Um bonequinho amarelo, enorme, abraçando várias pessoas palito. Todas sorrindo. Embaixo, em letra torta: "o sorrisinho virou de verdade".' },
  lacerda:   { t: 'Diário do Lacerda', x: '"Dia 3. Ninguém responde da diretoria. Bebi um copinho de Serenitá pra aguentar o estresse. Só um. Só pra aguentar. Dia 6: me sinto ótimo. Por que eu estava preocupado mesmo?"' },
};
const NOTE_HINTS = {
  memo: 'Quiosque da Serenitá ou Praça de Alimentação', email: 'Drogaria', diario: 'Brinquedolândia', bilhete: 'Sala de Controle', relatorio: 'Praça de Alimentação',
  formula: 'Praça ou Sala de Controle', entrega: 'Um evento no depósito', cupom: 'Supermercado ou Praça', helena: 'Drogaria ou Praça', neide: 'Ferragens ou Moda Fashion',
  militar: 'Eletro Mega, Sala de Controle ou Estacionamento', desenho: 'Brinquedolândia', lacerda: 'Sala de Controle',
};

/* ---------------- finais ---------------- */
const ENDINGS = {
  outside:    { t: 'Lado errado da porta', h: 'Não esteja no depósito quando a porta baixar.' },
  trapped:    { t: 'Preso na loja', h: 'Fique numa loja quando a persiana descer.' },
  dead:       { t: 'Fim do expediente', h: 'Morra no depósito.' },
  calma:      { t: 'Você se sente ótimo', h: 'Seja infectado sem perceber.' },
  concrete:   { t: 'Patrimônio histórico', h: 'Chegue ao dia 18 sem plano de fuga.' },
  rescue:     { t: 'Saída pelo telhado', h: 'Seja resgatado pelo helicóptero.' },
  cure:       { t: 'A cura na mochila', h: 'Seja resgatado com o soro.' },
  heli_twist: { t: 'A Calma decolou', h: 'Leve um infectado no helicóptero.' },
  car:        { t: 'Pé na estrada', h: 'Fuja no carro do gerente.' },
  car_twist:  { t: 'A Calma pegou carona', h: 'Leve um infectado no carro.' },
  dutos:      { t: 'Rato de duto', h: 'Descubra o caminho da equipe de limpeza.' },
  beber:      { t: 'Beba a calma', h: 'Faça o que o slogan manda.' },
};

/* ---------------- conquistas ---------------- */
const ACHIEVEMENTS = {
  first_run:  { t: 'Bati o ponto', d: 'Sobreviva à primeira exploração.' },
  packrat:    { t: 'Acumulador', d: 'Traga 30 ou mais unidades de itens da exploração.' },
  full_house: { t: 'Casa cheia', d: 'Salve 3 sobreviventes na exploração.' },
  dog:        { t: 'Melhor amigo', d: 'Resgate o Caramelo.' },
  untouched:  { t: 'Intocável', d: 'Termine a exploração sem levar nenhum abraço.' },
  skip:       { t: 'Pressa é tudo', d: 'Pule a exploração.' },
  week:       { t: 'Uma semana', d: 'Sobreviva 7 noites no depósito.' },
  detector:   { t: 'Detector de mentiras', d: 'Mande embora 3 infectados numa partida.' },
  freezer:    { t: 'Gelo nas veias', d: 'Revele um infectado na câmara fria.' },
  mascot:     { t: 'Tira a cabeça', d: 'Convença o Sorrisinho a tirar a fantasia.' },
  cure:       { t: 'Cientista de shopping', d: 'Cure alguém com o soro.' },
  archivist:  { t: 'Arquivista', d: 'Encontre 6 documentos numa única partida.' },
  historian:  { t: 'Historiador', d: 'Encontre todos os documentos (em qualquer partida).' },
  nobody:     { t: 'Ninguém fica pra trás', d: 'Seja resgatado sem que ninguém do grupo tenha morrido.' },
  helicopter: { t: 'Telhado limpo', d: 'Seja resgatado pelo helicóptero.' },
  road:       { t: 'Pé na tábua', d: 'Fuja no Fiat do Lacerda.' },
  vents:      { t: 'Rato de duto', d: 'Fuja pelos dutos de ventilação.' },
  slogan:     { t: 'Obediente', d: 'Beba a Serenitá.' },
  collector:  { t: 'Colecionador de finais', d: 'Veja todos os finais.' },
};

/* ---------------- expedições ---------------- */
const DESTS = {
  super: { name: 'Supermercado Bom Preço', nights: 1, risk: 2, loot: ['comida', 'agua', 'agua', 'agua', 'comida'], notes: ['cupom'], inf: .14, hurt: .14, lost: .03,
    flavor: ['As prateleiras estão reviradas. Alguém deixou um carrinho cheio no corredor 4.', 'Um Calmo estava arrumando as latas por cor. Muito concentrado.', 'O freezer de sorvete ainda funciona. Ninguém sabe por quê.'] },
  farm: { name: 'Drogaria Vida+', nights: 1, risk: 2, loot: ['remedio', 'remedio', 'mascara', 'kit', 'agua'], special: ['termometro'], notes: ['email', 'helena'], inf: .18, hurt: .12, lost: .04,
    flavor: ['O balcão de manipulação está intacto. Cheira a hortelã e medo.', 'Alguém abriu todos os frascos de calmante. Ironia.', 'A balança de farmácia ainda imprime o peso. Você pesa menos.'] },
  ferr: { name: 'Ferragens do Zé', nights: 1, risk: 2, loot: ['tabuas', 'tabuas', 'pilhas', 'tabuas', 'agua'], special: ['marreta'], notes: ['neide'], inf: .1, hurt: .22, lost: .03,
    flavor: ['As serras estão penduradas como troféus. Melhor não mexer.', 'O Zé deixou um bilhete: "fiado só amanhã". Faz sentido agora.'] },
  elet: { name: 'Eletro Mega', nights: 1, risk: 2, loot: ['pilhas', 'pilhas', 'pilhas', 'agua'], special: ['radio', 'lanterna', 'videogame'], notes: ['militar'], inf: .16, hurt: .12, lost: .05,
    flavor: ['Trinta TVs ligadas no mesmo canal: uma propaganda da Serenitá em loop.', 'Um Calmo estava sentado vendo a vitrine de TVs. Sorrindo.'] },
  moda: { name: 'Moda Fashion', nights: 1, risk: 1, loot: ['cobertor', 'mascara', 'cobertor', 'agua'], notes: ['neide'], inf: .08, hurt: .06, lost: .02,
    flavor: ['Os manequins estão em posições diferentes. Você tem certeza disso.', 'Provador 3 trancado por dentro. Ninguém responde.'] },
  brinq: { name: 'Brinquedolândia', nights: 1, risk: 2, loot: ['comida', 'pilhas', 'comida', 'agua'], special: ['videogame'], notes: ['diario', 'desenho'], inf: .2, hurt: .1, lost: .05,
    flavor: ['Uma cabeça do Sorrisinho está no chão, sorrindo para o teto.', 'Um ursinho de pelúcia toca "você é meu amigo" quando pisam nele. Toda vez.'] },
  praca: { name: 'Praça de Alimentação', nights: 1, risk: 3, loot: ['comida', 'comida', 'agua', 'agua', 'agua', 'comida'], bonus: 1, notes: ['memo', 'relatorio', 'formula', 'helena', 'cupom'], inf: .3, hurt: .22, lost: .08,
    flavor: ['O quiosque da Serenitá ainda tem fila. Ninguém está se mexendo.', 'O cheiro de fritura velha esconde outro cheiro. Doce. Pudim.'] },
  controle: { name: 'Sala de Controle', nights: 2, risk: 3, loot: ['pilhas', 'comida', 'agua', 'agua'], notes: ['bilhete', 'lacerda', 'formula', 'militar'], inf: .22, hurt: .2, lost: .08,
    req: () => G.flags.mapa, reqText: 'Precisa do mapa da manutenção.',
    flavor: ['Vinte monitores mostram o shopping inteiro. Em quase todos, alguém sorri para a câmera.', 'A cadeira do Lacerda gira devagar. Vazia. Ainda quente.'] },
  estac: { name: 'Estacionamento G2', nights: 2, risk: 2, loot: ['agua', 'comida'], notes: ['militar'], inf: .15, hurt: .15, lost: .06,
    req: () => G.inv.chaves > 0, reqText: 'Precisa da chave do Fiat.',
    flavor: ['Os carros estão com alarmes disparando há dias. Ninguém liga.', 'Um Calmo está sentado no banco do motorista de um sedan. Esperando o sinal abrir.'] },
};

/* ---------------- eventos ----------------
   text(c) → texto; choices: {l, c(c) → bool (requisito), req (texto), f(c) → resultado}
   helpers vêm de shelter.js: home, others, P, pickOther, pickAny, hurt, injure, sicken,
   infect, addStress, stressAll, has, give, take, addFact, addNote, queueVisitor, quarantine
------------------------------------------ */
const EVENTS = [
  /* ===== HISTÓRIA (dias fixos) ===== */
  { id: 'entregador', story: 2,
    text: () => 'Batidas fracas vêm de DENTRO da câmara fria, que está trancada com um cadeado velho desde que vocês chegaram. Uma voz abafada: "Oi... entrega... pra assinar..." Alguém está preso lá desde ontem.',
    choices: [
      { l: 'Arrebentar o cadeado', f: () => {
        G.flags.freezer = true; addNote('entrega'); stressAll(8);
        addFact('frio', 'O FRIO REVELA A CALMA: o entregador passou uma noite na câmara fria e saiu com todos os sintomas. Dá pra usar a câmara fria para testar suspeitos (2 noites).');
        return 'Sai de lá um entregador de aplicativo, roxo de frio, segurando um comprovante. Ele olha pra vocês e abre um sorriso enorme. "Tava tão bom lá dentro." Febre, olhos leitosos, os braços se abrindo devagar. Vocês o empurram pra fora e trancam a porta. Ontem ele parecia normal. Uma noite no frio e A Calma apareceu inteira. A câmara fria agora é uma ferramenta: quem entra, se revela.';
      } },
      { l: 'Não abrir de jeito nenhum', f: () => {
        G.flags.freezer = true; addNote('entrega'); stressAll(14);
        addFact('frio', 'O FRIO REVELA A CALMA: quem passa a noite na câmara fria mostra todos os sintomas. Dá pra usar a câmara fria para testar suspeitos (2 noites).');
        return 'As batidas param. Às 4h, o cadeado velho cede sozinho. O entregador sai, cantarolando, passa por cima de todo mundo e vai até a porta de aço, onde fica parado, sorrindo, até amanhecer. Vocês o empurram pra fora. Ele deixou cair um comprovante (Arquivo). Lição aprendida: uma noite no frio faz A Calma se revelar.';
      } },
    ] },
  { id: 'lacerda1', story: 3,
    text: () => 'Os alto-falantes estalam. Uma voz cansada: "Aqui é Lacerda, gerente-geral do LockShop Center. Estou trancado na sala de controle. Tenho comida, mas as pilhas acabaram. Se alguém mandar duas pelo duto de ventilação, eu passo o mapa da manutenção. É o único caminho até a sala de controle e o estacionamento."',
    choices: [
      { l: 'Mandar 2 pilhas pelo duto', c: () => has('pilhas', 2), req: '2 pilhas', f: () => { take('pilhas', 2); G.flags.mapa = true; return 'Minutos depois, um mapa dobrado escorrega pelo duto, com um post-it: "Obrigado. Mantenham a calma. Mas não tanto." Nova expedição liberada: Sala de Controle.'; } },
      { l: 'Perguntar o que está acontecendo', f: () => { G.flags.lacerdaWaiting = true; stressAll(4); return 'Lacerda suspira: "Foi a Serenitá. A bebida do quiosque da praça. Cinco mil amostras grátis. A diretoria adorou a ideia." O pedido das pilhas continua de pé (aba Base).'; } },
      { l: 'Fingir que não ouviu', f: () => { G.flags.lacerdaWaiting = true; return 'Lacerda repete o pedido a cada hora. Educadamente. Dá pra mandar depois, pela aba Base.'; } },
    ] },
  { id: 'apagao', story: 7,
    text: () => 'O gerador do subsolo morreu. Escuridão total. No escuro, alguém começa a cantarolar, e ninguém sabe quem.',
    choices: [
      { l: 'Montar a luz de emergência', c: () => has('pilhas', 2), req: '2 pilhas', f: () => { take('pilhas', 2); return 'Luz de volta. Todo mundo se olhou. Ninguém admitiu ter cantarolado.'; } },
      { l: 'Mexer no quadro de força', f: () => { const m = pickOther() || P(); if (chance(.45)) { injure(m); return `${m.name} tomou um choque daqueles, mas a luz voltou.`; } return `${m.name} apertou um botão aleatório e a luz voltou. Engenharia.`; } },
      { l: 'Ficar no escuro', f: () => { stressAll(15); G.flags.dark = 2; return 'O cantarolar parou às 4h. Ninguém dormiu. A escuridão deixa a porta mais vulnerável por duas noites.'; } },
    ] },
  { id: 'evac', story: 8,
    text: () => has('radio') ? 'O rádio chia sozinho: "...Operação Telhado Limpo. Helicópteros resgatam sobreviventes nos shoppings da região. Façam contato na frequência sete-um-cinco-zero."' : 'Uma voz abafada atravessa o duto, vinda de algum vizinho com rádio: "...Operação Telhado Limpo... resgate pelos telhados... frequência sete-um-cinco-zero..." Vocês não têm rádio. Ainda.',
    choices: [
      { l: 'Anotar a frequência', f: () => { G.flags.evac = true; addFact('evac', 'Resgate: Operação Telhado Limpo, frequência 7150. Precisa de um rádio.'); return 'Anotado com caneta na parede, em letras enormes. A chance de contato pelo rádio aumentou.'; } },
    ] },
  { id: 'lacerda2', story: 10,
    text: () => 'Os alto-falantes voltam. É o Lacerda, mas a voz está leve: "Pessoal! Estou me sentindo ÓTIMO. Vou abrir todas as portas de segurança. Todo mundo merece um abraço."',
    choices: [
      { l: 'Reforçar a porta com tudo', c: () => has('tabuas', 2), req: '2 tábuas', f: () => { take('tabuas', 2); G.barricade = Math.min(5, G.barricade + 2); return 'Vocês pregaram tudo o que tinham. Às 2h, a trava da porta estalou sozinha. A barricada segurou.'; } },
      { l: 'Empurrar as estantes contra a porta', f: () => { G.barricade = Math.min(5, G.barricade + 1); const m = pickAny(); if (chance(.35)) { injure(m); return `As estantes estão na porta. ${m.name} machucou as costas.`; } return 'As estantes estão na porta. O estoque está no chão. Prioridades.'; } },
      { l: 'Torcer para ser blefe', f: () => { G.flags.doorsOpen = 1; return 'Não era blefe. Esta noite a porta vai ser testada.'; } },
    ] },
  { id: 'gangue', story: 12,
    text: () => 'A Gangue do 2º Andar está de volta, agora com tacos de golfe da loja de esportes: "Metade da comida. Ou a gente entra."',
    choices: [
      { l: 'Pagar metade', c: () => G.inv.comida > 0, req: 'ter comida', f: () => { const n = Math.ceil(G.inv.comida / 2); take('comida', n); stressAll(6); return `Vocês passaram ${n} latas pela fresta. "Prazer fazer negócio."`; } },
      { l: 'Partir pra cima', c: () => has('marreta') || others().some(m => m.trait === 'forte') || G.proto === 'jo', req: 'marreta ou alguém forte', f: () => { if (chance(.7)) { stressAll(-8); G.flags.gangDone = true; return 'Foi rápido. Eles fugiram deixando dois tacos e um saco de pão de queijo. +2 comida.' + (give('comida', 2), ''); } const m = pickAny(); injure(m); return `Eles recuaram, mas ${m.name} levou uma tacada.`; } },
      { l: 'Negociar no papo', c: () => others().some(m => m.trait === 'piadista') || G.proto === 'dani', req: 'alguém com lábia', f: () => { take('comida', 1); give('pilhas', 1); return 'Meia hora de conversa e eles saíram rindo, levando uma lata e deixando uma pilha. "Vocês são gente boa."'; } },
      { l: 'Recusar', f: () => { if (G.barricade >= 2) { G.barricade -= 2; return 'Eles bateram na porta até cansar. A barricada perdeu duas tábuas, mas ficou de pé.'; } G.barricade = 0; const m = pickAny(); injure(m); take('comida', 2); stressAll(12); return `Eles arrombaram a fresta, levaram comida e deixaram ${m.name} com um galo na cabeça.`; } },
    ] },
  { id: 'ultimato', story: 15,
    text: () => 'Comunicado em todos os alto-falantes, rádios e até no micro-ondas: "A Operação Telhado Limpo termina no DIA 18. Depois disso, o LockShop Center será lacrado com concreto. Agradecemos a compreensão."',
    choices: [
      { l: 'Respirar fundo (não muito)', f: () => { G.flags.ultimato = true; addFact('ultimato', 'Prazo final: dia 18. Depois, concreto.'); stressAll(10); return 'Faltam três dias. Rádio, carro ou milagre.'; } },
    ] },

  /* ===== ALEATÓRIOS ===== */
  { id: 'musica', text: () => 'Os alto-falantes do shopping voltaram sozinhos. Tocam "Garota de Ipanema" na flauta doce, em loop, há seis horas.',
    choices: [
      { l: 'Mandar alguém arrancar o fio', f: () => { const m = pickOther() || P(); if (chance(.35)) { injure(m); stressAll(-8); return `${m.name} arrancou o fio e levou um choque. Mas o silêncio... o silêncio é lindo.`; } stressAll(-12); return `${m.name} arrancou o fio. O grupo aplaudiu de pé.`; } },
      { l: 'Aprender a gostar', f: () => { if (chance(.5)) { stressAll(-6); return 'Alguém começou a dançar. Depois todo mundo. Vocês estão perdendo a sanidade, mas juntos.'; } stressAll(8); return 'Na sétima hora, alguém chorou. Na oitava, foi você.'; } },
    ] },
  { id: 'ventilacao', text: () => 'Um cheiro doce e enjoativo sai da ventilação. Lembra pudim. Pudim estragado.',
    choices: [
      { l: 'Tapar a grade com tábuas', c: () => has('tabuas'), req: '1 tábua', f: () => { take('tabuas', 1); return 'Vocês pregaram a grade. O cheiro parou. O pudim lá fora, não.'; } },
      { l: 'Usar máscaras', c: () => has('mascara'), req: '1 máscara', f: () => { take('mascara', 1); return 'Todo mundo dormiu de máscara. Pareciam um consultório. Funcionou.'; } },
      { l: 'Ignorar', f: () => { if (chance(.4)) { infect(pickAny()); return 'O cheiro passou. Todo mundo dormiu muito, muito bem.'; } return 'O cheiro passou. Era só pudim mesmo, aparentemente.'; } },
    ] },
  { id: 'pedagio', min: 2, max: 11, text: () => 'Um grupo do 2º andar bate na porta: "Pedágio. Duas latas, ou a gente volta mais tarde. Com amigos."',
    choices: [
      { l: 'Pagar', c: () => has('comida', 2), req: '2 comidas', f: () => { take('comida', 2); stressAll(3); return 'Eles pegaram as latas e agradeceram. Educados, para extorsionários.'; } },
      { l: 'Mostrar a marreta', c: () => has('marreta'), req: 'marreta', f: () => { stressAll(-5); return 'Eles olharam a marreta, olharam pra vocês e descobriram que eram pacifistas.'; } },
      { l: 'Recusar', f: () => { if (G.barricade > 0) { G.barricade--; return 'Eles voltaram de madrugada e chutaram a porta. A barricada perdeu uma tábua.'; } take('comida', 2); const m = pickAny(); injure(m); return `Sem barricada, eles forçaram a fresta, levaram 2 latas e machucaram ${m.name}.`; } },
    ] },
  { id: 'rato', cond: () => G.inv.comida > 0, text: () => G.flags.rato ? 'O Gerente voltou. O rato. Agora com dois amigos.' : 'Tem um rato na despensa. Grande. Ele te olha como se o intruso fosse você.',
    choices: [
      { l: 'Soltar o Caramelo', c: () => !!G.dog, req: 'cachorro', f: () => { stressAll(-8); return 'O Caramelo resolveu em quatro segundos. Herói nacional.'; } },
      { l: 'Caçar o rato', f: () => { if (chance(.5)) return 'Vocês pegaram o rato. Ninguém quer falar sobre o que veio depois.'; take('comida', 1); return 'O rato venceu. Levou uma lata. Como? Ninguém sabe.'; } },
      { l: 'Batizar o rato de "Gerente"', f: () => { take('comida', 1); G.flags.rato = true; stressAll(-4); return 'O Gerente agora tem nome e come uma lata por visita. Sindicalizado.'; } },
    ] },
  { id: 'casamento', cond: () => others().length >= 2,
    text: c => { const [a, b] = shuffle(others()); c.a = a; c.b = b; return `${a.name} pediu ${b.name} em casamento com um anel feito do lacre de uma lata de sardinha.`; },
    choices: [
      { l: 'Fazer uma festa', c: () => has('comida'), req: '1 comida', f: () => { take('comida', 1); stressAll(-18); return 'Teve até bolo. Era de sardinha, mas era bolo.'; } },
      { l: '"Gente, não é hora"', f: c => { addStress(c.a, 12); addStress(c.b, 12); return `${c.b.name} disse "sim" mesmo assim. Em silêncio. Com ressentimento.`; } },
    ] },
  { id: 'teto', text: () => 'Passos no forro do teto. Lentos. Param exatamente em cima de vocês.',
    choices: [
      { l: 'Silêncio absoluto', f: () => { stressAll(6); return 'Depois de duas horas, os passos foram embora. Vocês não respiraram durante a maior parte delas.'; } },
      { l: 'Bater no teto de volta', f: () => { if (chance(.5)) { give('agua', 2); return 'Alguém lá em cima bateu de volta... e jogou duas garrafas d\'água pela grade. Solidariedade de forro.'; } if (G.barricade > 0) { G.barricade--; return 'Algo tentou descer pela grade. Vocês arrancaram tábuas da barricada pra segurar.'; } const m = pickAny(); injure(m); return `Algo desceu pela grade. Vocês expulsaram, mas ${m.name} se machucou.`; } },
    ] },
  { id: 'anuncio', cond: () => others().length > 0 && !G.flags.enzo,
    text: () => 'Os alto-falantes chiam: "Atenção, cliente Valéria: seu filho Enzo aguarda no balcão de informações."',
    choices: [
      { l: 'Mandar alguém até o balcão', f: () => { const m = pickOther(); G.flags.enzo = true; const r = Math.random(); if (r < .5) { queueVisitor('enzo', `${m.name} achou o menino escondido embaixo do balcão e mandou esperar na porta.`); return `${m.name} voltou dizendo que achou o menino. Ele vai bater na porta amanhã.`; } if (r < .75) { injure(m); return `${m.name} voltou mancando. "Não tinha criança nenhuma. Tinha... outra coisa."`; } addStress(m, 15); return `${m.name} voltou sem cor no rosto. "Não tinha ninguém. Só o microfone ligado. E uma risadinha."`; } },
      { l: 'Não é problema nosso', f: () => { stressAll(8); return 'O anúncio se repetiu a noite toda. Cada vez mais calmo.'; } },
    ] },
  { id: 'placa', cond: () => others().length > 0,
    text: () => 'Uma placa neon acendeu sozinha na Eletro Mega: "TUDO GRÁTIS — SÓ HOJE".',
    choices: [
      { l: 'Mandar alguém conferir', f: () => { const m = pickOther(); const r = Math.random(); if (r < .35) { const miss = ['radio', 'lanterna', 'videogame'].filter(k => !has(k)); if (miss.length) { give(miss[0], 1); return `${m.name} voltou com: ${ITEMS[miss[0]].n}! Era grátis mesmo. O capitalismo morreu.`; } give('pilhas', 2); return `${m.name} voltou com 2 pilhas. Grátis mesmo.`; } if (r < .7) { if (chance(.6)) infect(m); return `${m.name} voltou correndo e sem nada. Diz que não tinha ninguém lá. Está suando.`; } return `Era marketing: ${m.name} só achou um panfleto do cartão da loja.`; } },
      { l: 'Óbvio que é armadilha', f: () => 'Vocês não foram. Às 2h, a placa mudou para: "VOCÊS SÃO TÃO DESCONFIADOS".' },
    ] },
  { id: 'espirro', text: () => 'Metade do grupo acordou espirrando e com o nariz escorrendo.',
    choices: [
      { l: 'Distribuir remédio', c: () => has('remedio'), req: '1 remédio', f: () => { take('remedio', 1); return 'Resolvido. Era rinite. Provavelmente.'; } },
      { l: '"É só rinite"', f: () => { const m = pickAny(); sicken(m); return `Era rinite. Mas ${m.name} piorou e ficou de cama.`; } },
    ] },
  { id: 'celular', text: () => 'Alguém achou um celular com 3% de bateria embaixo de uma prateleira.',
    choices: [
      { l: 'Ligar para a família', f: () => { stressAll(-15); return 'Ninguém atendeu, mas ouvir a voz da caixa postal foi o melhor som em dias.'; } },
      { l: 'Ler as notícias', f: () => { addFact('noticia', 'Notícia: infectados ficam calmos e simpáticos. Febre e pupilas paradas são sinais.'); stressAll(4); return 'Manchete: "INFECTADOS FICAM CALMOS E SIMPÁTICOS ANTES DA FASE FINAL. FEBRE E PUPILAS PARADAS SÃO SINAIS." Embaixo, um anúncio de colchão.'; } },
      { l: 'Ligar pro 190', f: () => { if (!G.rescueDay && G.day >= 6 && chance(.25)) { G.rescueDay = Math.min(G.day + 4, 18); return `Alguém atendeu! "Helicóptero no telhado, DIA ${G.rescueDay}." Depois a bateria morreu.`; } return 'Musiquinha de espera até a bateria acabar. Pelo menos era Vivaldi.'; } },
    ] },
  { id: 'empurra', text: () => 'A porta de aço rangeu a noite toda. Algo do outro lado está empurrando. Com paciência.',
    choices: [
      { l: 'Reforçar a barricada', c: () => has('tabuas'), req: '1 tábua', f: () => { take('tabuas', 1); G.barricade = Math.min(5, G.barricade + 1); return 'Mais uma tábua. A porta parou de ranger. Por enquanto.'; } },
      { l: 'Todo mundo segura a porta', f: () => { const m = pickAny(); injure(m); stressAll(-5); return `Vocês seguraram juntos até amanhecer. ${m.name} machucou o ombro, mas o espírito de equipe subiu.`; } },
      { l: 'Torcer', f: () => { if (G.barricade > 0) { G.barricade--; return 'A barricada aguentou, mas perdeu uma tábua.'; } const m = pickAny(); hurt(m, 2); stressAll(10); return `Sem barricada, algo enfiou o braço pela fresta. ${m.name} se machucou feio.`; } },
    ] },
  { id: 'seguro', cond: () => G.inv.comida > 0, text: () => 'Um panfleto desliza por baixo da porta: "SEGURO APOCALIPSE — cobertura total contra mordidas, abraços e sorrisos. Aceitamos enlatados."',
    choices: [
      { l: 'Contratar', c: () => has('comida'), req: '1 comida', f: () => { take('comida', 1); stressAll(-3); return 'Um recibo deslizou por baixo da porta. Cláusula 47: "não cobre infecção, abraço ou sorriso".'; } },
      { l: 'Ignorar', f: () => 'O panfleto tinha cheiro de pudim.' },
    ] },
  { id: 'sonho', text: () => 'Todo mundo sonhou a mesma coisa: uma mulher sorrindo, dizendo "abre a porta, tá tão bom aqui fora".',
    choices: [
      { l: 'Conversar sobre isso', f: () => { stressAll(-5); return 'Falar ajudou. Um pouco.'; } },
      { l: 'Fingir que não foi nada', f: () => { stressAll(9); return 'Ninguém falou. Ninguém dormiu.'; } },
    ] },
  { id: 'caixa', text: () => 'Vocês acharam uma caixa lacrada: "NÃO ABRIR — RH".',
    choices: [
      { l: 'Abrir', f: () => { const r = Math.random(); if (r < .35) { give('comida', 2); give('agua', 1); return 'Era o estoque secreto do café da integração! +2 comida, +1 água.'; } if (r < .65) { give('remedio', 2); return 'Kit de primeiros socorros do RH. +2 remédios.'; } stressAll(6); return 'Eram avaliações de desempenho. A sua dizia: "não demonstra proatividade em crises".'; } },
      { l: 'Respeitar o RH', f: () => 'Algumas regras sobrevivem até ao apocalipse.' },
    ] },
  { id: 'karaoke', text: () => 'O karaokê de demonstração da Eletro Mega ligou sozinho. Dá pra ouvir daqui: "Evidências", no volume máximo.',
    choices: [
      { l: 'Cantar junto', f: () => { stressAll(-16); if (chance(.35)) { if (G.barricade > 0) G.barricade--; return 'Foi catártico. Também atraiu visitantes. A barricada sofreu.'; } return 'Foi catártico. Ninguém lá fora pareceu se importar.'; } },
      { l: 'Tapar os ouvidos', f: () => { stressAll(4); return 'O refrão entrou pelos dedos mesmo assim.'; } },
    ] },
  { id: 'prova', min: 4, cond: () => others().length >= 2, text: () => 'O grupo está desconfiado. De VOCÊ. "Prova que não tá infectado."',
    choices: [
      { l: 'Medir a febre na frente de todos', c: () => has('termometro'), req: 'termômetro', f: () => { const p = P(); if (p.infected && p.stage >= 2) { stressAll(20); return 'O termômetro marcou 38,6. Silêncio. Você sorriu, e isso piorou tudo.'; } stressAll(-10); return '36,5. O grupo pediu desculpas. Mais ou menos.'; } },
      { l: 'Fazer um discurso emocionado', f: () => { if (chance(.5)) { stressAll(-8); return 'Teve lágrima. Teve abraço (curto, por precaução).'; } stressAll(6); return 'O discurso foi lindo. Calmo demais, segundo alguns.'; } },
      { l: 'Ficar ofendido', f: () => { stressAll(10); return '"Quem fica tão calmo assim?", alguém sussurrou.'; } },
    ] },
  { id: 'rosnado', cond: () => !!G.dog && others().length > 0,
    text: c => { const inf = others().filter(m => m.infected); c.m = inf.length && chance(.7) ? pick(inf) : pick(others()); return `O Caramelo passou a noite rosnando para a porta. Depois para a parede. Depois para ${c.m.name}.`; },
    choices: [
      { l: 'Acalmar o cachorro', f: () => 'Ele parou de rosnar. Mas continua olhando.' },
      { l: c => `Mandar ${c.m.name} pra câmara fria`, c: () => !!G.flags.freezer, req: 'câmara fria destrancada', f: c => { quarantine(c.m); addStress(c.m, 15); return `${c.m.name} foi para a câmara fria${c.m.blanket ? ' com um cobertor' : ''}. O Caramelo abanou o rabo.`; } },
    ] },
  { id: 'aniversario', cond: () => others().length > 0,
    text: c => { c.m = pick(others()); return `Hoje é aniversário de ${c.m.name}. Ninguém tinha percebido até a pessoa avisar. Três vezes.`; },
    choices: [
      { l: 'Improvisar uma festa', c: () => has('comida'), req: '1 comida', f: c => { take('comida', 1); stressAll(-15); return `Vela de fósforo em cima de uma lata de milho. ${c.m.name} chorou.`; } },
      { l: 'Parabéns verbal', f: c => { addStress(c.m, 10); return 'Um "parabéns" coletivo, sem empolgação. É o que tem pra hoje.'; } },
    ] },
  { id: 'briga', cond: () => others().length >= 2,
    text: c => { const [a, b] = shuffle(others()); c.a = a; c.b = b; return `${a.name} acusa ${b.name} de comer a ração escondido. A gritaria acordou até o rato.`; },
    choices: [
      { l: c => `Ficar do lado de ${c.a.name}`, f: c => { addStress(c.b, 20); addStress(c.a, -10); return `${c.b.name} passou o dia emburrado no canto, olhando pra você.`; } },
      { l: c => `Ficar do lado de ${c.b.name}`, f: c => { addStress(c.a, 20); addStress(c.b, -10); return `${c.a.name} anotou seu nome num caderninho. Você viu.`; } },
      { l: 'Dividir uma lata extra entre os dois', c: () => has('comida'), req: '1 comida', f: c => { take('comida', 1); addStress(c.a, -10); addStress(c.b, -10); return 'Paz comprada com milho. Como na história do Brasil.'; } },
    ] },
  { id: 'crise', cond: () => others().some(m => m.stress >= 50),
    text: c => { c.m = others().sort((a, b) => b.stress - a.stress)[0]; return `${c.m.name} teve uma crise de pânico. Está encolhido num canto, repetindo "a gente vai morrer aqui".`; },
    choices: [
      { l: 'Sentar e conversar', f: c => { addStress(c.m, -25); return `Vocês conversaram até de madrugada. ${c.m.name} dormiu primeiro, de mão dada com você.`; } },
      { l: 'Dar o videogame', c: () => has('videogame'), req: 'videogame', f: c => { addStress(c.m, -30); return `${c.m.name} fez 12 mil pontos e esqueceu o apocalipse por três horas.`; } },
      { l: '"Respira e engole o choro"', f: c => { addStress(c.m, 15); stressAll(4); return 'Não funcionou. Nunca funciona.'; } },
    ] },
  { id: 'batom', min: 3, text: () => 'Vocês acordaram com algo escrito na parede, em batom vermelho: "ELES JÁ ESTÃO AQUI DENTRO". Ninguém sabe quem escreveu.',
    choices: [
      { l: 'Interrogar todo mundo', f: () => { const sus = others().filter(m => m.infected); stressAll(10); if (sus.length && chance(.5)) { const s = pick(sus); return `Ninguém confessou. Mas ${s.name} tinha batom na manga. E sorria.`; } return 'Ninguém confessou. Todo mundo dormiu de olho aberto.'; } },
      { l: 'Apagar e não comentar', f: () => { stressAll(5); return 'A mancha ficou. Ninguém comenta. Todo mundo olha.'; } },
    ] },
  { id: 'goteira', text: () => 'Um cano estourou no teto e está pingando água limpa. Ou quase limpa.',
    choices: [
      { l: 'Encher garrafas', f: () => { give('agua', 3); if (chance(.2)) { const m = pickAny(); infect(m); return '+3 água. Tinha um gostinho estranho. Doce.'; } return '+3 água. Gosto de cano, mas é água.'; } },
      { l: 'Ferver antes (gasta pilhas no aquecedor)', c: () => has('pilhas'), req: '1 pilha', f: () => { take('pilhas', 1); give('agua', 3); return '+3 água, fervida e segura.'; } },
      { l: 'Não arriscar', f: () => 'O cano pingou a noite toda. Tortura chinesa, versão shopping.' },
    ] },
  { id: 'drone', text: () => 'Um drone de entrega perdido bateu na grade da ventilação. Está com uma sacola presa e a tela piscando: "PEDIDO ATRASADO — AVALIE-NOS".',
    choices: [
      { l: 'Pegar a sacola', f: () => { give('comida', 2); stressAll(-6); return 'Dois lanches frios e um refrigerante. Melhor refeição em dias. Vocês deram 5 estrelas.'; } },
      { l: 'Avaliar com 1 estrela', f: () => { stressAll(-10); return 'O drone foi embora ofendido. Vocês riram por meia hora.'; } },
    ] },
  { id: 'manequim', text: () => 'Tem um manequim parado do lado de fora da porta, visível pela fresta. Ontem ele não estava lá. Hoje ele está... mais perto?',
    choices: [
      { l: 'Cutucar com uma vassoura', f: () => { if (chance(.3)) { const m = pickAny(); injure(m); return `Não era manequim. ${m.name} levou um susto e um arranhão.`; } return 'Era só um manequim. Usando uma camiseta da Serenitá.'; } },
      { l: 'Não olhar mais pela fresta', f: () => { stressAll(5); return 'Todo mundo olhou pela fresta escondido mesmo assim.'; } },
    ] },
  { id: 'sorteio', min: 5, text: () => 'Os alto-falantes anunciam: "Sorteio da Liquidação Final! O cupom 000047 ganhou um vale-compras!" Vocês têm o cupom 000047.',
    choices: [
      { l: 'Mandar alguém buscar o prêmio', c: () => others().length > 0, req: 'alguém', f: () => { const m = pickOther(); if (chance(.5)) { give('comida', 3); return `${m.name} trouxe o prêmio: uma cesta de Natal. Em novembro.`; } infect(m); return `${m.name} voltou dizendo que "o pessoal do balcão é muito gente boa".`; } },
      { l: 'Rasgar o cupom', f: () => { stressAll(-3); return 'O alto-falante repetiu o número a noite inteira.'; } },
    ] },
];

/* visitantes especiais em dias fixos */
const STORY_VISITORS = { 5: 'wagner', 6: 'helena' };
/* fatos que se tornam conhecidos em certos dias (relatório da manhã) */
const STORY_FACTS = {
  4: ['praca', 'Gritos e depois silêncio vindos da praça de alimentação. Pela fresta, só sorrisos. A praça caiu.'],
  6: ['brinquedos', 'Música de parque infantil tocando na Brinquedolândia a noite toda. Ninguém lá dentro chora mais.'],
  10: ['controle', null],
};
const MAXDAY = 18;

/* =========================================================
   v8 — mais conteúdo: dificuldades, itens, personagens,
   história, eventos de comédia e terror, finais
   ========================================================= */
const DIFFS = {
  facil:    { n: 'Tranquilo', d: '4 minutos de saque, Calmos lerdos, menos infectados e menos invasões. Pra curtir a história.', run: 240, calmoSpd: .82, spawnK: .7, inf: .7, attack: .6, thirstAt: 4, hungerAt: 5, startBar: 2, pool: .3 },
  normal:   { n: 'Normal', d: '3 minutos de saque. Riscos equilibrados. A experiência pretendida.', run: 180, calmoSpd: 1, spawnK: 1, inf: 1, attack: 1, thirstAt: 3, hungerAt: 4, startBar: 1, pool: .4 },
  dificil:  { n: 'Pânico', d: '2min30 de saque, Calmos rápidos, mais infectados. A fome bate mais cedo.', run: 150, calmoSpd: 1.14, spawnK: 1.3, inf: 1.3, attack: 1.35, thirstAt: 3, hungerAt: 3, startBar: 0, pool: .5 },
  pesadelo: { n: 'Pesadelo', d: '2 minutos. Calmos em todo canto. A sede bate em 2 dias. Ninguém é confiável. Nem você.', run: 120, calmoSpd: 1.28, spawnK: 1.6, inf: 1.6, attack: 1.7, thirstAt: 2, hungerAt: 3, startBar: 0, pool: .6 },
};
const MODES = {
  classico: { n: 'Clássico', d: 'Saque de tempo limitado no shopping, depois sobrevivência no depósito.' },
  deposito: { n: 'Direto pro Depósito', d: 'Sem saque: você acorda no depósito com itens e pessoas aleatórias. Só a sobrevivência.' },
};

Object.assign(ITEMS, {
  extintor: { n: 'Extintor', short: 'Extintor', w: 2, u: 1, desc: 'Espuma na cara de quem entrar. Salva vocês de uma invasão ou de uma transformação. Uso único.' },
  cafe:     { n: 'Café solúvel', short: 'Café', w: 1, pick: 2, desc: 'Uma dose reduz muito o estresse de uma pessoa. Brasileiro sem café vira Calmo mais rápido.' },
  baralho:  { n: 'Baralho', short: 'Baralho', w: 1, u: 1, desc: 'Truco valendo ração. Uma rodada por dia acalma o grupo.' },
  walkie:   { n: 'Walkie-talkie', short: 'Walkie', w: 1, u: 1, desc: 'Leve na expedição: quem sai pode pedir ajuda. Menos sumiços e ferimentos.' },
  fita:     { n: 'Fita silver tape', short: 'Fita', w: 1, pick: 2, desc: 'Conserta tudo. Inclusive a barricada (+1).' },
});
INV_ORDER.push('cafe', 'fita', 'extintor', 'baralho', 'walkie');

Object.assign(TRAITS, {
  sortudo:   { n: 'Sortudo', d: 'Expedições trazem um item a mais e acham documentos com mais frequência.' },
  motorista: { n: 'Motorista', d: 'Na fuga de carro, cabem 7 em vez de 5. Ninguém sabe como.' },
  vigia:     { n: 'Vigia insone', d: 'Não dorme. Avisa quando alguém começa a virar, e o grupo reage a tempo.' },
});

Object.assign(CHARACTERS, {
  cida: { name: 'Dona Cida', trait: 'sortudo', offer: { cafe: 2 },
    look: { skin: SKIN[2], hair: '#d9d9d9', hs: 'curly', shirt: '#e17055', pants: '#2d3436', shoes: '#6d4c41', acc: ['glasses', 'earring'], body: 'old', seed: 41 },
    bio: 'Dona da lotérica. Vendeu o prêmio da Mega da Virada de 2009 e nunca deixou ninguém esquecer.',
    intro: 'Abre, meu filho. Eu dou sorte. Em 2009 eu vendi a Mega da Virada, sabia?',
    why: 'Eu dou sorte. Pergunta pra qualquer um da lotérica. Bom, pergunta pra quem sobrou.' },
  paulao: { name: 'Paulão', trait: 'motorista', offer: { fita: 2 },
    look: { skin: SKIN[3], hair: '#1b1b1b', hs: 'buzz', shirt: '#2d3436', pants: '#2d3436', shoes: '#111', acc: ['vest', 'cap'], capColor: '#e67e22', body: 'big', seed: 42 },
    bio: 'Manobrista do estacionamento G2. Sabe onde cada carro está. E onde estão as chaves.',
    intro: 'Sou o manobrista. Se vocês quiserem sair daqui de carro, eu sou o cara.',
    why: 'Coloco sete pessoas num Uno. Já fiz isso em formatura.' },
  yuki: { name: 'Yuki', trait: 'vigia', offer: { pilhas: 2 },
    look: { skin: SKIN[0], hair: '#141414', hs: 'pony', shirt: '#6c5ce7', pants: '#2d3436', shoes: '#fff', acc: ['headset'], seed: 43 },
    bio: 'Funcionária da loja de games. Não dorme há três dias. Diz que isso é normal no ramo.',
    intro: 'Eu não durmo desde quinta. Mas isso é normal, sério. Deixa eu entrar que eu fico de vigia.',
    why: 'Eu não durmo. Literalmente. Vocês dormem, eu vigio a porta.' },
  gloria: { name: 'Irmã Glória', trait: 'zen', offer: { baralho: 1 },
    look: { skin: SKIN[1], hair: '#222', hs: 'none', shirt: '#2c2c34', pants: '#2c2c34', shoes: '#111', acc: ['veil'], seed: 44 },
    bio: 'Freira. Veio ao shopping comprar velas. Joga truco melhor que qualquer um.',
    intro: 'Paz e bem, meus filhos. Vim comprar velas e olha a situação. Deus tem senso de humor.',
    why: 'Eu rezo, cozinho e roubo no truco. Nessa ordem.' },
  juninho: { name: 'Juninho', trait: 'cozinheiro', offer: { comida: 2 },
    look: { skin: SKIN[2], hair: '#5d3a1a', hs: 'short', shirt: '#fdcb6e', pants: '#6d4c41', shoes: '#d63031', acc: ['apron', 'cap'], apron: '#fff', capColor: '#d63031', seed: 45 },
    bio: 'Atendente do quiosque de churros. 19 anos. Primeiro emprego. Último, talvez.',
    intro: 'Sobrou churros! Tá frio, mas é de doce de leite. Me deixa entrar?',
    why: 'Eu faço churros com qualquer coisa. Qualquer coisa mesmo. Não perguntem.' },
  beatriz: { name: 'Dra. Beatriz', trait: 'medico', offer: { remedio: 1 },
    look: { skin: SKIN[4], hair: '#2b1a10', hs: 'curly', shirt: '#55efc4', pants: '#2d3436', shoes: '#fff', acc: ['labcoat'], seed: 46 },
    bio: 'Veterinária da Pet Mania. Para ela, vocês são mamíferos grandes e assustados.',
    intro: 'Sou veterinária. Pra mim vocês são mamíferos grandes. Dá pra trabalhar.',
    why: 'Já costurei um pastor-alemão bravo. Vocês são mais fáceis.' },
  valeria: { name: 'Valéria', trait: 'fofo', offer: { comida: 1 }, special: true,
    look: { skin: SKIN[1], hair: '#8b4513', hs: 'long', shirt: '#fd79a8', pants: '#2d3436', shoes: '#fff', acc: ['earring'], seed: 47 },
    bio: 'Mãe do Enzo. Tomou uma Serenitá na fila da praça. Faz dias que procura o filho pelo shopping.',
    intro: 'Vocês viram meu filho? Enzo. Oito anos. Ele estava comigo e de repente... eu fiquei tão calma.',
    why: 'Eu só quero abraçar meu filho. Bem forte. Por bastante tempo.' },
});
REGULARS.push('cida', 'paulao', 'yuki', 'gloria', 'juninho', 'beatriz');

Object.assign(NOTES, {
  ceo:  { t: 'Transcrição do pronunciamento do CEO', x: '"Aqui é o Dr. Abílio Sorriso, CEO do Grupo LockShop. Lamentamos o ocorrido. Na verdade, não lamentamos. Ninguém lamenta mais nada. Está tudo tão bem. Venham ao shopping. A Liquidação continua."' },
  zero: { t: 'Roteiro do comercial da Serenitá Zero', x: '"LOCUTOR: Serenitá Zero! Zero açúcar! Zero ansiedade! Zero vontade de sair de perto de você! (Letreiro, 0,4 segundo: pode causar tranquilidade permanente e abraços involuntários.)"' },
});
Object.assign(NOTE_HINTS, { ceo: 'Um pronunciamento no dia 5', zero: 'Um comercial no dia 9' });

Object.assign(ENDINGS, {
  live:    { t: 'Viralizou', h: 'Deixe o influencer fazer o que ele faz de melhor.' },
  gerente: { t: 'Gerente do mês', h: 'Chegue ao último dia forte demais para ser concretado.' },
  sozinho: { t: 'Último cliente', h: 'Seja resgatado sem ninguém ao seu lado.' },
});
Object.assign(ACHIEVEMENTS, {
  brave:   { t: 'Sangue frio', d: 'Escape no Pânico ou no Pesadelo.' },
  direto:  { t: 'Direto ao ponto', d: 'Termine uma partida no modo Direto pro Depósito.' },
  viral:   { t: 'Engajamento', d: 'Viralize com a live de socorro.' },
  manager: { t: 'Gerente do mês', d: 'Transforme o depósito numa fortaleza.' },
  lonely:  { t: 'Último cliente', d: 'Seja o único a sair do shopping.' },
  mother:  { t: 'Reencontro', d: 'Atenda a mãe do Enzo com o menino no grupo.' },
});

STORY_VISITORS[13] = 'valeria';

const CREEPY = [
  'Às 3h, alguém riu baixinho. Ninguém estava acordado.',
  'O alto-falante ligou sozinho por um segundo. Só respiração.',
  'De manhã, a poeira do chão tinha marcas de dedos. Por dentro.',
  'Alguém bateu na porta três vezes. Depois, do lado de dentro da câmara fria, outras três.',
  'O Caramelo... não, não tem cachorro nenhum. Mas alguém latiu.',
  'Uma música de ninar tocou no duto. Na voz da sua mãe.',
  'Às 4h04, todos os celulares mortos acenderam ao mesmo tempo. Tela branca. Depois, nada.',
  'Alguém sussurrou o nome de cada um de vocês pela fresta. Na ordem em que vocês chegaram.',
];
const FUNNY = [
  'O rato Gerente foi visto usando um crachá. Ninguém sabe de onde tirou.',
  'Alguém fez uma planilha de rodízio do banheiro. Tem até legenda por cor.',
  'Discussão acalorada sobre se biscoito ou bolacha. Ninguém morreu. Dessa vez.',
  'Encontraram um cupom de 10% de desconto. Válido até ontem.',
  'O grupo votou o "funcionário do mês" do depósito. Deu empate com o extintor.',
];

EVENTS.push(
  /* ===== HISTÓRIA ===== */
  { id: 'diretoria', story: 5,
    text: () => 'Pela fresta dá pra ver as TVs da vitrine da Eletro Mega. Todas mostram o mesmo homem de terno, sorrindo: "Aqui é o Dr. Abílio Sorriso, CEO do Grupo LockShop. Lamentamos o ocorrido. Na verdade, não lamentamos. Ninguém lamenta mais nada."',
    choices: [
      { l: 'Assistir até o fim', f: () => { addNote('ceo'); stressAll(6); return 'Ele termina convidando todo mundo para a Liquidação. Ao fundo, a diretoria inteira acena. Todos sorrindo. (Novo documento no Arquivo.)'; } },
      { l: 'Ligar pro SAC e reclamar', f: () => { addNote('ceo'); stressAll(-6); return 'Uma gravação: "Sua ligação é muito importante para nós. Tão importante. Fique na linha. Fique com a gente. Para sempre." Vocês riram de nervoso. (Novo documento.)'; } },
      { l: 'Tapar a fresta', f: () => 'Ainda dá pra ouvir o jingle. "LockShop: aqui você se sente em casa." Ironicamente, sim.' },
    ] },
  { id: 'bilhete_porta', story: 6,
    text: () => { const n = home().length; return `Um bilhete escorregou por baixo da porta, escrito com batom: "CONTAMOS VOCÊS: ${n}. AMANHÃ VAI SER ${n + 1}."`; },
    choices: [
      { l: 'Contar de novo, com cuidado', f: () => { stressAll(10); const sus = others().filter(m => m.infected); if (sus.length && chance(.5)) { suspect(sus[0], 'estava perto da porta quando o bilhete apareceu.'); return `Vocês contaram três vezes. Deu ${home().length}. Mas ${sus[0].name} estava estranhamente perto da porta quando o bilhete apareceu.`; } return `Vocês contaram três vezes. Deu ${home().length} todas as vezes. Ninguém dormiu.`; } },
      { l: 'Escrever uma resposta e devolver', f: () => { stressAll(-4); return 'Vocês escreveram "VAI SONHANDO" e passaram por baixo da porta. Às 4h, o bilhete voltou com um coraçãozinho desenhado.'; } },
    ] },
  { id: 'zero', story: 9,
    text: () => 'O rádio, os alto-falantes e até o micro-ondas tocam o mesmo comercial: "SERENITÁ ZERO! Zero açúcar! Zero ansiedade! Zero vontade de sair de perto de você!"',
    choices: [
      { l: 'Ouvir o letreiro final com atenção', f: () => { addNote('zero'); stressAll(4); return 'Em 0,4 segundo: "pode causar tranquilidade permanente e abraços involuntários". Anotado. (Novo documento.)'; } },
      { l: 'Cantar o jingle por cima, bem alto', f: () => { stressAll(-10); return 'Vocês cantaram uma paródia tão ofensiva que até o rato saiu da sala. Melhor noite em dias.'; } },
    ] },
  /* ===== COMÉDIA ===== */
  { id: 'reuniao', cond: () => others().length >= 2,
    text: c => { c.m = pick(others()); return `${c.m.name} convocou uma "reunião de condomínio do depósito". Tem pauta. Tem ata. Tem lista de presença.`; },
    choices: [
      { l: 'Eleger um síndico', f: c => { addStress(c.m, -20); stressAll(-5); return `${c.m.name} foi eleito por aclamação, principalmente porque ninguém mais queria. Primeira medida: proibido assobiar depois das 22h.`; } },
      { l: 'Propor que a reunião vire um e-mail', f: c => { addStress(c.m, 15); stressAll(-8); return 'Todo mundo aplaudiu. Menos o síndico em potencial, que chorou baixinho na câmara fria.'; } },
    ] },
  { id: 'coach', text: () => 'Uma voz animada sai do duto: "BOM DIA, CAMPEÕES! Isso não é um apocalipse, é um AMBIENTE DE CRESCIMENTO! Abram a porta da mente! E a do depósito!"',
    choices: [
      { l: 'Fazer o exercício de respiração dele', f: () => { if (chance(.5)) { stressAll(-12); return 'Funcionou, por incrível que pareça. Inspira, segura, expira... e não abre a porta.'; } stressAll(6); return 'No meio do exercício ele disse "agora sorriam bem largo". Vocês pararam.'; } },
      { l: 'Gritar "NÃO VOU COMPRAR SEU CURSO"', f: () => { stressAll(-6); return 'Silêncio. Depois, baixinho: "...tem parcelamento". Vocês riram até doer a barriga.'; } },
    ] },
  { id: 'amigo_secreto', cond: () => others().length >= 2 && G.inv.comida > 0,
    text: () => 'Alguém propôs um amigo secreto. Valor máximo: uma lata.',
    choices: [
      { l: 'Topar', c: () => has('comida'), req: '1 comida', f: () => { take('comida', 1); stressAll(-18); return 'O Bruno ganhou uma pilha usada. A Kelly, uma capinha. Alguém ganhou um bilhete escrito "você é especial". Ninguém admitiu ter escrito. Foi lindo.'; } },
      { l: 'Não é hora', f: () => { stressAll(4); return 'Alguém já tinha embrulhado o presente em papel higiênico. Dá pena.'; } },
    ] },
  { id: 'blackfriday', cond: () => others().length > 0,
    text: () => 'Pela fresta: os Calmos formaram uma fila organizada na frente da Eletro Mega. Alguém pendurou uma faixa: "BLACK FRIDAY". Eles estão esperando. Sorrindo. Educadamente.',
    choices: [
      { l: 'Mandar alguém furar a fila', f: () => { const m = pickOther(); if (chance(.5)) { give('pilhas', 3); give('fita', 2); return `${m.name} passou na frente de todo mundo, pegou pilhas e fita e voltou. Ninguém reclamou. Calmos não reclamam.`; } infect(m); return `${m.name} voltou com as mãos vazias. "Eles me deixaram passar na frente. Foram tão gentis." Hum.`; } },
      { l: 'Respeitar a fila', f: () => { stressAll(-3); return 'Às 6h, as portas da Eletro Mega não abriram. A fila continuou lá. Isso é Brasil, afinal.'; } },
    ] },
  { id: 'gerente_aumento', cond: () => !!G.flags.rato,
    text: () => 'O Gerente (o rato) voltou. Trouxe a esposa, três filhotes e o que parece ser um advogado. Querem aumento: duas latas.',
    choices: [
      { l: 'Negociar uma lata', c: () => has('comida'), req: '1 comida', f: () => { take('comida', 1); stressAll(-6); return 'Acordo fechado. O advogado-rato apertou sua mão. Mais ou menos.'; } },
      { l: 'Demissão por justa causa', f: () => { if (G.dog) { stressAll(-8); return 'O Caramelo fez o papel do RH. Rápido e eficiente.'; } take('comida', 2); return 'A família inteira foi embora... levando duas latas. Processo trabalhista, provavelmente.'; } },
    ] },
  /* ===== TERROR ===== */
  { id: 'contagem', min: 4, text: () => 'Às 3h, alguém contou em voz alta quem estava dormindo. Devagar. Um por um. Todo mundo ouviu. A voz contou um a mais.',
    choices: [
      { l: 'Acender a lanterna e contar de novo', c: () => has('lanterna') && has('pilhas'), req: 'lanterna e pilha', f: () => { take('pilhas'); stressAll(8); return `${home().length}. Vocês são ${home().length}. A luz passou pela câmara fria e, por um instante, a janelinha estava embaçada por dentro.`; } },
      { l: 'Fingir que está dormindo', f: () => { stressAll(14); return 'A voz terminou a contagem e sussurrou: "boa noite, todos". Todos. Ninguém respondeu.'; } },
    ] },
  { id: 'fotos', min: 3, text: () => 'Vocês acharam um celular perdido com 8% de bateria. A galeria está cheia de fotos de vocês dormindo. Tiradas de dentro do depósito. A última é de dez minutos atrás.',
    choices: [
      { l: 'Ver quem está na última foto', f: () => { const sus = others().filter(m => m.infected); stressAll(15); if (sus.length) { const s = pick(sus); suspect(s, 'aparecia sorrindo, acordado, no fundo de uma foto.'); return `Todo mundo dormindo. Menos ${s.name}, no fundo da foto, sentado, olhando direto pra câmera. Sorrindo.`; } return 'Todo mundo dormindo. Inclusive você. Então quem tirou a foto?'; } },
      { l: 'Quebrar o celular', f: () => { stressAll(6); return 'Vocês quebraram o celular. A tela continuou acesa por mais um minuto mostrando a câmera frontal. Apontada pra vocês.'; } },
    ] },
  { id: 'voz', min: 3, cond: () => others().length > 0,
    text: c => { c.m = pick(others()); return `Do outro lado da porta, uma voz idêntica à da mãe de ${c.m.name} chama baixinho: "Filho? Tá tudo bem aqui fora. Abre pra mamãe."`; },
    choices: [
      { l: 'Tapar os ouvidos de todo mundo', f: c => { addStress(c.m, 18); return `${c.m.name} chorou a noite inteira. A voz não parou até amanhecer. Ela sabia o apelido de infância.`; } },
      { l: 'Responder com uma pergunta que só a mãe saberia', f: c => { if (chance(.5)) { stressAll(-4); return 'A voz errou. Por muito. Depois riu, num tom que não era de mãe nenhuma, e foi embora.'; } addStress(c.m, 25); return 'A voz acertou. Exatamente. Depois disse: "viu? sou eu." Ninguém dormiu.'; } },
    ] },
  { id: 'pegadas', min: 5, cond: () => others().length > 0,
    text: c => { c.m = pick(others()); return `Pegadas molhadas no chão do depósito, da porta até o colchão de ${c.m.name}. A porta continua trancada por dentro.`; },
    choices: [
      { l: 'Examinar os pés de todo mundo', f: c => { const sus = others().filter(m => m.infected); if (sus.length && chance(.6)) { const s = pick(sus); suspect(s, 'tinha os pés molhados de manhã.'); return `Só ${s.name} estava com os pés molhados. "Fui ao banheiro", disse. O depósito não tem banheiro.`; } stressAll(8); return 'Todos os pés secos. As pegadas eram de tamanho infantil.'; } },
      { l: 'Secar o chão e não falar disso', f: () => { stressAll(10); return 'Vocês secaram. À noite, elas voltaram. Mais perto.'; } },
    ] },
  { id: 'risada', min: 5, text: () => 'Uma criança ri no duto de ventilação. Depois, uma voz de adulto imita a risada. Mal. Depois várias vozes, todas imitando. Mal.',
    choices: [
      { l: 'Bater na grade pra espantar', f: () => { if (chance(.4)) { if (G.barricade > 0) G.barricade--; return 'As risadas pararam. Algo arranhou a grade a noite toda. A barricada perdeu uma tábua para tapar o duto.'; } stressAll(-4); return 'As risadas pararam. Silêncio. Graças a Deus. Até as 4h.'; } },
      { l: 'Ligar o rádio pra abafar', c: () => has('radio') && has('pilhas'), req: 'rádio e pilha', f: () => { take('pilhas'); stressAll(-8); return 'Tocou um pagode dos anos 90. As risadas pararam. Até os Calmos têm limite.'; } },
    ] },
);

/* dificuldade atual */
function D() { return DIFFS[(typeof App !== 'undefined' && App.diff) || 'normal'] || DIFFS.normal; }

