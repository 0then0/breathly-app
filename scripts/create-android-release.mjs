import fs from "node:fs";
import { pathToFileURL } from "node:url";

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getReleaseVersion(appConfig, releaseType) {
  const version = requireString(appConfig?.expo?.version, "Expo version");
  const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const candidate = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-rc\.[1-9]\d*$/;
  if (
    (releaseType !== "prerelease" && releaseType !== "stable") ||
    !(releaseType === "prerelease" ? candidate : stable).test(version)
  ) {
    throw new Error("Release type must match a stable version or an explicit -rc.N version");
  }
  return version;
}

export function validateReleaseConfig(appConfig, easConfig, releaseType) {
  const version = getReleaseVersion(appConfig, releaseType);
  if (
    !Number.isInteger(appConfig?.expo?.android?.versionCode) ||
    appConfig.expo.android.versionCode < 1
  ) {
    throw new Error("Configure a positive integer local Android versionCode baseline");
  }
  if (
    easConfig?.cli?.appVersionSource !== "remote" ||
    easConfig?.build?.preview?.autoIncrement !== true ||
    easConfig?.build?.preview?.android?.buildType !== "apk" ||
    easConfig?.build?.preview?.android?.credentialsSource !== "remote"
  ) {
    throw new Error(
      "Release requires remote versioning, autoIncrement and an APK with remote signing",
    );
  }
  return version;
}

export function createAndroidRelease(builds, appConfig, { releaseType, commitSha }) {
  if (!Array.isArray(builds) || builds.length !== 1) {
    throw new Error("EAS must return exactly one Android build");
  }
  const build = builds[0];
  const appVersion = getReleaseVersion(appConfig, releaseType);
  const projectId = requireString(
    appConfig?.expo?.extra?.eas?.projectId,
    "configured EAS projectId",
  );
  const appBuildVersion = requireString(build?.appBuildVersion, "Android version code");
  const archiveUrl = requireString(build?.artifacts?.applicationArchiveUrl, "APK URL");
  if (!/^[a-f0-9]{40}$/.test(commitSha) || build?.gitCommitHash !== commitSha) {
    throw new Error("EAS build commit does not match the approved source commit");
  }
  if (
    build.status !== "FINISHED" ||
    build.platform !== "ANDROID" ||
    build.buildProfile !== "preview" ||
    build.appVersion !== appVersion ||
    build.project?.id !== projectId
  ) {
    throw new Error("EAS build status, platform, profile, version or project does not match");
  }
  if (
    !/^[1-9][0-9]*$/.test(appBuildVersion) ||
    Number(appBuildVersion) > 2_100_000_000 ||
    Number(appBuildVersion) <= appConfig.expo.android.versionCode
  ) {
    throw new Error("EAS returned an invalid Android version code or did not advance the baseline");
  }
  if (/[\r\n]/.test(archiveUrl) || new URL(archiveUrl).protocol !== "https:") {
    throw new Error("EAS returned an invalid APK URL without HTTPS");
  }
  return {
    apkUrl: archiveUrl,
    releaseName: `Android ${appVersion} (${appBuildVersion})`,
    releaseTag: `android-${appVersion}-(${appBuildVersion})`,
    versionCode: appBuildVersion,
    version: appVersion,
    prerelease: releaseType === "prerelease",
  };
}

export function verifyAndroidArtifact(badging, signing, appConfig, versionCode, fingerprint) {
  const metadata = badging.match(
    /^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m,
  );
  if (
    !metadata ||
    metadata[1] !== appConfig.expo.android.package ||
    metadata[2] !== versionCode ||
    metadata[3] !== appConfig.expo.version
  ) {
    throw new Error("APK package, versionCode or versionName does not match the release");
  }
  const normalize = (value) => value.replaceAll(":", "").toLowerCase();
  const expected = normalize(requireString(fingerprint, "approved signing certificate SHA-256"));
  const digests = [
    ...signing.matchAll(
      /^(?:V[1-4](?:\.[12])? )?Signer[^\r\n]* certificate SHA-256 digest: ([a-fA-F0-9:]{64,95})[ \t]*\r?$/gm,
    ),
  ];
  if (
    !/^[a-f0-9]{64}$/.test(expected) ||
    digests.length === 0 ||
    digests.some((digest) => normalize(digest[1]) !== expected)
  ) {
    throw new Error(
      `APK signing certificate does not match the approved SHA-256 (parsed ${digests.length} certificate digests)`,
    );
  }
}

export function formatGitHubOutputs(release) {
  return [
    `apk_url=${release.apkUrl}`,
    `release_name=${release.releaseName}`,
    `release_tag=${release.releaseTag}`,
    `version_code=${release.versionCode}`,
    `release_version=${release.version}`,
    `prerelease=${release.prerelease}`,
    "",
  ].join("\n");
}

function main() {
  const [mode, ...args] = process.argv.slice(2);
  const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
  if (mode === "--preflight" && args.length === 3) {
    const [appPath, easPath, releaseType] = args;
    const app = read(appPath);
    const version = validateReleaseConfig(app, read(easPath), releaseType);
    if (read("package.json").version !== version)
      throw new Error("package.json and Expo versions differ");
    if (
      requireString(app.expo.extra?.eas?.projectId, "configured EAS projectId") !==
        requireString(process.env.EAS_PROJECT_ID, "approved EAS_PROJECT_ID") ||
      app.expo.android.package !==
        requireString(process.env.ANDROID_PACKAGE, "approved ANDROID_PACKAGE")
    ) {
      throw new Error("App identity does not match the approved release environment");
    }
    if (app.expo.owner !== requireString(process.env.EAS_OWNER, "approved EAS_OWNER")) {
      throw new Error("Expo owner does not match the approved release environment");
    }
    if (
      !/^[a-fA-F0-9]{64}$/.test((process.env.ANDROID_SIGNING_CERT_SHA256 ?? "").replaceAll(":", ""))
    ) {
      throw new Error("Configure the approved ANDROID_SIGNING_CERT_SHA256 before building");
    }
    fs.accessSync(`releases/${version}.md`);
    return;
  }
  if (mode === "--verify-apk" && args.length === 4) {
    const [badgingPath, signingPath, appPath, versionCode] = args;
    verifyAndroidArtifact(
      fs.readFileSync(badgingPath, "utf8"),
      fs.readFileSync(signingPath, "utf8"),
      read(appPath),
      versionCode,
      process.env.ANDROID_SIGNING_CERT_SHA256,
    );
    return;
  }
  if (mode && args.length === 4) {
    const [appPath, easPath, releaseType, commitSha] = args;
    const app = read(appPath);
    validateReleaseConfig(app, read(easPath), releaseType);
    process.stdout.write(
      formatGitHubOutputs(createAndroidRelease(read(mode), app, { releaseType, commitSha })),
    );
    return;
  }
  throw new Error(
    "Usage: create-android-release.mjs <build.json> <app.json> <eas.json> <prerelease|stable> <commit-sha>",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
