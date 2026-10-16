#!/usr/bin/env python3
"""Apply CI release signing to a Groovy Expo android/app/build.gradle safely."""
import pathlib, re, sys
path = pathlib.Path(sys.argv[1]); src = path.read_text()
needle = 'signingConfigs {'
if src.count(needle) != 1: raise SystemExit('Unexpected signingConfigs structure; inspect generated Gradle file')
insert = '''signingConfigs {
        jaqnailRelease {
            storeFile file(System.getenv('JAQNAIL_KEYSTORE_FILE'))
            storePassword System.getenv('JAQNAIL_KEYSTORE_PASSWORD')
            keyAlias System.getenv('JAQNAIL_KEY_ALIAS')
            keyPassword System.getenv('JAQNAIL_KEY_PASSWORD')
        }
'''
src = src.replace(needle, insert, 1)
# Expo generated Gradle script normally uses signingConfigs.debug in both debug and release buildTypes.
needle = 'signingConfig signingConfigs.debug'
if src.count(needle) < 2: raise SystemExit('Release signing placeholder not found or changed')
idx = src.rfind(needle)
src = src[:idx] + 'signingConfig signingConfigs.jaqnailRelease' + src[idx + len(needle):]
path.write_text(src)
print('Jaqnail signing configuration inserted; secrets read only from CI environment')