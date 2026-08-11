"""
Backend do "Bolha & Cia" — demonstração simples do protocolo SOAP.

Serve:
  - o frontend estático (../frontend)
  - as imagens dos três sabonetes (/images/<arquivo>.svg)
  - o serviço SOAP em si (POST /soap), que recebe um envelope XML
    com a operação <bc:ListarSabonetes/> e responde com um envelope
    XML contendo os três produtos e a URL da imagem de cada um.
  - um WSDL simplificado em GET /soap/wsdl, só para leitura/consulta.
"""
from pathlib import Path

from flask import Flask, Response, request, send_from_directory

import soap_service

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
IMAGES_DIR = BASE_DIR / "images"

app = Flask(__name__)

SOAP_CONTENT_TYPE = "text/xml; charset=utf-8"


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:filename>")
def frontend_assets(filename):
    # Serve style.css, script.js etc. Cai em 404 se o Flask não achar o arquivo.
    return send_from_directory(FRONTEND_DIR, filename)


@app.get("/images/<path:filename>")
def images(filename):
    return send_from_directory(IMAGES_DIR, filename, mimetype="image/svg+xml")


@app.post("/soap")
def soap_endpoint():
    body = request.get_data(as_text=True)

    try:
        operacao = soap_service.parse_operation(body)
    except Exception:
        return Response(
            soap_service.build_fault("Envelope SOAP inválido ou malformado."),
            status=400,
            mimetype=SOAP_CONTENT_TYPE,
        )

    if operacao != "ListarSabonetes":
        return Response(
            soap_service.build_fault(f"Operação '{operacao}' não suportada."),
            status=400,
            mimetype=SOAP_CONTENT_TYPE,
        )

    base_url = request.host_url.rstrip("/")
    resposta = soap_service.build_listar_sabonetes_response(base_url)
    return Response(resposta, mimetype=SOAP_CONTENT_TYPE)


@app.get("/soap/wsdl")
def wsdl():
    doc = f"""<?xml version="1.0" encoding="UTF-8"?>
<definitions name="ProtocoloSoapService"
             targetNamespace="{soap_service.NAMESPACES['bc']}"
             xmlns:bc="{soap_service.NAMESPACES['bc']}"
             xmlns:soap="{soap_service.NAMESPACES['soap']}">
  <message name="ListarSabonetesRequest"/>
  <message name="ListarSabonetesResponse">
    <part name="sabonetes" type="bc:SabonetesList"/>
  </message>
  <portType name="ProtocoloSoapPortType">
    <operation name="ListarSabonetes">
      <input message="bc:ListarSabonetesRequest"/>
      <output message="bc:ListarSabonetesResponse"/>
    </operation>
  </portType>
  <service name="ProtocoloSoapService">
    <documentation>
      Envie um POST para /soap com um soap:Envelope cujo Body contenha
      &lt;bc:ListarSabonetes/&gt; para receber os três sabonetes do catálogo.
    </documentation>
  </service>
</definitions>"""
    return Response(doc, mimetype=SOAP_CONTENT_TYPE)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
