# CallLink • Chamada de Voz P2P

Aplicação web **100% estática** para chamadas de voz em tempo real entre dois navegadores, usando **WebRTC + PeerJS**. Sem backend próprio, sem instalação e pronta para hospedar gratuitamente no GitHub Pages.

## Demonstração

Após publicar no GitHub Pages, acesse:

```
https://farrei.github.io/calllink/
```

*(substitua pelo nome do repositório que você criar)*

## Funcionalidades

- Chamada de voz peer-to-peer direta (WebRTC)
- Geração automática de ID único
- Link de convite com parâmetro `?call=ID` (entra com um clique)
- Tela de chamada recebida com toque sonoro gerado via Web Audio API
- Interface estilo smartphone (dark mode + glassmorphism)
- Cronômetro em tempo real
- Visualizador de nível de voz (ondas sonoras)
- Mute, teste de áudio e encerramento limpo
- Cancelamento de eco, supressão de ruído e AGC
- Totalmente responsivo (mobile-first)
- Tratamento de erros (permissão de microfone, queda de conexão, etc.)

## Tecnologias

- HTML5 + CSS3 (puro)
- JavaScript vanilla
- [PeerJS](https://peerjs.com/) (CDN) para sinalização
- Servidores STUN públicos do Google
- Web Audio API (ringtone + visualizador)

## Como usar

1. Abra o site.
2. Copie o **Link de Convite** e envie para a outra pessoa.
3. A outra pessoa abre o link e a chamada é iniciada automaticamente (ou cole o ID e clique em "Ligar Agora").
4. Atenda a chamada quando receber a notificação.
5. Converse. Use os botões de mute, teste de áudio e encerrar.

## Publicar no GitHub Pages

1. Crie um repositório (ex: `calllink`) na sua conta [github.com/farrei](https://github.com/farrei).
2. Faça upload dos arquivos desta pasta (`index.html`, `css/`, `js/`, `README.md`).
3. Vá em **Settings → Pages**.
4. Em **Source**, selecione a branch `main` e pasta `/ (root)`.
5. Aguarde alguns minutos e o site estará no ar.

## Estrutura do Projeto

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Notas Técnicas

- A conexão de mídia é **direta entre os navegadores** (P2P). O PeerJS Cloud é usado apenas para a sinalização inicial.
- Requer HTTPS (GitHub Pages já fornece).
- O usuário precisa conceder permissão ao microfone.
- Funciona em redes NAT/4G/Wi-Fi graças aos servidores STUN.
- Em alguns casos raros de firewalls muito restritivos pode ser necessário TURN (não incluído para manter 100% gratuito e estático).

## Licença

MIT — sinta-se livre para usar, modificar e incluir no seu portfólio.

---

Desenvolvido como projeto de portfólio demonstrando WebRTC, PeerJS e interfaces modernas em tempo real.