# Traço — Planejador de móveis

Editor de marcenaria em português, sem backend. HTML, CSS e módulos JavaScript; Three.js 0.180.0 incluído localmente sob licença MIT.

## Uso

- Desenhe linhas para criar chapas, ou retângulos para criar painéis.
- Ajuste dimensões, posição e rotação de cada peça em milímetros.
- Alterne entre Frente, Superior e Lateral; acompanhe o modelo 3D.
- Segure Alt ao desenhar uma linha para liberar a inclinação.
- Os limites de referência são guias e não redimensionam as peças existentes.
- Salve e abra projetos JSON, baixe a lista CSV e capture o modelo em PNG.
- Alterne entre centímetros e milímetros: os valores são convertidos nos campos, na grade, nas cotas 2D/3D e na lista CSV. O arquivo mantém a geometria em milímetros e registra a unidade escolhida.
- Em **Planejar quarto**, configure largura, comprimento, pé-direito, cores, uma porta e uma janela. A vista inicial remove duas paredes para revelar o interior.
- Adicione cama, bancada, guarda-roupa, cadeira, volume livre ou uma cópia de um móvel desenhado/importado. Arraste a planta para mover o conjunto e use R para girar 90°. Cada instância tem dimensões, posição e giro próprios.
- O arquivo JSON inclui o quarto e os móveis posicionados. Volumes fora do ambiente ou sobrepostos são sinalizados pelo envelope do móvel; ferragens, tolerâncias e áreas de abertura não são simuladas.

O último projeto fica salvo no localStorage deste navegador. Os arquivos JSON permitem transportar projetos entre dispositivos. Não há sincronização de projetos entre navegadores nem análise estrutural. A lista de peças usa medidas geométricas; não é um plano de corte otimizado.

## Desenvolvimento

Sirva `dist/` com um servidor HTTP estático. O manifesto `.openai/hosting.json` configura a publicação.

Para publicar na Vercel, importe o repositório com a raiz do projeto no diretório atual. O arquivo `vercel.json` publica `dist/` diretamente, sem instalação de dependências ou etapa de build.

- `core.js`: geometria, modelos, área de chapas e validação de importação.
- `app.js`: editor de grade, histórico, propriedades e arquivos.
- `view3d.js`: renderização WebGL e câmera orbital.
- `software3d.js`: projeção em perspectiva com Canvas 2D quando WebGL não está disponível, com rotação e seleção de faces.
- `room-core.js`: geometria do ambiente, aberturas, instâncias, transformações e verificação de envelopes.
- `room.js`: planta, catálogo, medidas e posicionamento dos móveis.

## Verificação realizada

Validação de sintaxe dos módulos e verificações da geometria das três vistas, limites do armário, comprimento de linhas diagonais, espessura de painéis e rejeição de projetos inválidos. No navegador: criação em branco, desenho de linhas para chapas, edição por teclado, desfazer, duplicação e exportação/reabertura JSON.

Extensão do quarto: conversão cm/mm, compatibilidade com arquivos antigos, validação de aberturas, rotação e escala de conjuntos de peças, sobreposições e salvamento do ambiente. No navegador: criação do quarto, inclusão de cama/bancada/móvel próprio, posição decimal em cm, arrastar na planta, giro, desfazer/refazer e persistência após recarregar.

## Executar o projeto localmente

Na raiz do repositório, inicie o servidor com Python 3.

```sh
python3 -m http.server 8000 --directory dist
```

Acesse `http://localhost:8000` e clique em **Meu quarto**. Para importar a cópia do projeto com o closet e os móveis posicionados, clique em **Abrir** e selecione [`projetos/Quarto_Samuel_Traco.json`](projetos/Quarto_Samuel_Traco.json).

Para executar os testes de geometria com Node.js 20 ou superior, use `node --test tests/geometry.test.js`.
