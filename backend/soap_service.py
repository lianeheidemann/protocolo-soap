"""
Lógica do serviço SOAP da lojinha "Bolha & Cia".

Este módulo monta e interpreta envelopes SOAP (XML) manualmente, sem
frameworks externos, para deixar visível a estrutura do protocolo:
Envelope -> Header -> Body -> Operação.
"""
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

NAMESPACES = {
    "soap": "http://schemas.xmlsoap.org/soap/envelope/",
    "bc": "http://bolhaecia.local/soap",
}

# Catálogo fixo com os três sabonetes (as "três imagens diferentes"
# que o backend fornece para o frontend exibir).
CATALOGO = [
    {
        "id": "1",
        "nome": "Sabonete de Lavanda",
        "descricao": "Aroma relaxante com flores de lavanda desidratadas.",
        "imagem": "sabonete-lavanda.svg",
    },
    {
        "id": "2",
        "nome": "Sabonete de Carvão Ativado",
        "descricao": "Purificante, indicado para peles oleosas.",
        "imagem": "sabonete-carvao.svg",
    },
    {
        "id": "3",
        "nome": "Sabonete Cítrico",
        "descricao": "Mistura revigorante de laranja e limão siciliano.",
        "imagem": "sabonete-citrus.svg",
    },
]


def parse_operation(xml_body: str) -> str:
    """Extrai o nome da operação solicitada dentro de soap:Body."""
    root = ET.fromstring(xml_body)
    body = root.find("soap:Body", NAMESPACES)
    if body is None or len(body) == 0:
        raise ValueError("Envelope SOAP sem soap:Body ou operação")
    return body[0].tag.split("}")[-1]


def build_fault(mensagem: str) -> str:
    # Monta um soap:Fault padrão (formato de erro definido pelo protocolo
    # SOAP), usado sempre que o envelope é inválido ou a operação não existe.
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="{NAMESPACES['soap']}">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Client</faultcode>
      <faultstring>{escape(mensagem)}</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>"""


def build_listar_sabonetes_response(base_url: str) -> str:
    """Monta a resposta SOAP com os três sabonetes e a URL de cada imagem."""
    itens_xml = ""
    for item in CATALOGO:
        # A URL da imagem é montada como absoluta (com host) para que o
        # frontend possa usá-la diretamente no atributo src do <img>.
        imagem_url = f"{base_url}/images/{item['imagem']}"
        # escape() evita que textos do catálogo quebrem o XML caso
        # contenham caracteres especiais como & ou <.
        itens_xml += f"""
      <bc:Sabonete>
        <bc:Id>{item['id']}</bc:Id>
        <bc:Nome>{escape(item['nome'])}</bc:Nome>
        <bc:Descricao>{escape(item['descricao'])}</bc:Descricao>
        <bc:ImagemUrl>{escape(imagem_url)}</bc:ImagemUrl>
      </bc:Sabonete>"""

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="{NAMESPACES['soap']}" xmlns:bc="{NAMESPACES['bc']}">
  <soap:Header>
    <bc:Servico>ProtocoloSoapService</bc:Servico>
  </soap:Header>
  <soap:Body>
    <bc:ListarSabonetesResponse>{itens_xml}
    </bc:ListarSabonetesResponse>
  </soap:Body>
</soap:Envelope>"""
