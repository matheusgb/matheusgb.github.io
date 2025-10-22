---
title: Mapeamento de memória, worker threads e binários ELF - correções e aprofundamentos do statreader.c
date: 2025-10-22
tags: [linguagem c, sistemas operacionais, jornada observabilidade]
---

Correções técnicas e explorações sobre conceitos fundamentais: diferença entre mmap() e malloc(), como worker threads funcionam no kernel, MAP_SHARED vs MAP_PRIVATE, e a relação entre ferramentas estáticas (nm, objdump) e dinâmicas (mmap) no ciclo de vida de programas.

<!-- excerpt -->

---

### Errata sobre considerações feitas no [post anterior](https://matheusgb.github.io/posts/2025/10/refatorando-statreader.c/)

### 1. _system_:

> Tempo gasto dentro do kernel, executando chamadas de sistema (syscalls), I/O, _alocação de memória_, etc.

_Correção_:
O kernel _não realiza alocação de memória_ no sentido tradicional (como o `malloc` do espaço de usuário).
O que ele faz é _mapear regiões de memória_ por meio de chamadas como `mmap()`, que estabelecem a correspondência entre endereços virtuais e páginas físicas ou arquivos.

Esses mapeamentos podem ser:

- _Anônimos_: usados para alocação dinâmica (sem associação a arquivo), base do heap de processos. É como pegar uma folha em branco pra anotar algo temporário. Não é salva em lugar nenhum, quando joga fora, o conteúdo se perde.
- _Baseados em arquivo_: usados para mapear arquivos inteiros na memória (como executáveis, bibliotecas dinâmicas ou memória compartilhada via `MAP_SHARED`). Reserva espaço na memória que espelha um arquivo existente no disco. É como abrir um livro físico sobre a mesa, você lê e escreve direto nas páginas. O kernel cuida pra trazer as páginas do livro pro seu alcance quando você precisa delas.

Após o `mmap()`, a _gerência efetiva_ dessa memória (fragmentação, liberação, realocação etc.) é feita _no espaço de usuário_, por bibliotecas como `libc`, `jemalloc` ou `tcmalloc`.
O kernel apenas garante o isolamento, proteção e paginação do espaço virtual, _sem participar do gerenciamento interno_ dessa área.

Se entendi corretamente: o `mmap()` cria o mapeamento virtual (a reserva de endereços), o `user space` escreve e lê dentro desse espaço, mas quem traz as páginas reais, seja uma página em branco (no caso anônimo) ou o conteúdo do arquivo (no caso baseado em arquivo) é o kernel, quando o processo acessa pela primeira vez.

#### Sobre MAP_SHARED (no mmap()):

Quando você usamos `mmap()` para mapear um arquivo na memória, você diz como quer que esse mapeamento se comporte. Um dos principais flags é o `MAP_SHARED`.

Exemplo:
Vamos imaginar que dois processos querem “abrir o mesmo livro” (um arquivo) e trabalhar nele:

Se usa `MAP_SHARED`,

- Os dois estão literalmente vendo e escrevendo nas mesmas páginas do livro.
  Ou seja, qualquer modificação feita na memória é refletida no arquivo e visível para outros processos que também o mapearam com MAP_SHARED.

Se usa `MAP_PRIVATE`,

- Cada processo ganha uma cópia particular das páginas.
  Quando ele altera algo, é como se escrevesse em uma fotocópia do livro, a alteração não vai para o arquivo original, nem aparece para outros processos.

#### Uma analogia em JavaScript sobre `MAP_PRIVATE` e `MAP_SHARED` que faz sentido na minha cabeça:

```js
// MAP_SHARED
let array1 = [1, 2, 3];
let array2 = array1; // outra variável aponta pro mesmo array

array1.reverse(); // inverte a ordem

console.log(array2); // [3,2,1] → mudança visível
```

```js
// MAP_PRIVATE
let array1 = [1, 2, 3];
let array2 = [...array1]; // copia do array

array1.reverse();

console.log(array2); // [1,2,3] → mudança não afeta a cópia
```

#### Sobre Espaço de usuário (user space)

Imaginando que o sistema operacional é um prédio com dois andares:

- Andar de baixo (kernel):
  Com acesso total ao hardware (memória física, disco, CPU, etc). Só o kernel pode, por exemplo, falar diretamente com a RAM, as placas de rede, o disco...

- Andar de cima (user space):
  Onde rodam os programas comuns: navegador, editor de texto, etc...
  Esses programas não podem acessar diretamente o hardware, só pedem “permissão” ao kernel através de syscalls (como read(), write(), mmap(), open(), etc).

O espaço de usuário é a região de memória onde o programa roda isolado do kernel.

---

### 2. _softirq_:

> Mostra custo de tratamento de rede e tarefas assíncronas.

_Correção_:
O campo **softirq** é _específico para o processamento de rede_ e algumas rotinas críticas de baixo nível.
O termo “tarefas assíncronas” é impreciso, pois _o kernel inteiro é estruturado de forma assíncrona_, com múltiplas worker threads internas executando operações em paralelo.

Essas worker threads são entidades do kernel que _processam filas de tarefas pendentes_. Por exemplo: limpeza de caches, escrita assíncrona em disco, ou manipulação de pacotes de rede, sem bloquear o contexto de interrupção que as gerou.
Assim, elas permitem que o kernel _delegue trabalho pesado ou demorado_ para execução posterior, fora do caminho crítico da interrupção, mantendo o sistema responsivo e eficiente.

Exemplo de fluxo: `[Hardware dispara evento] → [Contexto de interrupção no kernel: captura e registra rapidamente] → [Delegação para worker thread] → [Worker thread processa tarefa pesada: limpeza de cache / escrita assíncrona / manipulação de pacotes] → [Tarefa concluída, kernel continua responsivo]`

---

### Devaneios sobre `nm`, `objdump` e `mmap`

---

1. `nm` e `objdump`

Eles mostram como o binário está estruturado, ou seja, como o programa foi “montado” antes de ser carregado pelo kernel.

`nm`: lista símbolos (funções, variáveis globais, seções).

`objdump -h` mostra as seções do `ELF`: `.text`, `.data`, `.bss`, `.rodata`, etc.

2. `mmap` e `malloc`

Esses entram quando o binário já está em execução, o kernel e a libc "montam o prédio" e passam a alocar/apontar regiões de memória reais:

O loader do kernel usa mmap() para carregar:

- .text (seção do código em binário),
- .data, .bss,
- bibliotecas dinâmicas,
- stack, heap etc.

Depois disso, o programa pode chamar `malloc()`, que internamente:

- Usa `brk()` (para crescer o heap) ou
- `mmap()` (para alocar grandes blocos)

#### Analogia:

`nm`, `objdump`: Planta do prédio no papel (binário no disco)
`mmap()`: Kernel construindo os cômodos (endereços de memória)
`malloc()`: Programa colocando móveis/dados (alocação dinâmica)
