const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

module.exports = function withLocalAndroid(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults.manifest.application[0].$['android:label'] = '${reviveAppLabel}';
    return mod;
  });
  return withAppBuildGradle(config, (mod) => {
    const line = 'apply from: new File(rootDir, "../scripts/android-local.gradle")';
    if (!mod.modResults.contents.includes(line)) mod.modResults.contents += `\n${line}\n`;
    return mod;
  });
};
