# Relatório de entrega — versão experimental

**Desenvolvido por Samuel Sanches.** Pacote `com.samuelsanches.jaqnail`, versão interna 1.0.0, Android 8+; ABIs arm64-v8a e x86_64.

- [APK de teste](https://github.com/MukaSanches/Jaqnail/releases/download/v1.0.0-test.1/Jaqnail-v1.0.0-test.1.apk)
- [Release experimental v1.0.0-test.1](https://github.com/MukaSanches/Jaqnail/releases/tag/v1.0.0-test.1)
- [Commit do APK: f89fbbb88b2e6c6c53a3963174f4ff29238dbe3d](https://github.com/MukaSanches/Jaqnail/commit/f89fbbb88b2e6c6c53a3963174f4ff29238dbe3d)
- [Execução completa do CI](https://github.com/MukaSanches/Jaqnail/actions/runs/38996389955)

SHA-256 do APK: `cb6d4a3de4505a93847b76e1584f9a3e8e874638f6aff33438513bbcebca357f`. Tamanho: 44.304.507 bytes. SHA256SUMS.txt e evidências Android estão anexados à Release.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | 32 testes PASS, 0 falhas |
| `npm run test:ui` | 10 testes PASS, 0 falhas |
| `python3 scripts/check_coverage.py` | 474 entradas, 26 telas/componentes e 448 handlers contabilizados |
| `expo prebuild --platform android --no-install` | PASS |
| Gradle `:app:assembleRelease`, duas ABIs | PASS, 5m04s no CI |
| Android API 35, `scripts/android_smoke.py` | PASS: instala, abre, conclui onboarding, abre agenda, cadastra cliente e preserva cadastro/onboarding após reiniciar o processo |
| `apksigner verify --verbose --print-certs` | PASS, esquema v2, certificado **Android Debug — somente teste** |
| SHA-256 após download | Conferido com o arquivo publicado |

Ambiente CI: Ubuntu 24.04, Node 24.19.0, Temurin 17, Expo 55, React Native 0.83.2, API/build tools 36, NDK 27.1.12297006. APK standalone: não requer Metro ou Expo Go. Capturas em [screenshots](screenshots/) são da execução verdadeira. Testes de interface usam React Native Testing Library e SQLite real no Node; integrações nativas simuladas nesse nível não substituem ensaios no aparelho.

Regressões corrigidas e testadas: conflito na importação; limite de backup simétrico por bytes UTF-8 (10 MiB); arquivo compartilhado retido por 24 h; âncora estável do lembrete de backup; preço/duração após edição inline; cópia do histórico no mesmo formulário; restauração com prévia e recuperação; cancelamento, reativação e desfazer exclusão.

## Pendências e impedimentos

**Não foi publicada v1.0.0 estável.** A chave privada criada na sessão anterior ficou indisponível após recriação do ambiente em 19/10; nenhum APK estável foi publicado com ela. A API `/actions/secrets/public-key` continua respondendo 403. É necessário recuperar ou estabelecer a identidade de distribuição com guarda externa segura; o script e workflow de assinatura estão prontos. Esta assinatura de teste não assegura atualização compatível com a futura chave: exporte backup antes de trocar de instalação.

Paridade integral e superioridade de desempenho não comprovadas. Pendentes: inglês completo, handlers anônimos/ambíguos, backup real da referência, alarmes após reboot, TalkBack e múltiplos aparelhos, validação nativa completa de compartilhamento/seleção de arquivos/WhatsApp, benchmarks Android de grande volume. Consulte [matriz rastreável](PARITY_MATRIX.csv) e [cobertura funcional](FEATURE_MATRIX.md). Nenhum dado sensível ou artefato privado de assinatura foi publicado.

O build Android foi validado no GitHub; o ambiente local recriado não retém o JDK/SDK instalados anteriormente. O setup de JavaScript é reproduzível pelo lockfile. Os requisitos de rede e instruções de inicialização foram salvos no rascunho do ambiente; salvar o rascunho não publica nem aplica sua configuração automaticamente.

## Candidato com agenda reformulada — em validação

O código após a versão experimental adiciona calendário e timeline, perfil da cliente, filtros de estoque, gráfico mensal e backup direto em pasta. Typecheck/lint e **54 testes (38 + 16)** passaram localmente. Android versionCode incrementado para 2. O CI procura os quatro secrets do proprietário e usa assinatura persistente quando completos; não promove assinatura debug a estável. O APK publicado acima continua sendo o anterior até o próximo resultado de build/aceite.

Revisão do candidato corrigiu duas regressões com testes: datas sem meia-noite por horário de verão não derrubam a agenda; fechar a busca remove o filtro global que ficaria invisível.
