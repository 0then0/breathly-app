# Android release preparation

## Candidate

Source branch: `release/2.3.0`, based on `origin/master` at `3b86b698c59cf99e7aa834ddfde117b29c0c442d`.
Target repository: `0then0/breathly-app`, target branch: `master`.
App and package.json version: `2.3.0-rc.1`. Android minimum: API 26 (Android 8.0).

`eas.json` uses EAS CLI 21.4.0, `appVersionSource: remote` and preview `autoIncrement: true`.
The preview profile explicitly builds an APK using remote credentials. The local Android
versionCode `1` is the new independent package's baseline, not a promised code for the next build.
The new project's remote counter was initialized to `1` and verified with `eas build:version:get`.
Increase that baseline if a higher code is ever distributed for this package. The build must advance that baseline; its actual code is checked
against the APK manifest and used in the release tag. Do not guess it in advance.

## Approved independent beta identity

- Expo owner: `0then0`; slug: `breathly-beta`; display name: `Breathly Beta`.
- Android package: `app.breathly.beta`, with a separate newly generated remote Android signing key.
- EAS projectId: `5f3978c9-ac5b-4662-a9ce-3cfa0ca9c894`, created and verified under `0then0`.
  Dashboard: https://expo.dev/accounts/0then0/projects/breathly-beta
- The iOS bundle identifier remains `com.mmazzarolo.breathly`; this candidate is for Android only.

The beta installs independently of the original app. Its Android package has separate settings
storage and Health Connect permissions; original-app settings are not migrated across packages.
The local Kotlin module's namespace is retained and does not determine the APK applicationId.

No cloud build, release tag or publication is authorized until final review and explicit approval.
Keep credentials out of the PR and release notes. The new remote JKS is assigned to the preview profile and application ID `app.breathly.beta`.
Its verified public certificate SHA-256 is
`FAD2422BE5FF6FE3373AA3E11B835F26A089A3AF973D05719146B0A5D1A85F85`.
No keystore file or password was downloaded or committed.

## Publication gate

Configure a protected GitHub Environment named `release` with a required reviewer. Its secret
`EXPO_TOKEN` must have access to the approved project and existing remote Android credentials.
Set these non-secret environment variables:

- `EAS_PROJECT_ID=5f3978c9-ac5b-4662-a9ce-3cfa0ca9c894`
- `EAS_OWNER=0then0`
- `ANDROID_PACKAGE=app.breathly.beta`
- `ANDROID_SIGNING_CERT_SHA256=FAD2422BE5FF6FE3373AA3E11B835F26A089A3AF973D05719146B0A5D1A85F85`

These GitHub environment settings and `EXPO_TOKEN` have not been configured by this preparation.
The workflow fails before building when
these values are missing or do not match the checked-out config. `--freeze-credentials` prevents
EAS from generating or updating signing credentials during the build.

After reviewing the final PR commit, explicitly authorize merge into master. After merge, review
and approve the exact resulting master SHA, version, target repository and build/publication cost.
Dispatch **Release Android APK** from master with that full SHA as `expected_sha` and
`release_type=prerelease`. The protected environment reviewer is the final publication gate.
No tag, GitHub release or cloud build has been created by preparing this branch.

The workflow runs static, Expo and bundle checks before spending build credits. It validates the
EAS build's commit, owner, project, version and completed Android preview status; checks the signed
APK manifest/certificate; then tags the exact build commit and publishes a GitHub prerelease with
its checksum. Tags contain the actual EAS versionCode. Stable mode requires a stable `expo.version`
and matching `releases/<version>.md`; the RC cannot accidentally be published as stable.

## Validation limitations

- The eight explicitly approved SDK 57 patch updates resolve Expo's initial dependency drift;
  `validate:expo` subsequently passed all 20 checks.
- Android prebuild succeeds with API 26, but the Android SDK path is absent, adb and Maestro are
  unavailable. Native compilation is additionally checked by the PR
  `android-native` job (`:app:assembleDebug`), which does not use EAS or publish an APK.
  Device tests have not been completed.
- Run `bun run e2e:build:android` and `bun run e2e:android` with an Android SDK, Maestro and a booted
  emulator. On a device with mindfulness-capable Health Connect, verify consent, revoked consent,
  unavailable provider, completion after the final hold, pause/resume intervals and saved records.
  Unit tests and JS bundles do not confirm native Health Connect functionality.

## Local verification

Using the repository-pinned Bun 1.3.14 and the updated lockfile:

- `bun run validate:static`: typecheck, lint, formatting, 23 Jest suites / 135 tests and 6 release-script tests passed.
- `bun run validate:expo`: 20/20 checks passed.
- `bun run validate:bundles`: Android, iOS and web production exports passed.
- Android prebuild: generated `app.breathly.beta`, versionName `2.3.0-rc.1`, local versionCode 1, minSdk 26.
- Expo autolinking: resolves the local `breathly-health-connect` native module.
- Workflow YAML parses; all workflow shell steps and visual capture script pass `bash -n`.

The first test run on the globally installed Bun 1.4.2 hit a cold-start timeout; an intermediate
mixed-runtime invocation crashed. The final pinned-runtime run above passed completely.
