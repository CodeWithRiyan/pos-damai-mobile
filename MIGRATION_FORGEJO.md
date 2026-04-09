# Migration Guide: GitHub → ForgeJo

This document outlines the steps to migrate from GitHub to ForgeJo for CI/CD and repository management.

---

## Overview

| Item            | Before (GitHub)                             | After (ForgeJo)                          |
| --------------- | ------------------------------------------- | ---------------------------------------- |
| Repository URL  | `github.com/CodeWithRiyan/pos-damai-mobile` | `git.sakaloka.id/riyan/pos-damai-mobile` |
| CI/CD           | GitHub Actions                              | ForgeJo Actions                          |
| Release Storage | GitHub Releases                             | ForgeJo Releases                         |
| APK Downloads   | `github.com/.../releases`                   | `git.sakaloka.id/.../releases`           |

---

## Prerequisites

- [ ] ForgeJo server running at `https://git.sakaloka.id`
- [ ] Runner installed and registered (status: idle)
- [ ] 100GB storage available
- [ ] Team members notified (2 frontend devs + you)

---

## Phase 1: Create Repository on ForgeJo

### Step 1.1: Create New Repository

1. Navigate to: `https://git.sakaloka.id`
2. Click the **+** button (top right)
3. Select **New Repository**
4. Fill in the form:
   - **Repository Name**: `pos-damai-mobile`
   - **Visibility**: `Private` ✅
   - **Initialize repository**: Uncheck (we'll push existing code)
5. Click **Create Repository**

### Step 1.2: Add Collaborators

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/settings/collaborators`
2. Click **Add Collaborator**
3. Enter each team member's username:
   - `frontend-dev-1` → Permission: **Write**
   - `frontend-dev-2` → Permission: **Write**
4. Click **Add Collaborator**

---

## Phase 2: Create API Token for CI/CD

### Step 2.1: Generate Token

1. Navigate to: `https://git.sakaloka.id/user/settings/applications`
2. Under **Tokens**, click **Generate Token**
3. Fill in:
   - **Token name**: `CI-Release-Action`
   - **Expiration**: Select `1 year` (or your preference)
   - **Scopes**: Check ✅ `write:repository`
4. Click **Generate Token**
5. **IMPORTANT**: Copy the token immediately - it won't be shown again!

### Step 2.2: Add Token as Repository Secret

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/settings/secrets`
2. Click **New Secret**
3. Fill in:
   - **Name**: `FORGEJO_TOKEN`
   - **Value**: Paste the token from Step 2.1
4. Click **Add Secret**

---

## Phase 3: Update Local Git Remote

On your local machine, run:

```bash
# Navigate to your project
cd /Users/mymac/Documents/riyan-id/pos-damai/pos-damai-mobile

# Update the remote URL to point to ForgeJo
git remote set-url origin https://git.sakaloka.id/riyan/pos-damai-mobile.git

# Verify the remote has been updated
git remote -v

# Output should show:
# origin  https://git.sakaloka.id/riyan/pos-damai-mobile.git (fetch)
# origin  https://git.sakaloka.id/riyan/pos-damai-mobile.git (push)
```

### Optional: Add GitHub as Backup Remote

If you want to keep GitHub as a read-only backup:

```bash
# Add GitHub as a backup remote
git remote add backup https://github.com/CodeWithRiyan/pos-damai-mobile.git
```

---

## Phase 4: Workflow Changes

The workflow file has been updated to use ForgeJo Actions instead of GitHub Actions.

### Key Changes Made

| Change         | Before                           | After                                                 |
| -------------- | -------------------------------- | ----------------------------------------------------- |
| Release action | `softprops/action-gh-release@v2` | `https://code.forgejo.org/actions/forgejo-release@v2` |
| Token          | `GITHUB_TOKEN`                   | `secrets.FORGEJO_TOKEN`                               |
| Commit user    | `github-actions`                 | `forgejo-actions`                                     |

### Verify the Changes

Check `.github/workflows/eas-build-apk.yml`:

```yaml
env:
  FORGEJO_SERVER_URL: https://git.sakaloka.id

# ... (build steps)

- name: 📦 Create ForgeJo Release
  uses: https://code.forgejo.org/actions/forgejo-release@v2
  with:
    direction: upload
    url: https://git.sakaloka.id
    repo: ${{ github.repository }}
    token: ${{ secrets.FORGEJO_TOKEN }}
    tag: v${{ steps.version.outputs.version }}
    release-dir: .
    release-notes: |
      ...
```

---

## Phase 5: Push to ForgeJo

```bash
# Stage the workflow changes
git add .github/workflows/eas-build-apk.yml CLAUDE.md

# Commit the changes
git commit -m "chore: migrate CI/CD from GitHub to ForgeJo"

# Push to ForgeJo
git push origin main
```

---

## Phase 6: Test CI/CD

### Step 6.1: Trigger Manual Build

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/actions`
2. Find the **Build & Release Android APK** workflow
3. Click **Run Workflow**
4. Select branch type:
   - `dev` → Development API (api-dev-pos-damai.riyansolusi.com)
   - `main` → SIT API (api-sit-pos-damai.riyansolusi.com)
   - `prod` → Production API (api-pos-damai.riyansolusi.com)
5. Click **Run Workflow**

### Step 6.2: Monitor Build Progress

1. Watch the workflow run:
   - Runner (idle) should pick up the job
   - Build should complete in ~10-15 minutes
2. Check **Releases** tab for new APK

### Step 6.3: Verify Release

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/releases`
2. Verify:
   - ✅ New release created with tag `vX.Y.Z`
   - ✅ APK file attached
   - ✅ Release notes visible

---

## Phase 7: Notify Team

Send this message to your developers:

```
Hi Team,

I've migrated our repository from GitHub to our own ForgeJo server.

📍 New Repository URL: https://git.sakaloka.id/riyan/pos-damai-mobile

Please update your local git remote:
  git remote set-url origin https://git.sakaloka.id/riyan/pos-damai-mobile.git

Then push your latest changes:
  git push origin main

For QA:
- APK downloads available at the Releases tab
- URL: https://git.sakaloka.id/riyan/pos-damai-mobile/releases
```

---

## Release Management

### View Releases

```
https://git.sakaloka.id/riyan/pos-damai-mobile/releases
```

### Download APK

1. Go to Releases page
2. Click on the release version
3. Click on the APK file to download

### Delete Old Release

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/releases`
2. Click on the release you want to delete
3. Click **Delete** button (top right)
4. Confirm deletion

### Manual Release Creation

1. Go to: `https://git.sakaloka.id/riyan/pos-damai-mobile/releases`
2. Click **New Release**
3. Fill in:
   - **Tag**: e.g., `v1.0.0`
   - **Release Title**: e.g., `POS Damai v1.0.0`
   - **Description**: Release notes
4. Click **Save** or **Publish**

---

## Troubleshooting

### Runner Not Picking Up Job

- Check runner status at: `https://git.sakaloka.id/admin/actions/runners`
- Ensure runner is `idle` (not offline)

### Release Upload Fails

- Verify `FORGEJO_TOKEN` secret is set correctly
- Ensure token has `write:repository` scope

### Build Fails

- Check workflow logs for error details
- Common issues: missing dependencies, version conflicts

---

## Rollback (If Needed)

To switch back to GitHub:

1. Revert workflow changes:

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. Update remote:
   ```bash
   git remote set-url origin https://github.com/CodeWithRiyan/pos-damai-mobile.git
   ```

---

## Checklist

| Step | Task                                | Status |
| ---- | ----------------------------------- | ------ |
| 1    | Create ForgeJo repository (Private) | [ ]    |
| 2    | Add collaborators (2 frontend devs) | [ ]    |
| 3    | Generate API token                  | [ ]    |
| 4    | Add token as repository secret      | [ ]    |
| 5    | Update local git remote             | [ ]    |
| 6    | Push code to ForgeJo                | [ ]    |
| 7    | Trigger first CI/CD build           | [ ]    |
| 8    | Verify APK in releases              | [ ]    |
| 9    | Notify team                         | [ ]    |

---

## Notes

- Storage: 100GB available (~50 releases for APK)
- Visibility: Private - only collaborators can access
- CI/CD: Uses ForgeJo Actions with runner
- APK location: `android/app/build/outputs/apk/release/*.apk`
