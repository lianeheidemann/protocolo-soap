# 🫧 Bolha & Cia — Protocolo SOAP

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)
![SOAP](https://img.shields.io/badge/Protocol-SOAP%201.1-0f6ab4)
![License](https://img.shields.io/badge/license-MIT-green)

Aplicação de referência para demonstrar o protocolo **SOAP** (Simple Object
Access Protocol) na prática. O trocadilho é proposital: o tema do projeto é
uma lojinha fictícia de **sabonetes** artesanais chamada "Bolha & Cia", cujo
backend fala literalmente SOAP — envelopes XML, `soap:Body`, `SOAPAction` e
tudo mais — para entregar o catálogo de produtos exibido no frontend.

## Índice

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Referência da API SOAP](#referência-da-api-soap)
- [Stack técnica](#stack-técnica)
- [Deploy: frontend no GitHub Pages + backend em um servidor](#deploy-frontend-no-github-pages--backend-em-um-servidor)
- [Licença](#licença)

## Visão geral

- **Backend**: um servidor Flask que expõe um serviço SOAP em `POST /soap`.
  Ele monta e interpreta envelopes XML manualmente (sem frameworks SOAP
  externos), para deixar visível a estrutura real do protocolo.
- **Frontend**: uma página estática que monta o envelope de requisição em
  JavaScript, envia via `fetch`, faz o parsing do XML de resposta com
  `DOMParser` e renderiza os sabonetes em um catálogo com visual moderno
  (glassmorphism, bolhas animadas, paleta pastel).
- **Catálogo de produtos**: cada sabonete é ilustrado por um SVG gerado
  localmente (`backend/images/*.svg`) — lavanda, carvão ativado e cítrico —
  servido pelo backend e referenciado na resposta SOAP.

## Arquitetura

```
┌──────────────┐   POST /soap (envelope XML)   ┌───────────────────┐
│   Frontend    │ ─────────────────────────────▶│      Backend       │
│ (HTML/CSS/JS) │◀───────────────────────────── │  Flask + XML puro  │
└──────────────┘   envelope XML de resposta     └───────────────────┘
                                                          │
                                                          ▼
                                                  backend/images/*.svg
```

O mesmo processo Flask serve o frontend estático, o endpoint SOAP e as
imagens — não há necessidade de subir servidores separados.

## Estrutura do projeto

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

## Pré-requisitos

- Python 3.9 ou superior
- `pip` para instalar dependências
- Nenhuma dependência de frontend (sem Node.js, sem build step)

## Como rodar

### Linux / macOS

```bash
cd protocolo-soap/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Windows (PowerShell)

```powershell
cd protocolo-soap/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### Windows (cmd)

```cmd
cd protocolo-soap/backend
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py
```

> No PowerShell, se a ativação do venv falhar por causa da política de
> execução de scripts, rode uma vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Depois de iniciar o servidor, abra [http://localhost:5000](http://localhost:5000)
no navegador.

## Referência da API SOAP

| Endpoint | Método | Descrição |
|---|---|---|
| `/soap` | `POST` | Ponto de entrada do serviço SOAP. Recebe um `soap:Envelope` e retorna outro. |
| `/soap/wsdl` | `GET` | Descrição simplificada do serviço, no estilo WSDL. |
| `/images/<arquivo>` | `GET` | Serve os SVGs dos sabonetes referenciados nas respostas SOAP. |
| `/` | `GET` | Serve o frontend estático. |

### Operação `ListarSabonetes`

Requisição enviada pelo frontend para `POST /soap`:

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

Resposta contendo os sabonetes do catálogo, cada um com id, nome, descrição
e a URL da sua imagem:

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
      <!-- ... demais sabonetes ... -->
    </bc:ListarSabonetesResponse>
  </soap:Body>
</soap:Envelope>
```

### Tratamento de erros

Requisições com XML malformado ou uma operação não suportada recebem um
`soap:Fault` com status HTTP 400:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Client</faultcode>
      <faultstring>Operação 'Foo' não suportada.</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>
```

Na própria página, o bloco **"Ver o envelope SOAP enviado / recebido"**
mostra o XML real trocado entre frontend e backend, para quem quiser
inspecionar o protocolo em ação.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Backend | Python 3 + Flask |
| Serialização SOAP | `xml.etree.ElementTree` (sem frameworks SOAP externos) |
| Frontend | HTML, CSS e JavaScript puros (sem build step, sem dependências) |

## Deploy: frontend no GitHub Pages + backend em um servidor

Localmente, o Flask serve o frontend e a API pela mesma origem. Em produção,
frontend e backend costumam ficar em domínios diferentes (GitHub Pages só
serve arquivos estáticos, não roda Python), então é preciso:

### Backend (Render)

O `render.yaml` na raiz do repositório já descreve o serviço (Blueprint):

1. No [dashboard do Render](https://dashboard.render.com), escolha **New +
   → Blueprint** e selecione este repositório. O Render lê o `render.yaml`
   e cria automaticamente um Web Service Python rodando
   `gunicorn app:app` a partir de `backend/`.
2. Ajuste a variável de ambiente `ALLOWED_ORIGIN` (já pré-configurada no
   `render.yaml`) para a URL real do seu GitHub Pages, ex:
   `https://lianeheidemann.github.io` — isso restringe o CORS a essa
   origem. Sem essa variável, o padrão é `*` (qualquer origem).
3. Depois do deploy, o Render fornece uma URL pública (ex:
   `https://protocolo-soap-backend.onrender.com`) — é ela que vai em
   `API_BASE_URL` no frontend (próxima seção).

Sem Blueprint, qualquer outro serviço com suporte a Python (Railway,
Fly.io, uma VPS, etc.) também funciona: instale `backend/requirements.txt`
e rode `gunicorn --chdir backend app:app`.

### Frontend

1. O workflow `.github/workflows/deploy-pages.yml` publica automaticamente
   o conteúdo de `frontend/` no GitHub Pages a cada push em `main`. Basta
   habilitar Pages nas configurações do repositório (Settings → Pages →
   Source: "GitHub Actions").
2. Em `frontend/script.js`, defina `API_BASE_URL` com a URL pública do
   backend hospedado (ex: `"https://protocolo-soap.onrender.com"`). Com
   `API_BASE_URL = ""` (padrão), o frontend só funciona quando servido pelo
   próprio Flask.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
