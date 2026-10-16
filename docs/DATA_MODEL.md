# Dados e integridade

Schema SQLite v1 (`PRAGMA user_version`, `schema_migrations`):

| Tabela | Contrato |
|---|---|
| clients | UUID, nome, telefone com DDI, consentimento, notas, timestamps, deletedAt |
| services | UUID, nome, preço inteiro em centavos, duração inteira em minutos, notas, timestamps |
| materials | UUID, nome, estoque decimal >=0, mínimo nullable, notas, timestamps |
| appointments | UUID, FK client_id, starts_at ISO UTC, status, fuso IANA, snapshot cliente/serviços, total/desconto em centavos, pagamento, série |
| appointment_services | FK agendamento/serviço, posição, snapshot validado de nome, preço, duração e quantidade |
| preferences | linha única validada por Zod; tema, idioma, moeda, formatos, alertas, onboarding, modelo de mensagem |
| reminder_jobs | identificador estável e fingerprint para reconciliar notificações |
| backup_history | horário e tipo de operação; abertura do compartilhamento não prova salvamento externo |
| recovery_snapshot | cópia anterior à última importação, para recuperar uma substituição |

`subtotal=Σ(priceCents×amount)`, `duration=Σ(duration×amount)`, `total=max(0,subtotal−discountCents)`. Serviços arquivados preservam histórico. Excluir definitivamente todos os dados remove também recuperação e histórico de backup, faz checkpoint e VACUUM; não promete apagamento forense de armazenamento flash.

Backup próprio: `{format:"jaqnail",version:1,exportedAt:ISO,data:{clients,services,materials,appointments,preferences}}`. Limite de arquivo 10 MiB; validar esquema, unicidade, FKs e consistência financeira antes da transação. Falha causa rollback. Arquivos não são criptografados pelo app.

Adaptador legado explícito aceita somente o esquema v1 documentado, normaliza preços/total decimal em centavos e rejeita inconsistências. A versão real e todas as variações de exportação AppNail não foram comprovadas; não declarar compatibilidade integral.
