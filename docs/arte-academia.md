# Academia: arte modular do interior

Continuação da arte exterior da Chama Eterna (PR #79). O interior é compartilhado pelas vilas. As quatro salas mantêm a geometria e as regras do tutorial que já existiam.

| Sala | Direção de arte | O que permanece |
| --- | --- | --- |
| Taijutsu | Madeira quente, tapete vermelho e brasão geométrico | Três bonecos e percurso livre |
| Controle | Madeira fria e almofadas verde-acinzentadas | Campo de chakra e meditação |
| Jutsus | Tapete ameixa e painéis de papel | Vão, armadilha e caminho do Teleporte |
| Armas | Madeira âmbar e tapete ocre | Racks, Diretor e saída com trava |

O cliente monta três camadas separadas: assoalho, paredes e elementos têxteis. As juntas da madeira seguem coordenadas do mundo e continuam entre os chunks de 8 × 8. O minimapa usa um tom por sala. A pintura ocorre ao montar o cache; não há download de atlas extra, efeito animado novo ou custo por quadro. As colisões, as transições entre as etapas e os pontos de interação ficam no código do servidor.

## Verificação e retomada

- `npm run verify`: 959 testes passaram, além de checagem de tipos e build. Os casos de banco que exigem `TEST_DATABASE_URL` não rodaram nessa execução.
- Chromium em viewport móvel horizontal (926 × 428 CSS px) com servidor e PostgreSQL locais: criação do ninja, entrada na Academia e movimento em Taijutsu, de (8, 11) a (11,5, 11), confirmados pelo servidor. A vista em faixa das quatro salas foi exportada com o próprio renderer do jogo.
- Não foi feita publicação no Render. Não houve migração nem alteração na Oracle.
- Próxima validação: passar pelo tutorial completo em um aparelho real (incluindo meditação, vão, armadilha e saída), antes de publicar. Para o próximo lote de arte, use os interiores das lojas ou a transição sul como recorte independente. O poço da Praça já tem sprite e posição no exterior modular; verificar sua interação separadamente.
