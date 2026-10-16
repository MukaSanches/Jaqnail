# Assinatura e publicação

Uma instalação Android só recebe atualizações do mesmo pacote assinadas pela mesma chave. Nunca promova a chave debug do Expo como chave de produção.

Secrets exigidos pelo workflow de release: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. O proprietário deve manter a keystore privada e sua cópia de recuperação fora do Git. Não envie senhas pelo chat. Esses secrets são do GitHub Actions, não segredos de proxy HTTP.

Se ainda não existe uma chave, gere-a uma única vez em máquina/local seguro sob controle do proprietário, usando `keytool -genkeypair -keystore jaqnail-release.jks -alias jaqnail -keyalg RSA -keysize 3072 -validity 10000`; o comando pede senhas interativamente. Configure os quatro secrets pela interface segura do GitHub. Faça backup cifrado da chave e das senhas separadamente.

A automação injeta a assinatura apenas no build de release e deve falhar se qualquer requisito estiver ausente. Antes de publicar: conferir versão/tag, tests/typecheck/lint, assinatura via apksigner, instalação/smoke do APK, hash SHA-256 e aceite documentado. Criar tag estável somente após os gates reais; não usar tag para descobrir se o app funciona.
