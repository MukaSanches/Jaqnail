# Relatório de entrega — em validação

Alvo: Jaqnail 1.0.0, `com.samuelsanches.jaqnail`, Desenvolvido por Samuel Sanches.

Estado: implementação em andamento; não há release estável publicada nesta etapa.

Verificações executadas: `npm run typecheck` PASS; `npm run lint` PASS; `npm run test:ci` PASS (25 domínio/SQLite + 5 interface). Testes usam SQLite real no Node e React Native Testing Library; não equivalem à instalação Android. `expo prebuild --platform android --no-install` PASS. Gradle está sendo validado; primeiro erro foi ausência de JDK 17, corrigida com instalação de Temurin verificada por checksum.

Ambiente: Linux x86_64, Node 24.19.0, Expo 55, React Native 0.83.2, Android API 36, Build Tools 36.0.0, NDK 27.1.12297006. Assinatura de teste não é assinatura de distribuição.

Impedimentos de publicação: API GitHub bloqueada pelo proxy (403 CONNECT); rascunho de rede inclui api.github.com/uploads.github.com, aguardando aplicação pela interface. Nenhum keystore persistente de release ou seus secrets foi encontrado. Não foi gerada chave descartável como identidade de produção. Acesso de leitura Git e push dry-run funcionam.

Artefatos e SHA-256 serão registrados somente após geração real. Paridade integral não está comprovada; veja FEATURE_MATRIX e PARITY_MATRIX.
