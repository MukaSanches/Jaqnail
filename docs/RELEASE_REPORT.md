# Relatório de entrega — em validação

Alvo: Jaqnail 1.0.0, `com.samuelsanches.jaqnail`, Desenvolvido por Samuel Sanches.

Estado: implementação em andamento; não há release estável publicada nesta etapa.

Verificações executadas: `npm run typecheck` PASS; `npm run lint` PASS; `npm run test:ci` PASS (32 domínio/SQLite/lembretes + 10 interface/integração). Testes usam SQLite real no Node e React Native Testing Library; não equivalem à instalação Android. `expo prebuild --platform android --no-install` PASS. Gradle assembleRelease PASS no GitHub Actions run 38995763208, commit ede304dd. APK interno de teste gerado; smoke Android inicial PASS (instalação, onboarding, agenda e reinício). As correções posteriores exigem novo build. Primeiro erro local foi ausência de JDK 17, corrigida com Temurin verificado por checksum.

Ambiente: Linux x86_64, Node 24.19.0, Expo 55, React Native 0.83.2, Android API 36, Build Tools 36.0.0, NDK 27.1.12297006. Assinatura de teste não é assinatura de distribuição.

Impedimentos de publicação: API GitHub acessível para commits e Actions. Secrets de Actions: GET public-key retorna 403; configuração segura pendente. Keystore persistente criada com autorização do proprietário, fora do repositório; sua guarda externa pelo proprietário permanece necessária. Build local depende de liberação de repo.reactnative.dev, destino de redirecionamento do Maven. Acesso de leitura Git e push dry-run funcionam.

Artefatos e SHA-256 serão registrados somente após geração real. Paridade integral não está comprovada; veja FEATURE_MATRIX e PARITY_MATRIX.

Revisão independente e regressões: conflito em importação, limite UTF-8 de backup simétrico (10 MiB), retenção do arquivo compartilhado por 24 h, âncora estável do lembrete de backup, preço/duração após edição inline e cópia de histórico no mesmo formulário corrigidos. Setup reproduzível executado (npm ci, verificações e prebuild); instruções salvas no rascunho do ambiente.
