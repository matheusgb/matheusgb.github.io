---
title: Notas sobre sugestões - Parte 1
date: 2025-10-10
# published: false
---

Parte 1 da análise e síntese das sugestões do Sanchez sobre o memreader.c.

<!-- excerpt -->

Meu código: https://github.com/matheusgb/readers/blob/master/memreader.c
Mudanças sugeridas: https://github.com/rnsanchez/readers/blob/master/memreader.c

### Entendendo e comparando o uso de static e volatile em `sig_atomic_t  stop`.

`volatile`: A proposta inicial era lidar com sinais como `Ctrl+C` de forma segura, ~~mas a essa altura acho que nem faria sentido, tendo em vista que `Ctrl+C` interrompe o programa de qualquer forma~~. A linha de raciocínio era indicar ao compilador que a variável poderia ser modificada "a qualquer momento", então deveria ser lida antes de qualquer operação, evitando um possível efeito colateral de otimização onde o loop poderia nunca perceber a mudança feita pelo handler de sinal e rodar infinito.
s
Esse cenário é irreal, creio que seria útil para cenários onde há duas threads ou mais que compartilham a mesma memória. Algo como:

```c
pthread_create(&t, NULL, worker, NULL);
```

Onde a thread `worker` a cada `x` segundos mudaria `stop` para `1`.

Caso a variável fosse declarado algo como `int stop = 0` a thread `main` nunca veria a alteração do `worker` para `1`.

`static`: Simplesmente melhor que volatile, já que toda essa linha de raciocínio acima é inválida. De quebra, variáveis globais são armazenadas na seção [`BSS`](https://www.geeksforgeeks.org/c/memory-layout-of-c-program/) do binário. Essa seção é uma região de memória que o SO zera quando o programa é carregado. Remove a necessidade de atribuir `= 0`.

---

### Conhecendo `forward function declaration`.

Resolve um problema que já esbarrei a um tempo atrás 😅. Em outras linguagens, como por exemplo, GoLang, o código não é tão estritamente lido de "cima para baixo" como em C.

Em C se for feito algo como:

```c
int main() {
    diga_ola();
    return 0;
}

void diga_ola(void) {
    printf("Oi\n");
}
```

Dá erro 🤪.

Com `forward declaration` isso não acontece:

```c
#include <stdio.h>

// forward declaration
void diga_ola(void);

int main() {
    diga_ola();
    return 0;
}

void diga_ola(void) {
    printf("Olá, mundo!\n");
}
```

---

### Possíveis problemáticas do handler de sinal

- Signal handler é chamado de forma assíncrona e executa em uma “pilha especial”, interrompendo a pilha principal **em qualquer ponto**. Quando o handler termina, a execução da pilha principal retoma exatamente do ponto em que foi interrompida.

- Sinais podem ser enfileirados de forma deliberada caso tenha algum maníaco apertando, por exemplo, `Ctrl+C` repetidamente. Casos críticos não tratados causam mal funcionamento.

---

### Parâmetros arbitrários

Aparentemente compiladores modernos (GCC/Clang) ainda permitem isso:

```c
int f();  // parâmetros arbitrários
f();      // válido
f(1);     // válido
f(1, 2);  // válido
```

Emitem um warning, mas não evita do programa ser compilado. Para a `main` não emite nem warning, mas não conseguimos acessar os valores passados nos parâmetros setados por default `(int argc, char *argv[], char *envp[])`
