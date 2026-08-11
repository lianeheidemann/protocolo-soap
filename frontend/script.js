const SOAP_NS = "http://schemas.xmlsoap.org/soap/envelope/";
const BC_NS = "http://bolhaecia.local/soap";

const statusEl = document.getElementById("status");
const catalogoEl = document.getElementById("catalogo");
const reqPreEl = document.getElementById("soap-request");
const resPreEl = document.getElementById("soap-response");

function montarEnvelopeRequisicao() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_NS}" xmlns:bc="${BC_NS}">
  <soap:Header/>
  <soap:Body>
    <bc:ListarSabonetes/>
  </soap:Body>
</soap:Envelope>`;
}

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

function extrairSabonetes(xmlDoc) {
  const nodes = Array.from(xmlDoc.getElementsByTagNameNS(BC_NS, "Sabonete"));
  return nodes.map((node) => ({
    id: node.getElementsByTagNameNS(BC_NS, "Id")[0]?.textContent ?? "",
    nome: node.getElementsByTagNameNS(BC_NS, "Nome")[0]?.textContent ?? "",
    descricao: node.getElementsByTagNameNS(BC_NS, "Descricao")[0]?.textContent ?? "",
    imagemUrl: node.getElementsByTagNameNS(BC_NS, "ImagemUrl")[0]?.textContent ?? "",
  }));
}

async function carregarCatalogo() {
  const envelope = montarEnvelopeRequisicao();
  reqPreEl.textContent = envelope;

  try {
    const resposta = await fetch("/soap", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "ListarSabonetes",
      },
      body: envelope,
    });

    const textoResposta = await resposta.text();
    resPreEl.textContent = textoResposta;

    if (!resposta.ok) {
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

carregarCatalogo();
