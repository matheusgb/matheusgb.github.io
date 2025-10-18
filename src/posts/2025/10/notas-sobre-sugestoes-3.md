---
title: Notas sobre sugestões - Parte 3
date: 2025-10-16
tags: [observabilidade]
---

Parte 3 da análise e síntese das sugestões do Sanchez sobre o memreader.c, e retratando algumas afirmações feitas na Parte 2.

<!-- excerpt -->

Meu código: https://github.com/matheusgb/readers/blob/master/memreader.c

Mudanças sugeridas: https://github.com/rnsanchez/readers/blob/master/memreader.c

### Retratação sobre `open()`

Ao final da parte 2, eu disse:

> E `open()` já é uma função `POSIX` que consulta diretamente o kernel, reduzindo overhead da stdio e pulando o buffering, pegando o estado atual do arquivo **sempre**.

Na verdade, essa parte do “pegando o estado atual do arquivo sempre” ficou errada, e foi um exagero 😅. Nenhuma chamada de sistema, nem mesmo `open()`, consegue garantir que o dado que ela retorna representa o estado atual absoluto do arquivo, porque “estado atual” é uma coisa que simplesmente não existe de forma global no sistema.

Quando disse, eu estava pensando em “atual” no sentido de “sem o buffering da stdio”, mas acabei misturando as camadas. O `open()` realmente pula o buffer da stdio, mas ele ainda depende do kernel e do subsistema de arquivos, e esses, trabalham com caches, lockings e estruturas que não são sincronizadas instantaneamente entre processos e threads.

Então, o máximo que o `open()` faz é pedir ao kernel uma visão consistente daquele instante dentro da linha do tempo do próprio processo. É uma leitura “localmente atual”, não “universalmente atual”. A partir do momento que ele coleta as informações, o mundo já mudou.

No fundo, o erro foi confundir “reduzir camadas intermediárias” com “acessar o estado real do sistema”, quando, na prática, essa noção de “estado real” é fisicamente impossível de capturar.

### Timestamps

Na minha versão, a cada ciclo do loop, eu só imprimia as linhas lidas, sem noção exata do instante em que foram coletadas. O timestamp dá granularidade e permite acompanhar o quão próximo do “tempo real” cada leitura está. Ao mesmo tempo, reforça a ideia de que estamos sempre lidando com uma aproximação: mesmo com timestamp nanosegundo, não temos a consistência absoluta.

### Próximos passos

Agora é por mais a mão na massa. Estou [criando um reader](https://github.com/matheusgb/readers/blob/master/statreader.c) que utiliza do `/proc/stat`, então irei diluir as sugestões do Sanchez nesse projeto.
