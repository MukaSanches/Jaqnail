Versão experimental de **Jaqnail**, desenvolvido por **Samuel Sanches**, exclusivamente para testes. **Não é a release estável v1.0.0.**

APK standalone Android 8+ (arm64-v8a e x86_64), compilado em modo release e assinado com chave de TESTE Android Debug. A futura versão com assinatura de distribuição poderá exigir reinstalação: exporte o backup antes.

Código: `f89fbbb88b2e6c6c53a3963174f4ff29238dbe3d`.
Build e testes: https://github.com/MukaSanches/Jaqnail/actions/runs/38996389955

Validação executada: TypeScript, ESLint, 32 testes de domínio/SQLite/lembretes, 10 testes de interface/integração, build Android e smoke em emulador API 35. Instalação, onboarding, agenda e cliente persistido após reiniciar passaram. Certificado e SHA-256 conferidos; capturas reais no pacote de evidências.

Implementados: clientes, serviços, estoque, agenda dia/semana, conflitos, recorrência, detalhes, cópia, estatísticas, preferências, backup/recuperação, CSV, notificações e WhatsApp consentido. Todos gratuitos.

Limitações: inglês parcial; equivalência dinâmica integral com AppNail não atestada; importação legada restrita; alarmes após reboot, TalkBack e integrações em aparelhos reais ainda precisam de validação. As 474 entradas da matriz estão mapeadas, sem alegação de paridade total.

A assinatura persistente de distribuição permanece bloqueada: os arquivos privados da sessão anterior não sobreviveram à recriação do ambiente; a API de secrets do GitHub retorna 403. Nenhuma versão estável foi publicada com essa chave. Não confundir esta chave de teste com a identidade futura de distribuição.

Baixe `Jaqnail-v1.0.0-test.1.apk`, permita a instalação por esse navegador no Android e abra o arquivo. O aplicativo funciona offline e não exige Metro, Expo Go ou login.
