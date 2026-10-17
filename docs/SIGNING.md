# Assinatura e publicação

Uma instalação Android só recebe atualizações do mesmo pacote assinadas pela mesma chave. Nunca promova a chave debug do Expo como chave de produção.

Secrets exigidos pelo workflow de release: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. O proprietário deve manter a keystore privada e sua cópia de recuperação fora do Git. Não envie senhas pelo chat. Esses secrets são do GitHub Actions, não segredos de proxy HTTP.

Se ainda não existe uma chave, gere-a uma única vez em máquina/local seguro sob controle do proprietário, usando `keytool -genkeypair -keystore jaqnail-release.jks -alias jaqnail -keyalg RSA -keysize 3072 -validity 10000`; o comando pede senhas interativamente. Configure os quatro secrets pela interface segura do GitHub. Faça backup cifrado da chave e das senhas separadamente.

A automação injeta a assinatura apenas no build de release e deve falhar se qualquer requisito estiver ausente. Antes de publicar: conferir versão/tag, tests/typecheck/lint, assinatura via apksigner, instalação/smoke do APK, hash SHA-256 e aceite documentado. Criar tag estável somente após os gates reais; não usar tag para descobrir se o app funciona.

## Chave criada nesta sessão

Por autorização expressa do proprietário, foi criada uma identidade RSA 3072 / PKCS12, alias `jaqnail`, com validade de 10.000 dias e titular Samuel Sanches. A keystore e o arquivo de credenciais estão **fora do repositório**, em `/workspace/private/jaqnail-signing/`, diretório `0700`, arquivos `0600`. Nenhum valor secreto foi versionado ou exibido em logs.

Antes de encerrar o ambiente, o proprietário deve guardar a keystore em backup privado cifrado e a senha em gerenciador de senhas, separadamente. A existência no workspace não substitui uma cópia externa recuperável. Não gere outra chave para atualizar este pacote. O arquivo `credentials.json` é secreto e nunca deve ir ao GitHub como artifact, commit ou Release.

A integração GitHub desta sessão pode enviar commits, mas `GET /actions/secrets/public-key` retorna 403; portanto os secrets de Actions ainda precisam ser configurados por alguém com essa capacidade. A assinatura local pode ser feita com `scripts/sign_apk.py`, que usa variáveis de processo para as senhas e grava apenas certificado público/checksum no destino.
