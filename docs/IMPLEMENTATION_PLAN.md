# Jaqnail 1.0.0 — execução

Contrato: `docs/PROMPT_MESTRE_CODEX_ASTRA.md` e dossiê v4 fornecido pelo proprietário. Referência privada mantida fora do Git; não incorporar código/arte/credenciais do AppNail.

Arquitetura: Expo SDK 55, React Native, TypeScript strict. Domínio puro + repositório SQLite transacional + telas por feature. Dados locais; preços em centavos; snapshots históricos; séries atômicas; importação validada com prévia e recuperação. Navegação tipada em pilha local (Android Back integrado), sem backend/login/pagamentos. Recursos comerciais substituídos por acesso gratuito.

- [ ] Fundamentos: versões fixas, identidade, prebuild e compilação Android mínima.
- [ ] Domínio e dados: testes de cálculos, intervalos, timezone/DST, recorrência, estoque, CRUD, migrações, backups/rollback; implementar interfaces em `src/domain` e `src/data`.
- [ ] Interface: onboarding; catálogos; agenda e assistente; detalhes/histórico; estatísticas; preferências e backup; testes de fluxos React Native.
- [ ] Integrações: notificações contextuais, WhatsApp com prévia, arquivos/CSV, compartilhamento. Sem envio automático.
- [ ] Qualidade: typecheck, lint, testes, bundle, APK, smoke Android se disponível; registrar limites sem alegação de paridade integral.
- [ ] Entrega: matriz 26 telas + 448 handlers classificados; documentação; commits; release somente com assinatura persistente e critérios reais atendidos.

Riscos de revisão e testes: números inválidos/overflow; DST inexistente; conflito em ocorrência futura; importação malformada/referências órfãs; exclusão e restauração com histórico. Limites próprios explícitos: nomes 2–120 caracteres, notas 2000, duração 1–1440 minutos, quantidades 1–100, repetição até 52 semanas, backup até 10 MiB. Não são atribuídos ao original.
