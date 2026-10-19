# Cobertura funcional

A fonte auditável é [PARITY_MATRIX.csv](PARITY_MATRIX.csv): 26 telas/componentes e 448 handlers, sem omitir as entradas incertas. `implemented` indica código conectado; `verified` exige teste do comportamento específico; `inferred` identifica associação heurística e `blocked` exige mais evidência. Uma linha mapeada não significa paridade comprovada.

Implementados: onboarding; cadastros e pesquisa; estoque e estados; agenda dia/semana; assistente cliente/serviços/confirmação; quantidades, desconto, pagamento e notas; conflito, sugestões, recorrência; detalhes, histórico, cópia, cancelamento/reativação/exclusão; estatísticas anual/mensal e privacidade; temas, formatos, moeda; backup próprio com prévia/transação/recuperação; adaptador legado restrito; CSV; notificações locais; WhatsApp consentido; compartilhamento e avaliação via GitHub; créditos e privacidade.

Recursos PRO comerciais são substituídos por acesso gratuito, sem compras/restauração de compras, anúncios ou telemetria. Funções internas de bibliotecas não são metas de reprodução.

Pendências: inglês completo; revisão dinâmica de handlers anônimos; interoperabilidade com backup real da referência; comparação do APK original; TalkBack/manual em múltiplas telas e dispositivos; benchmarks de grande volume; validação de alarmes/reboot; assinatura de distribuição e release condicionadas à evidência. A interface é original, sem alegação pixel-perfect.

## Melhorias do candidato atualizado

Calendário mensal com indicadores por dia, faixa semanal, linha do tempo, agendamento pelo horário livre, resumo diário compacto; histórico/atalho de agendamento no cadastro da cliente; filtros de estoque baixo/esgotado; gráfico mensal; backup direto em pasta Android com verificação após escrita; navegação com ícones originais e avisos compactos. Testes: 38 domínio/SQLite/calendário + 16 UI/integração; novo smoke Android cobre cadastros, estoque, agenda, cancelamento/reativação, estatísticas e persistência. O resultado Android será registrado após a execução, sem antecipar aprovação.
