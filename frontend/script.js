// Namespaces XML usados no envelope SOAP, precisam bater com os do backend
// (ver NAMESPACES em backend/soap_service.py) para o parsing funcionar.
const SOAP_NS = "http://schemas.xmlsoap.org/soap/envelope/";
const BC_NS = "http://bolhaecia.local/soap";

const statusEl = document.getElementById("status");
const catalogoEl = document.getElementById("catalogo");
const reqPreEl = document.getElementById("soap-request");
const resPreEl = document.getElementById("soap-response");

// Monta, como string, o envelope SOAP de requisição para a operação
// ListarSabonetes (não há corpo/parâmetros, é só a tag da operação).
function montarEnvelopeRequisicao() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_NS}" xmlns:bc="${BC_NS}">
  <soap:Header/>
  <soap:Body>
    <bc:ListarSabonetes/>
  </soap:Body>
</soap:Envelope>`;
}

// Transforma um sabonete (já extraído do XML) em um card visual do catálogo.
function renderizarCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <img src="${item.imagemUrl}" alt="${item.nome}" width="200" height="200" />
    <h2>${item.nome}</h2>
    <p>${item.descricao}</p>
    <span class="id-tag">SOAP #${item.id}</span>
  `;
  return card;
}

// Lê o XML de resposta e converte cada <bc:Sabonete> em um objeto JS simples.
// getElementsByTagNameNS é necessário porque os elementos estão em um
// namespace próprio (BC_NS), não no namespace padrão do documento.
function extrairSabonetes(xmlDoc) {
  const nodes = Array.from(xmlDoc.getElementsByTagNameNS(BC_NS, "Sabonete"));
  return nodes.map((node) => ({
    id: node.getElementsByTagNameNS(BC_NS, "Id")[0]?.textContent ?? "",
    nome: node.getElementsByTagNameNS(BC_NS, "Nome")[0]?.textContent ?? "",
    descricao: node.getElementsByTagNameNS(BC_NS, "Descricao")[0]?.textContent ?? "",
    imagemUrl: node.getElementsByTagNameNS(BC_NS, "ImagemUrl")[0]?.textContent ?? "",
  }));
}

// Fluxo principal: envia a requisição SOAP, mostra os envelopes trocados
// na tela (para fins didáticos) e renderiza o catálogo recebido.
async function carregarCatalogo() {
  const envelope = montarEnvelopeRequisicao();
  reqPreEl.textContent = envelope;

  try {
    const resposta = await fetch("/soap", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        // SOAPAction é o cabeçalho tradicional do protocolo SOAP 1.1 para
        // indicar qual operação está sendo chamada.
        SOAPAction: "ListarSabonetes",
      },
      body: envelope,
    });

    const textoResposta = await resposta.text();
    resPreEl.textContent = textoResposta;

    if (!resposta.ok) {
      // HTTP não-2xx aqui normalmente significa que o corpo é um soap:Fault.
      throw new Error("O serviço SOAP retornou um erro.");
    }

    const xmlDoc = new DOMParser().parseFromString(textoResposta, "text/xml");
    const sabonetes = extrairSabonetes(xmlDoc);

    if (sabonetes.length === 0) {
      throw new Error("Nenhum sabonete veio na resposta SOAP.");
    }

    catalogoEl.innerHTML = "";
    sabonetes.forEach((item) => catalogoEl.appendChild(renderizarCard(item)));
    statusEl.textContent = `${sabonetes.length} sabonetes recebidos via SOAP ✨`;
  } catch (erro) {
    statusEl.textContent = `Não foi possível falar com o serviço SOAP: ${erro.message}`;
    statusEl.classList.add("erro");
  }
}

// Dispara a busca do catálogo assim que a página carrega este script.
carregarCatalogo();
