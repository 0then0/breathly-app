import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  createAndroidRelease,
  formatGitHubOutputs,
  validateReleaseConfig,
  verifyAndroidArtifact,
} from "./create-android-release.mjs";

const appConfig = JSON.parse(fs.readFileSync(new URL("../app.json", import.meta.url), "utf8"));
appConfig.expo.extra = { eas: { projectId: "test-project" } };
const easConfig = JSON.parse(fs.readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const commitSha = "a".repeat(40);
const options = { releaseType: "prerelease", commitSha };
const build = {
  status: "FINISHED",
  platform: "ANDROID",
  buildProfile: "preview",
  appVersion: appConfig.expo.version,
  appBuildVersion: "2",
  gitCommitHash: commitSha,
  project: { id: appConfig.expo.extra.eas.projectId },
  artifacts: { applicationArchiveUrl: "https://example.test/Breathly.apk?signature=abc" },
};

test("repository release config selects an explicit RC and remote APK versioning", () => {
  assert.equal(validateReleaseConfig(appConfig, easConfig, "prerelease"), "2.3.0-rc.1");
  assert.throws(() => validateReleaseConfig(appConfig, easConfig, "stable"), /Release type/);
  const stable = structuredClone(appConfig);
  stable.expo.version = "2.3.0";
  assert.equal(validateReleaseConfig(stable, easConfig, "stable"), "2.3.0");
  assert.throws(() => validateReleaseConfig(stable, easConfig, "prerelease"), /Release type/);
  assert.throws(() => validateReleaseConfig(appConfig, easConfig, "invalid"), /Release type/);
  const local = structuredClone(easConfig);
  local.cli.appVersionSource = "local";
  assert.throws(() => validateReleaseConfig(appConfig, local, "prerelease"), /remote versioning/);
});

test("uses the actual EAS versionCode and exposes prerelease status", () => {
  const release = createAndroidRelease([build], appConfig, options);
  assert.equal(release.releaseTag, "android-2.3.0-rc.1-(2)");
  assert.equal(release.prerelease, true);
  assert.equal(release.versionCode, "2");
  assert.equal(
    formatGitHubOutputs(release),
    "apk_url=https://example.test/Breathly.apk?signature=abc\n" +
      "release_name=Android 2.3.0-rc.1 (2)\n" +
      "release_tag=android-2.3.0-rc.1-(2)\nversion_code=2\nrelease_version=2.3.0-rc.1\nprerelease=true\n",
  );
  const stable = structuredClone(appConfig);
  stable.expo.version = "2.3.0";
  assert.equal(
    createAndroidRelease([{ ...build, appVersion: "2.3.0" }], stable, {
      ...options,
      releaseType: "stable",
    }).prerelease,
    false,
  );
  assert.throws(
    () => createAndroidRelease([build], appConfig, { ...options, releaseType: "stable" }),
    /Release type/,
  );
});

test("rejects incomplete responses and builds from another source or project", () => {
  assert.throws(() => createAndroidRelease([], appConfig, options), /exactly one/);
  assert.throws(() => createAndroidRelease([build, build], appConfig, options), /exactly one/);
  assert.throws(
    () => createAndroidRelease([{ ...build, gitCommitHash: "b".repeat(40) }], appConfig, options),
    /commit/,
  );
  for (const change of [
    { status: "ERRORED" },
    { platform: "IOS" },
    { appVersion: "2.2.0" },
    { buildProfile: "production" },
    { project: { id: "another-project" } },
  ])
    assert.throws(
      () => createAndroidRelease([{ ...build, ...change }], appConfig, options),
      /does not match/,
    );
});

test("rejects version codes that do not advance the distributed baseline", () => {
  for (const appBuildVersion of ["0", "1", "2147483647", "1\nrelease_tag=bad", "1.5"]) {
    assert.throws(
      () => createAndroidRelease([{ ...build, appBuildVersion }], appConfig, options),
      /version code/,
    );
  }
  assert.throws(
    () => createAndroidRelease([{ ...build, appBuildVersion: undefined }], appConfig, options),
    /version code/,
  );
});

test("rejects unsafe artifact URLs", () => {
  for (const url of [
    "http://example.test/app.apk",
    "https://example.test/app.apk\nrelease_tag=bad",
  ]) {
    assert.throws(
      () =>
        createAndroidRelease(
          [{ ...build, artifacts: { applicationArchiveUrl: url } }],
          appConfig,
          options,
        ),
      /invalid APK URL/,
    );
  }
  assert.throws(
    () => createAndroidRelease([{ ...build, artifacts: {} }], appConfig, options),
    /APK URL/,
  );
});

const fingerprint = "a".repeat(64);
const badging = `package: name='${appConfig.expo.android.package}' versionCode='2' versionName='${appConfig.expo.version}' platformBuildVersionName='16'`;
const signing = `Signer #1 certificate SHA-256 digest: ${fingerprint}\n`;
test("checks APK manifest and the approved signing certificate", () => {
  verifyAndroidArtifact(
    badging,
    signing,
    appConfig,
    "2",
    fingerprint.toUpperCase().match(/../g).join(":"),
  );
  for (const altered of [
    badging.replace("versionCode='2'", "versionCode='3'"),
    badging.replace(appConfig.expo.android.package, "another.package"),
    badging.replace(appConfig.expo.version, "2.2.0"),
  ]) {
    assert.throws(
      () => verifyAndroidArtifact(altered, signing, appConfig, "2", fingerprint),
      /does not match/,
    );
  }
  assert.throws(
    () => verifyAndroidArtifact(badging, signing, appConfig, "2", "b".repeat(64)),
    /certificate/,
  );
  assert.throws(
    () => verifyAndroidArtifact(badging, "", appConfig, "2", fingerprint),
    /certificate/,
  );
});

test("accepts platform-labelled certificates and Windows line endings from apksigner", () => {
  for (const output of [
    `Signer #1 certificate SHA-256 digest: ${fingerprint}\r\n`,
    `Signer #1 certificate SHA-256 digest: ${fingerprint}  \n`,
    signing + signing,
    `Signer #1 certificate SHA-256 digest: ${fingerprint.match(/../g).join(":")}\n`,
    `Signer (minSdkVersion=28, maxSdkVersion=2147483647) certificate SHA-256 digest: ${fingerprint}\n`,
    `Signer (minSdkVersion=33 (dev release=true), maxSdkVersion=2147483647) certificate SHA-256 digest: ${fingerprint}\n`,
  ])
    verifyAndroidArtifact(badging, output, appConfig, "2", fingerprint);
});

test("rejects a different certificate on any supported Android version", () => {
  const output =
    signing +
    `Signer (minSdkVersion=33, maxSdkVersion=2147483647) certificate SHA-256 digest: ${"b".repeat(64)}\n`;
  assert.throws(
    () => verifyAndroidArtifact(badging, output, appConfig, "2", fingerprint),
    /certificate/,
  );
  assert.throws(
    () =>
      verifyAndroidArtifact(
        badging,
        `Source Stamp Signer certificate SHA-256 digest: ${fingerprint}\n`,
        appConfig,
        "2",
        fingerprint,
      ),
    /certificate/,
  );
});
