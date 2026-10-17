# Arquitetura

Jaqnail é um aplicativo Android independente, desenvolvido por Samuel Sanches. Expo SDK 55 / React Native / TypeScript strict. Sem conta, backend, anúncios ou SDK de analytics.

- `src/domain`: contratos Zod, dinheiro em centavos, intervalos semiabertos, recorrência por horário civil/fuso IANA, CSV e backup.
- `src/data/repository.ts`: SQLite com WAL, chaves estrangeiras, migração v1, transações para agendamentos e restauração. O mesmo repositório roda nos testes sobre SQLite real (`node:sqlite`).
- `src/features`: formulários, agenda, catálogos, estatísticas, preferências, backup e onboarding.
- `src/app`: contexto e pilha tipada. Rotas anteriores continuam montadas para preservar formulários durante seleção/cadastro. Android Back confirma descarte.
- `src/integrations/native.ts`: arquivos temporários de exportação mantidos por 24 horas e limpos no próximo compartilhamento, DocumentPicker, alertas locais e reconciliação idempotente.

Navegação local foi escolhida em vez de Expo Router para reduzir dependências e manter o estado do assistente explicitamente. IDs gerados por `expo-crypto.randomUUID`; nenhum dado demonstrativo em produção. Listas usam FlatList; ainda é necessário medir desempenho com grandes bases em aparelho de baixo custo.

Políticas próprias (D): cancelados não ocupam horário nem entram na receita; uma série conflitante aborta inteira; edição afeta uma ocorrência e cancelamento pode afetar as próximas; exclusão de cadastro é arquivamento, preservando relações/snapshots. Sugestões: 08–21h, 30 minutos, máximo quatro (confirmado seletivamente em F#25672). Recorrência preserva horário civil; horário inexistente por DST é rejeitado.

Limites numéricos próprios estão nos schemas. Não representam limites descobertos no original. A persistência inclui JSON validado por entidade mais colunas/indexes relacionais e `appointment_services`; não depende de AsyncStorage.
