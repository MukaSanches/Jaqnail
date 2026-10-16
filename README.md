<p align="center"><img src="branding/jaqnail-logo.svg" alt="Jaqnail" width="480" /></p>

# Jaqnail

Agenda e gestão para manicures e nail designers. **Desenvolvido por Samuel Sanches.** Android, offline, sem login e sem recursos pagos.

> **Estado: v1.0.0 em desenvolvimento e validação.** Não há APK estável anunciado. Consulte o [relatório real](docs/RELEASE_REPORT.md) antes de instalar qualquer artefato de teste.

[Releases e downloads publicados](https://github.com/MukaSanches/Jaqnail/releases) · [Cobertura rastreável](docs/PARITY_MATRIX.csv) · [Guia de uso](docs/USER_GUIDE_PTBR.md) · [Privacidade](docs/PRIVACY.md)

![Identidade conceitual — não é captura do aplicativo](branding/jaqnail-banner.svg)

## Implementação

- Cadastros de clientes, serviços e materiais; busca, edição, arquivamento e estoque.
- Agenda diária/semanal; assistente com múltiplos serviços, quantidades, descontos e pagamento.
- Conflitos, sugestões, recorrência semanal, cópia, cancelamento e reativação.
- Estatísticas, privacidade financeira, temas claro/escuro, preferências e formatos.
- SQLite transacional, backup com prévia/rollback/recuperação, exportações CSV.
- Alertas locais opcionais; WhatsApp com consentimento e prévia, sem envio automático.

As funcionalidades têm graus diferentes de validação. Os testes executados e limitações estão no relatório. Inglês é parcial; equivalência dinâmica integral com a referência não foi atestada.

## Desenvolvimento

Node 24.x, JDK 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006.

```sh
npm ci
npm run typecheck
npm run lint
npm run test:ci
npm run prebuild
cd android
./gradlew :app:assembleDebug --no-daemon
```

Para executar: `npm start` ou `npm run android` com emulador/aparelho. O projeto nativo é gerado pelo Expo; fontes/lockfile e configuração são versionados. A chave debug gerada pelo template serve apenas para testes. Release requer os quatro secrets descritos em [assinatura](docs/SIGNING.md), validação e evidências do commit.

## Documentação

[Arquitetura](docs/ARCHITECTURE.md) · [Modelo de dados](docs/DATA_MODEL.md) · [Funcionalidades e lacunas](docs/FEATURE_MATRIX.md) · [Plano operacional](docs/IMPLEMENTATION_PLAN.md).

Não foram incorporados código proprietário, artes, marcas ou credenciais da referência. Nenhuma licença de distribuição de código foi escolhida em nome do proprietário.
