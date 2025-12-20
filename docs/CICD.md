# CI/CD Setup Guide

## Required GitHub Secrets

Go to your repository **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `EXPO_TOKEN` | EAS authentication token | Run `eas whoami` to verify login, then create at [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) |
| `EXPO_ACCOUNT` | Your Expo account username | Your Expo username (e.g., `codewithriyan`) |
| `GOOGLE_SERVICES_JSON` | (Optional) Google Play service account key | [Google Play Console](https://play.google.com/console) → Setup → API access |

## Build Profiles

| Profile | Trigger | Output | Channel |
|---------|---------|--------|---------|
| `development` | Push to `dev`/`develop` branch | APK with dev client | `development` |
| `preview` | Pull request to `main` | APK for testing | `preview` |
| `production` | Push to `main` | AAB for Play Store | `production` |

## Workflow Overview

```
dev branch ──push──→ Development Build (APK with dev client)
     │
     ↓ (PR)
main branch ──PR──→ Preview Build (Internal testing APK)
     │
     ↓ (merge)
main branch ──push──→ Production Build (AAB for Play Store)
```

## Quick Commands

```bash
# Create EAS access token
eas login
eas whoami  # Verify you're logged in

# Manual builds (if needed)
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android

# Check build status
eas build:list
```

## OTA Updates

Each build profile has its own channel for Over-The-Air updates:

```bash
# Push update to development builds
eas update --channel development

# Push update to preview builds  
eas update --channel preview

# Push update to production builds
eas update --channel production
```
