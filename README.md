# 🫧 Bolha & Cia — Protocolo SOAP

Uma aplicação bem simples para demonstrar o protocolo **SOAP** (Simple Object
Access Protocol) na prática. O trocadilho é proposital: o tema do projeto é
uma lojinha fictícia de **sabonetes** artesanais chamada "Bolha & Cia", cujo
backend fala literalmente SOAP — envelopes XML, `soap:Body`, `SOAPAction` e
tudo mais — para entregar as três imagens de produto exibidas no frontend.

## A ideia

- **Backend**: um servidor Flask que expõe um serviço SOAP em `POST /soap`.
  Ele monta e interpreta envelopes XML manualmente (sem frameworks SOAP
  externos), para deixar visível a estrutura real do protocolo.
- **Frontend**: uma página estática que monta o envelope de requisição no
  JavaScript, envia via `fetch`, faz o parsing do XML de resposta com
  `DOMParser` e renderiza os três sabonetes em um catálogo com visual
  moderno (glassmorphism, bolhas animadas, paleta pastel).
- **As três imagens**: cada sabonete do catálogo é ilustrado por um SVG
  gerado localmente (`backend/images/*.svg`) — lavanda, carvão ativado e
  cítrico — servidos pelo backend e referenciados na resposta SOAP.

## Estrutura

```
protocolo-soap/
├── README.md
├── backend/
│   ├── app.py             # servidor Flask: rotas /, /soap, /soap/wsdl, /images
│   ├── soap_service.py    # montagem/parsing dos envelopes SOAP (XML puro)
│   ├── requirements.txt
│   └── images/
│       ├── sabonete-lavanda.svg
│       ├── sabonete-carvao.svg
│       └── sabonete-citrus.svg
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## Como rodar

```bash
cd protocolo-soap/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Abra [http://localhost:5000](http://localhost:5000) no navegador. O próprio
Flask serve o frontend (`../frontend`), então não é preciso subir dois
servidores separados.

## O protocolo SOAP, na prática

O frontend envia este envelope para `POST /soap`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:bc="http://bolhaecia.local/soap">
  <soap:Header/>
  <soap:Body>
    <bc:ListarSabonetes/>
  </soap:Body>
</soap:Envelope>
```

E recebe de volta um envelope contendo os três sabonetes, cada um com id,
nome, descrição e a URL da sua imagem:

```xml
<soap:Envelope xmlns:soap="..." xmlns:bc="...">
  <soap:Header>
    <bc:Servico>ProtocoloSoapService</bc:Servico>
  </soap:Header>
  <soap:Body>
    <bc:ListarSabonetesResponse>
      <bc:Sabonete>
        <bc:Id>1</bc:Id>
        <bc:Nome>Sabonete de Lavanda</bc:Nome>
        <bc:Descricao>Aroma relaxante com flores de lavanda desidratadas.</bc:Descricao>
        <bc:ImagemUrl>http://localhost:5000/images/sabonete-lavanda.svg</bc:ImagemUrl>
      </bc:Sabonete>
      <!-- ... mais dois sabonetes ... -->
    </bc:ListarSabonetesResponse>
  </soap:Body>
</soap:Envelope>
```

Uma descrição simplificada do serviço (estilo WSDL) fica disponível em
`GET /soap/wsdl`. Requisições com uma operação não suportada recebem um
`soap:Fault` com HTTP 400.

Na própria página, o bloco **"Ver o envelope SOAP enviado / recebido"**
mostra o XML real trocado entre frontend e backend, para quem quiser
inspecionar o protocolo em ação.

## Stack

- Python 3 + Flask (backend)
- `xml.etree.ElementTree` para montar/interpretar os envelopes SOAP
- HTML, CSS e JavaScript puros no frontend (sem build step, sem dependências)
