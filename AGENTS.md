# Jaqnail — instruções permanentes aos agentes de programação

Produto: **Jaqnail**, Android, pt-BR. Autor obrigatório em documentação e app: **Desenvolvido por Samuel Sanches**. Repositório: `MukaSanches/Jaqnail`.

1. Implemente software executável em vez de apenas produzir planos. Não anuncie APK/Release que não existam.
2. Use o pacote de referência REA v4 somente para paridade **funcional**; respeite marcas, textos, artes e propriedade intelectual de terceiros. Todas as funções de produto comprovadas devem ter implementação e teste; dependências internas não precisam ser copiadas.
3. Preserve o design Jaqnail definido em `branding/`, com arquitetura Expo/React Native, TypeScript estrito e SQLite transacional, uso offline-first e sem paywall.
4. Nunca abra o catálogo de 26.626 funções ou as 699.745 instruções integralmente no contexto. Pesquise por SQL/ID/nome quando necessário.
5. Mantenha `docs/PARITY_MATRIX.csv` e `docs/RELEASE_REPORT.md` atualizados, apontando evidência, arquivo, teste e status honesto por funcionalidade.
6. Sem botões decorativos, dados simulados em produção, segredos versionados, APK debug publicado como estável ou componentes vazios.
7. Validate typecheck/lint/tests/build e gere APK assinado com keystore persistente; publique a Release somente depois de sucesso comprovado.
8. Em `README.md` e `About`, inclua o crédito **Samuel Sanches**. Screenshots somente da execução verdadeira do app.
9. Trabalhe com commits rastreáveis, preserve arquivos existentes e evite dependências pagas ou não verificadas.