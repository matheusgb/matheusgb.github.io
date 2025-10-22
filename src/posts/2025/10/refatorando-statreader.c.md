---
title: Refatorando statreader.c - aplicando lições do memreader.c para monitoramento de CPU
date: 2025-10-19
tags: [linguagem c, sistemas operacionais, jornada observabilidade]
---

Uma análise prática da refatoração do `statreader.c` aplicando as sugestões do Sanchez sobre o `memreader.c`. Explorando o `/proc/stat`, diferenças entre CPUs físicas e virtuais, significado de jiffies, e como transformar dados do kernel em observabilidade útil.

<!-- excerpt -->

memreader.c antigo: https://github.com/matheusgb/readers/blob/master/memreader.c

Mudanças memreader.c sugeridas: https://github.com/rnsanchez/readers/blob/master/memreader.c

statreader.c antigo (pré sugestões do memreader.c): https://github.com/matheusgb/readers/blob/b4efb4e45477fd9fc73ec9155940cd4bcc3e42e1/statreader.c

statreader.c refatorado: https://github.com/matheusgb/readers/blob/a685106859a114cabc7cc1221d34c978f6588a5b/statreader.c

---

### Observando `/proc/stat`

A ideia desse `statreader.c` é semelhante ao `memreader.c`, porém para CPU.

Comecei explorando como era o arquivo, e me deparei com essa estrutura:

```
cpu  6282 4 4649 3809428 922 0 551 0 0 0
cpu0 181 0 161 118967 34 0 395 0 0 0
cpu1 202 0 40 119119 52 0 32 0 0 0
cpu2 266 0 111 119025 20 0 9 0 0 0
cpu3 41 1 59 119120 185 0 13 0 0 0
cpu4 118 0 277 118970 18 0 23 0 0 0
cpu5 477 0 191 118915 28 0 6 0 0 0
cpu6 135 0 198 118926 113 0 16 0 0 0
cpu7 109 0 106 119141 56 0 12 0 0 0
cpu8 182 0 124 119068 32 0 0 0 0 0
cpu9 71 0 79 119187 14 0 6 0 0 0
cpu10 225 0 104 119083 12 0 0 0 0 0
cpu11 103 0 79 119240 9 0 1 0 0 0
cpu12 382 0 208 118809 26 0 4 0 0 0
cpu13 200 0 74 119152 5 0 4 0 0 0
cpu14 480 0 275 118651 26 0 4 0 0 0
cpu15 204 1 116 119102 0 0 6 0 0 0
cpu16 368 0 253 118753 11 0 1 0 0 0
cpu17 422 0 327 118671 10 0 7 0 0 0
cpu18 171 0 173 119016 11 0 0 0 0 0
cpu19 99 0 76 119227 8 0 0 0 0 0
cpu20 105 0 206 119042 26 0 0 0 0 0
cpu21 165 0 70 119174 22 0 0 0 0 0
cpu22 351 1 224 118841 18 0 0 0 0 0
cpu23 137 0 185 119082 10 0 7 0 0 0
cpu24 186 0 233 118957 15 0 0 0 0 0
cpu25 78 0 59 119273 3 0 2 0 0 0
cpu26 232 0 145 118997 25 0 0 0 0 0
cpu27 137 0 32 119241 10 0 1 0 0 0
cpu28 209 1 90 119089 25 0 2 0 0 0
cpu29 68 0 85 119208 52 0 0 0 0 0
cpu30 141 0 259 119017 25 0 0 0 0 0
cpu31 37 0 30 119349 7 0 0 0 0 0
intr 700381 0 0 0 0 0 0 0 0 0 13 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1201 1 1 10 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
ctxt 1612849
btime 1760910622
processes 7460
```

... e eu não entendi nada 🤭.

- Por qual motivo tem 32 CPU's se meu processador tem 16 cores?
- O que cada coluna significa?
- O que é `intr`, `ctxt` e `btime`? (`processes` é meio autoexplicativo, mas ainda assim não tive clareza do que significava).
- Esses números nas colunas representam o que exatamente?
- Como uso isso de forma útil para observar o uso de recursos da máquina?

### "Por qual motivo tem 32 CPU's se meu processador tem 16 cores?"

Meu processador tem 16 núcleos **físicos**, mas cada núcleo físico pode executar duas threads simultaneamente usando [Hyper-Threading](https://www.intel.com.br/content/www/br/pt/gaming/resources/hyper-threading.html) (caso processador seja Intel) ou [SMT](https://www.amd.com/en/blogs/2025/simultaneous-multithreading-driving-performance-a.html) (caso seja AMD).

O kernel do Linux enxerga cada thread como uma CPU independente. Por isso 32.

Com isso, cada thread pode ser monitorada de forma independente, e caso seja necessário métricas de uso do processador físico podemos somar ou agrupar threads do mesmo núcleo físico.

---

### "O que cada coluna dos CPU's significa?"

Na struct, já deixei breves definições do que cada coluna significa, a ordem da esquerda para direita, é: `user`, `nice`, `system`, `idle`, `iowait`, `irq`, `softirq`, `steal`, `guest` e `guest_nice`.

```c
typedef struct
{                              // Gerencia:
    char user[MAX_ITEM];       // Programas comuns, execução de instruções normais de programas.
    char nice[MAX_ITEM];       // Processos de baixa prioridade.
    char system[MAX_ITEM];     // Kernel, grava algo em disco, aloca memória, cria threads, pacotes de rede.
    char idle[MAX_ITEM];       // Ociosidade.
    char iowait[MAX_ITEM];     // Ociosidade, mas diferente de idle, há trabalho pendente, CPU aguardando rede ou disco responder.
    char irq[MAX_ITEM];        // Interrupções de Hardware. (ex: placa de rede informando que recebeu um pacote, teclado digitando, SSD sinalizando que terminou uma escrita e etc...)
    char softirq[MAX_ITEM];    // Interrupções de Sofware. (ex: processamento de pacotes TCP, tarefas do kernel, etc...)
    char steal[MAX_ITEM];      // Competição entre VMs por CPU, se uma VM que compartilha hardware com outra for menos priorizada, steal sobe.
    char guest[MAX_ITEM];      // Tempo gasto executando máquinas virtuais no sistema.
    char guest_nice[MAX_ITEM]; // Análogo a nice mas no contexto de virtualização, VM configurada com prioridade reduzida apresenta aumento.
} CPU;
```

Explicando melhor:

- `user`: Tempo gasto executando processos em espaço de usuário (programas normais, fora do kernel). Indica carga real de aplicações, aumento pode sinalizar picos de uso de CPU por aplicações.

- `nice`: Tempo gasto com processos de prioridade reduzida (nice > 0). Mede quanto processamento está sendo cedido para tarefas “menos importantes”. Ajuda a avaliar balanceamento de prioridades.

- `system`: Tempo gasto dentro do kernel, executando chamadas de sistema ([syscalls](https://pt.wikipedia.org/wiki/Chamada_de_sistema)), I/O, alocação de memória, etc. Ajuda a identificar overhead de kernel, alto valor pode indicar gargalos de I/O ou drivers.

- `idle`: Tempo em que a CPU está ociosa (sem tarefas). Representa inatividade total. Útil para saber se a CPU está realmente livre.

- `iowait`: Tempo ocioso esperando respostas de disco ou rede. Alta porcentagem indica gargalos de I/O; CPU parada esperando I/O concluir.

- `irq`: Tempo gasto processando interrupções de hardware (placas, discos, teclados). Útil pra diagnosticar interrupções excessivas de dispositivos. Ex: placa de rede gerando carga alta.

- `softirq`: Tempo gasto com interrupções de software, rotinas do kernel disparadas por eventos assíncronos (ex: TCP/IP). Mostra custo de tratamento de rede e tarefas assíncronas. Pode revelar sobrecarga de pacotes, firewall, etc.

- `steal`: Tempo em que a CPU física estava ocupada por outra VM no mesmo host (virtualização). Em ambientes virtuais, mede contenção de CPU entre VMs, alto valor = host sobrecarregado.

- `guest`: Tempo executando máquinas virtuais guest no host atual. Indica quanto da CPU do host é consumido pelas VMs.

- `guest_nice`: Igual a `nice`, mas dentro do contexto de máquinas virtuais. Ajuda a diferenciar prioridades dentro do [hypervisor](https://www.ibm.com/br-pt/think/topics/hypervisors), útil em observabilidade de infraestrutura virtual.

---

### "O que é `intr`, `ctxt` e `btime`? (`processes` é meio autoexplicativo, mas ainda assim não tive clareza do que significava)"

_Obs.: Esses campos, ainda não utilizo no programa `statreader.c`, mas será adicionado no futuro._

#### • Sobre `intr`:

```
intr 700381 0 0 0 0 0 0 0 0 0 13 ...
```

O primeiro número `700381` indica o total acumulado de interrupções de hardware desde que o sistema foi iniciado. De forma resumida: Os números seguintes correspondem à contagem individual de cada IRQ, na mesma ordem mostrada em `/proc/interrupts`.

O `irq` lá de cima (na linha cpu do `/proc/stat`) mostra quanto tempo de CPU foi gasto executando rotinas de interrupção de hardware, ou seja, tempo de processamento consumido por IRQs.

Já os `irq` da linha `intr` mostram quantas interrupções de hardware aconteceram, não o tempo gasto nelas.

**TL;DR**: `cpu: irq`: quanto tempo a CPU trabalhou com interrupções. `intr`: quantas vezes interrupções ocorreram.

#### • Sobre `ctxt`:

`ctxt` indica o número total de trocas de contexto ([context switches](https://en.wikipedia.org/wiki/Context_switch)) que ocorreram desde que o sistema foi iniciado.

_O que é troca de contexto?_

Resumindo: Toda vez que o kernel pausa um processo para dar tempo de CPU a outro, ele precisa salvar o estado do processo atual e carregar o estado do próximo processo, isso é uma troca de contexto. (Inclusive, o maior exemplo que temos disso é o multitasking, onde o processador alterna muito rapidamente entre processos, dando a impressão que estão acontecendo ao mesmo tempo.)

#### • Sobre `btime`:

É apenas um marco temporal fixo indicando quando o sistema começou a rodar, em [unix epoch](https://pt.wikipedia.org/wiki/Era_Unix). 🙂

#### • Sobre `processes`:

Indica o número total de processos que o kernel já criou desde que o sistema iniciou.

Cada vez que um processo é criado, esse contador incrementa. Ele não diminui quando um processo termina; é um valor cumulativo e não indica quantos processos estão rodando atualmente, apenas quantos foram criados desde o boot.

### "Esses números nas colunas CPU representam o que exatamente?"

Cada valor é um contador cumulativo de jiffies desde o boot. Um [jiffy](https://litux.nl/mirror/kerneldevelopment/0672327201/ch10lev1sec3.html) é uma unidade de tempo do kernel (normalmente 1/100 ou 1/250 de segundo, dependendo do sistema).

### "Como uso isso tudo de forma útil para observar o uso de recursos da máquina?"

_Ainda, honestamente, estou fundamentando isso, mas pesquisando vi algumas possibilidades:_

1. Uso de CPU por categoria

`Stacked area chart`: Mostra a composição do uso de CPU ao longo do tempo. Cada cor = uma categoria (user, system, idle…).

`Bar chart por instantes`: Mostra a porcentagem de cada tipo em momentos específicos.

Serviria para identificar se a CPU está sendo mais ocupada por processos normais (user) ou pelo kernel (system).

2. Uso por núcleo

`Heatmap`: Núcleos no eixo Y, tempo no eixo X, cor = porcentagem de uso.

`Line chart por núcleo`: Cada linha = um núcleo.

Serviria para detectar núcleos mais sobrecarregados e visualizar balanceamento de threads e escalonamento do kernel.

3. Pico e variação de uso

Usar diferenças entre leituras consecutivas (delta jiffies).

`Line chart` do delta para cada categoria ou CPU.

`Histogramas` de delta para medir frequência de altos usos.

Serviria para identificar picos curtos que não aparecem na média e detectar “spikes” de I/O ou interrupções inesperadas.

4. Observabilidade de interrupções e contexto

Usando irq, softirq + contadores de contexto (ctxt).

`Line chart`: Quantidade de interrupções ao longo do tempo.

`Stacked chart`: Hardware vs Software interrupts.

Serviria para medir latência de dispositivos ou carga de rede e ver se há saturação por IRQ ou softirq.

5. Virtualização

Usando guest, guest_nice, steal.

`Line chart` mostrando tempo de CPU “roubado” (steal) ou consumido por VMs.

Serviria para entender performance dentro de VMs e planejar alocação de CPU para containers/VMs.

6. Timestamps

Alinhar todos os dados ao tempo real, criar dashboards históricos.

Serviria para ver tendências de uso ao longo do dia e correlacionar picos de CPU com eventos do sistema.

---

### statreader.c antes x depois

statreader.c antigo (pré sugestões do memreader.c): https://github.com/matheusgb/readers/blob/b4efb4e45477fd9fc73ec9155940cd4bcc3e42e1/statreader.c

statreader.c refatorado: https://github.com/matheusgb/readers/blob/a685106859a114cabc7cc1221d34c978f6588a5b/statreader.c

A nova versão do código traz avanços. A leitura via open() e read() elimina o overhead da stdio (`fopen`, `fgets`).

O tratamento de erros ficou mais robusto, com o uso explícito de `errno` e mensagens padronizadas por meio da função `reporta_erro()`.

A inclusão de timestamps com `clock_gettime()` agrega contexto temporal às leituras, o que é essencial para análise de desempenho, controle e rastreabilidade.

O parser manual implementado com `copia_token()` e `pula_espacos()` remove a dependência de `sscanf`.

O parsing manual e a manipulação direta de ponteiros aumentam a complexidade e o risco de erros sutis, mas honestamente não dá pra fugir disso pra sempre 😅.

Um ponto importante destacado pelo Sanchez é o uso indevido de símbolos reservados como `_POSIX_C_SOURCE`. Identificadores iniciados por sublinhado e letras maiúsculas são reservados pelo padrão C e POSIX, e defini-los manualmente pode alterar o comportamento das headers, habilitando ou desabilitando funções de forma imprevisível, como se "selecionasse versões específicas do header".

Ao definir `_POSIX_C_SOURCE`, pode ser habilitado ou desabilitado funções como `clock_gettime()` ou `pread()`. Então, dependendo de como o símbolo é definido, essas funções podem estar disponíveis ou não.

```c
#define _POSIX_C_SOURCE 199506L
#include <time.h>

struct timespec ts;
clock_gettime(CLOCK_REALTIME, &ts); // ERRO: função não declarada
```

```c
#define _POSIX_C_SOURCE 199309L
#include <time.h>

struct timespec ts;
clock_gettime(CLOCK_REALTIME, &ts); // OK
```

O motivo pelo qual usei foi por conta de um erro estético que o vscode estava apresentando em `CLOCK_REALTIME`, quando adicionei `_POSIX_C_SOURCE` esse erro sumiu. Antes o programa já compilava corretamente, a adição foi desnecessária, e implica a perigos também desnecessários.

---

### Errata - Correções sugeridas por R. Sanchez

### 1. **system**: Tempo gasto dentro do kernel, executando chamadas de sistema (syscalls), I/O, ~~alocação de memória~~, etc.

**Correção**:
O kernel **não realiza alocação de memória** no sentido tradicional (como o `malloc` do espaço de usuário).
O que ele faz é **mapear regiões de memória** por meio de chamadas como `mmap()`, que estabelecem a correspondência entre endereços virtuais e páginas físicas ou arquivos.

Esses mapeamentos podem ser:

- **Anônimos**: usados para alocação dinâmica (sem associação a arquivo), base do heap de processos.
- **Baseados em arquivo**: usados para mapear arquivos inteiros na memória (como executáveis, bibliotecas dinâmicas ou memória compartilhada via `MAP_SHARED`).

Após o `mmap()`, a **gerência efetiva** dessa memória (fragmentação, liberação, realocação etc.) é feita **no espaço de usuário**, por bibliotecas como `libc`, `jemalloc` ou `tcmalloc`.
O kernel apenas garante o isolamento, proteção e paginação do espaço virtual, **sem participar do gerenciamento interno** dessa área.

---

### 2. **softirq**: ~~Mostra custo de tratamento de rede e tarefas assíncronas~~.

**Correção**:
O campo **`softirq`** é **específico para o processamento de rede** e algumas rotinas críticas de baixo nível.
O termo “tarefas assíncronas” é impreciso, pois **o kernel inteiro é estruturado de forma assíncrona**, com múltiplas _worker threads_ internas executando operações em paralelo.

Essas _worker threads_ (como as do _kworker_) são entidades do kernel que **processam filas de tarefas pendentes** — por exemplo, limpeza de caches, escrita assíncrona em disco, ou manipulação de pacotes de rede — sem bloquear o contexto de interrupção que as gerou.
Assim, elas permitem que o kernel **delegue trabalho pesado ou demorado** para execução posterior, fora do caminho crítico da interrupção, mantendo o sistema responsivo e eficiente.
