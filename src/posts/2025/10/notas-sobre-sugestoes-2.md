---
title: Notas sobre sugestões - Parte 2
date: 2025-10-11
---

Parte 2 da análise e síntese das sugestões do Sanchez sobre o memreader.c.

<!-- excerpt -->

Meu código: https://github.com/matheusgb/readers/blob/master/memreader.c

Mudanças sugeridas: https://github.com/rnsanchez/readers/blob/master/memreader.c

### Conhecendo um pouco sobre `ELF` e seções de memória `.BSS`, `.DATA` e `.RODATA`

Após a compilação é gerado um arquivo `ELF` em disco (binário). Esse arquivo contém descrições das seções de memória `.BSS`, `.DATA`, `.RODATA` e outras.

`.BSS`: Armazena dados globais estáticos não inicializados.
`.DATA`: Armazena dados globais inicializados.
`.RODATA`: Armazena dados globais de somente leitura (constantes).

Existem algumas outras boas seções de memória, mas não irei me aprofundar por enquanto.

Essas seções são descritas no `ELF`, e com o processo em execução (na RAM) as regiões são mapeadas a partir das seções.

Com o utilitário `nm` conseguimos checar no binário onde os símbolos estão alocados

```
$ nm memreader
0000000000402170 r __abi_tag
0000000000404058 B __bss_start   <-- .BSS, super global (maiúsculo)
0000000000404060 b completed.0
0000000000404048 D __data_start   <-- .DATA, também super global (maiúsculo)
0000000000404048 W data_start
00000000004011e0 t deregister_tm_clones
00000000004011d0 T _dl_relocate_static_pie
0000000000401250 t __do_global_dtors_aux
0000000000403de0 d __do_global_dtors_aux_fini_array_entry   <-- .DATA, esse já mais local
0000000000404050 D __dso_handle
0000000000403de8 d _DYNAMIC
0000000000404058 D _edata
0000000000404068 B _end   <-- .BSS
                 U fclose@GLIBC_2.2.5
                 U fflush@GLIBC_2.2.5
                 U fgets@GLIBC_2.2.5
000000000040129c T _fini
                 U fopen@GLIBC_2.2.5
0000000000401280 t frame_dummy
0000000000403dd8 d __frame_dummy_init_array_entry
0000000000402128 r __FRAME_END__
0000000000403fe8 d _GLOBAL_OFFSET_TABLE_
                 w __gmon_start__
0000000000402038 r __GNU_EH_FRAME_HDR
0000000000401290 T handle_sigint
0000000000401000 T _init
0000000000402000 R _IO_stdin_used
                 w _ITM_deregisterTMCloneTable
                 w _ITM_registerTMCloneTable
                 U __libc_start_main@GLIBC_2.34
00000000004010c0 T main
                 U printf@GLIBC_2.2.5
                 U puts@GLIBC_2.2.5
0000000000401210 t register_tm_clones
                 U signal@GLIBC_2.2.5
                 U sleep@GLIBC_2.2.5
00000000004011a0 T _start
0000000000404058 B stdout@GLIBC_2.2.5
0000000000404064 B stop   <-- .BSS tua variável!!
                 U strcspn@GLIBC_2.2.5
0000000000404058 D __TMC_END__
```

As letras identificam tipos e visibilidade dos símbolos, letra maiúscula é global, minúscula local:
`B/b`: `.BSS`
`D/d`: `.DATA`
`R/r`: `.RODATA`

Outro utilitário interessante é o `objdump`.
Exemplo:

```
$ objdump -h memreader

memreader:     file format elf64-x86-64

Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .interp       0000001c  0000000000400318  0000000000400318  00000318  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  1 .hash         00000050  0000000000400338  0000000000400338  00000338  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  2 .gnu.hash     00000024  0000000000400388  0000000000400388  00000388  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  3 .dynsym       00000168  00000000004003b0  00000000004003b0  000003b0  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .dynstr       000000bb  0000000000400518  0000000000400518  00000518  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  5 .gnu.version  0000001e  00000000004005d4  00000000004005d4  000005d4  2**1
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  6 .gnu.version_r 00000030  00000000004005f8  00000000004005f8  000005f8  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  7 .rela.dyn     00000078  0000000000400628  0000000000400628  00000628  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  8 .rela.plt     000000d8  00000000004006a0  00000000004006a0  000006a0  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  9 .init         00000017  0000000000401000  0000000000401000  00001000  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
 10 .plt          000000a0  0000000000401020  0000000000401020  00001020  2**4
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
 11 .text         000001db  00000000004010c0  00000000004010c0  000010c0  2**4
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
 12 .fini         00000009  000000000040129c  000000000040129c  0000129c  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
 13 .rodata       00000035  0000000000402000  0000000000402000  00002000  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
 14 .eh_frame_hdr 00000034  0000000000402038  0000000000402038  00002038  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
 15 .eh_frame     000000bc  0000000000402070  0000000000402070  00002070  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
 16 .note.gnu.property 00000040  0000000000402130  0000000000402130  00002130  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
 17 .note.ABI-tag 00000020  0000000000402170  0000000000402170  00002170  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
 18 .init_array   00000008  0000000000403dd8  0000000000403dd8  00002dd8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 19 .fini_array   00000008  0000000000403de0  0000000000403de0  00002de0  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 20 .dynamic      000001e0  0000000000403de8  0000000000403de8  00002de8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 21 .got          00000020  0000000000403fc8  0000000000403fc8  00002fc8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 22 .got.plt      00000060  0000000000403fe8  0000000000403fe8  00002fe8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 23 .data         00000010  0000000000404048  0000000000404048  00003048  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 24 .bss          00000010  0000000000404058  0000000000404058  00003058  2**3
                  ALLOC
 25 .comment      00000024  0000000000000000  0000000000000000  00003058  2**0
                  CONTENTS, READONLY
 26 .debug_aranges 00000120  0000000000000000  0000000000000000  00003080  2**4
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 27 .debug_info   000002f6  0000000000000000  0000000000000000  000031a0  2**0
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 28 .debug_abbrev 00000179  0000000000000000  0000000000000000  00003496  2**0
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 29 .debug_line   00000204  0000000000000000  0000000000000000  0000360f  2**0
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 30 .debug_str    000003ba  0000000000000000  0000000000000000  00003813  2**0
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 31 .debug_line_str 000000ca  0000000000000000  0000000000000000  00003bcd  2**0
                  CONTENTS, READONLY, DEBUGGING, OCTETS
 32 .debug_rnglists 00000042  0000000000000000  0000000000000000  00003c97  2**0
```

Mostra onde cada seção estará na memória (VMA/LMA) e onde está no binário (File off).

**TL;DR**: `objdump` é para saber onde fica cada seção, e `nm` para ver onde cada função/variável reside.

> `objdump -h` é o **mapa da cidade** (as “regiões” de código e dados);
> `nm` é a **lista dos habitantes** (as funções e variáveis, e onde moram nesse mapa).

---

### Loop principal

```c
void handle_sigint(int)
{
	if (stop)
		fprintf(stderr, "tratador de sinais ja invocado\n");
	else
		stop = 1;
}

int main(int, char **)
{
	const struct timespec delay = {1, 0}; // segundos, nanosegundos
	struct timespec sobra = {
		0,
	};

	signal(SIGINT, handle_sigint);

	while (nanosleep(&delay, &sobra) == 0)
		(void)chama_probe();

	printf("\nPrograma finalizado.\n");

	...
```

**Fluxo resumido:**
`nanosleep()` é uma chamada de sistema bloqueante, o sistema dorme conforme o parâmetros passados. O primeiro parametro define o "tempo de sono", e o segundo é populado com o tempo faltante do sono caso seja interrompido.
Quando o programa recebe um sinal como `SIGINT`, o sono da thread é interrompido, `handle_sigint()` é chamado através da pilha especial de execução e o programa volta pro seu fluxo de execução normal. Como `nanosleep()` foi interrompido, é retornado pela função o valor `-1`, e a condição do while passa a ser falsa, não executando novamente o loop e printando `printf("\nPrograma finalizado.\n");`.

`handle_sigint()` nesse contexto só tem o intuito de servir como flag para evitar que múltiplos sinais acionados de forma deliberada sejam considerados.

---

### Observação breve sobre padrão POSIX

`C` tem algumas funções que só tem compatibilidade com sistemas `unix-like` (Linux, MacOS e afins).
`nanosleep()` é uma dessas funções definidas pelo padrão `POSIX`.

---

### `fopen` vs `open`

Pesquisando brevemente sobre `fopen()` vi que ele utiliza de um buffer intermediário que acaba custando um espaço um pouco maior na memória para armazenar o que foi consultado do arquivo. Isso reduz as consultas ao arquivo em si, mas concluí que isso poderia até comprometer a fidelidade do estado atual do arquivo. O que me garante que o buffer não está desatualizado?

E `open()` já é uma função `POSIX` que consulta diretamente o kernel, reduzindo overhead da stdio e pulando o buffering, pegando o estado atual do arquivo **sempre**.
