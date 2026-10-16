<div align="center">

<img src="branding/jaqnail-logo.svg" alt="Jaqnail — beleza, agenda e gestão" width="520" />

<img src="branding/jaqnail-banner.svg" alt="Jaqnail: sua agenda, seu talento" width="100%" />

### A agenda que valoriza o seu talento
**Um aplicativo Android de organização profissional para manicures e nail designers.**

[![Android CI](https://github.com/MukaSanches/Jaqnail/actions/workflows/android-ci.yml/badge.svg)](https://github.com/MukaSanches/Jaqnail/actions/workflows/android-ci.yml)
[![GitHub Releases](https://img.shields.io/github/v/release/MukaSanches/Jaqnail?display_name=tag&label=vers%C3%A3o)](https://github.com/MukaSanches/Jaqnail/releases)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-6c455d)

[**📥 VER RELEASES E BAIXAR APK**](https://github.com/MukaSanches/Jaqnail/releases) · [Funcionalidades](#funcionalidades-planejadas) · [Como contribuir](#desenvolvimento)

> **Status:** repositório em preparação. Nenhum APK de produção foi publicado ainda. Assim que a versão 1.0.0 for compilada, testada e assinada, o download aparecerá em **Releases**.

</div>

---

## O que é o Jaqnail?

O **Jaqnail** é um aplicativo de gestão para profissionais de unhas, criado para simplificar a agenda e dar visibilidade ao dia a dia do negócio. O projeto tem identidade visual própria, foco em uso offline, rapidez e recursos essenciais gratuitos.

### Funcionalidades planejadas

| Área | Planejamento para a v1 |
|---|---|
| **Agenda** | Visualização diária e semanal, calendário, criação e edição de horários, conflito e sugestão de encaixes. |
| **Clientes** | Cadastro, busca, histórico de atendimentos e integração com WhatsApp. |
| **Serviços** | Catálogo de serviços, preços, duração e múltiplos serviços por horário. |
| **Materiais** | Controle de estoque, estoque mínimo e alertas visuais. |
| **Financeiro** | Resumos de faturamento e estatísticas por mês e ano. |
| **Rotina** | Agendamentos recorrentes, duplicação, notificações e preferências. |
| **Seus dados** | Uso offline, exportação/importação de backup e proteção contra perda acidental. |
| **Experiência** | Tema claro/escuro, pt-BR, interface responsiva e acessível. |

As funcionalidades acima descrevem o **escopo previsto**, não uma entrega já validada. O status e os testes reais serão registrados em `docs/RELEASE_REPORT.md` quando houver uma versão publicável.

## Baixar e instalar

1. Acesse **[Releases](https://github.com/MukaSanches/Jaqnail/releases)**.
2. Quando houver uma versão publicada, abra a Release mais recente e baixe o arquivo `Jaqnail-vX.Y.Z.apk` na seção **Assets**.
3. No Android, abra o APK e autorize a instalação dessa origem, se necessário.
4. Confira o `SHA256SUMS.txt` disponibilizado junto ao instalador.

**Não instale APKs de fontes desconhecidas que se apresentem como Jaqnail.** A fonte oficial de distribuição deste projeto é este repositório.

## Identidade visual

A marca usa **ameixa profunda, rosé, creme e dourado fosco**, com monograma de unha estilizada. Os vetores autorais estão em [`branding/`](branding/); as ilustrações conceituais não devem ser confundidas com screenshots de aplicativo em execução.

## Desenvolvimento

Stack planejada: React Native, Expo, TypeScript e SQLite local, com builds Android por GitHub Actions. O projeto terá auditoria de acessibilidade, testes automatizados e Releases assinadas antes da distribuição estável. Contribuições devem respeitar os padrões descritos em [`AGENTS.md`](AGENTS.md).

## Autoria

**Desenvolvido por Samuel Sanches**  
Projeto Jaqnail · [GitHub de Samuel Sanches](https://github.com/MukaSanches)

> Jaqnail é um produto independente. Não possui vínculo ou afiliação com o aplicativo AppNail. Referências externas de engenharia reversa servem ao estudo de funcionalidades, sem licença para incorporar marcas, imagens ou códigos proprietários de terceiros.

**Licenciamento:** a licença de distribuição do código será definida pelo titular do repositório antes da abertura de contribuições externas.