# GitHub Setup Guide

Create **your own** copy of the scaffold from the public template, push it to a repo you control, and prepare `main` + `develop` for Railway deployment.

**Template (do not deploy this repo directly):** [Larza-Intelligence-Inc/mvp-scaffold](https://github.com/Larza-Intelligence-Inc/mvp-scaffold)

---

## 1) Create your repo from the template

On GitHub, open the template and click **Use this template** → **Create a new repository**.

You must choose where the new repo lives:

| Decision | What to pick |
|----------|----------------|
| **Owner** | Your personal account **or** a GitHub organization you belong to |
| **Repository name** | e.g. `my-app`, `acme-mvp` |
| **Visibility** | **Public** (open source, free Actions minutes) or **Private** (team/internal) |
| **Description** | Optional |

> Use an organization when the app belongs to a company or shared team. Use your personal account for solo experiments.

Click **Create repository**. GitHub copies the template into your new repo.

### Alternative: GitHub CLI

```bash
# Personal account, public
gh repo create my-app --template Larza-Intelligence-Inc/mvp-scaffold --public

# Organization, private
gh repo create my-org/my-app --template Larza-Intelligence-Inc/mvp-scaffold --private
```

Replace `my-app`, `my-org`, and visibility flags to match where you want the repo.

---

## 2) Clone locally

```bash
git clone git@github.com:<OWNER>/<REPO>.git
cd <REPO>
```

Use HTTPS if you prefer: `https://github.com/<OWNER>/<REPO>.git`

---

## 3) Create `main` and `develop` with identical code

Railway staging/production wiring expects two branches with the **same starting code**. After cloning, check which branch you have:

```bash
git branch -a
```

### If you only have `develop` (template default)

```bash
git checkout develop
git pull origin develop

git checkout -b main
git push -u origin main
git push -u origin develop
```

### If you only have `main`

```bash
git checkout main
git pull origin main

git checkout -b develop
git push -u origin develop
git push -u origin main
```

### If both branches already exist

Make sure they point at the same commit:

```bash
git checkout main
git pull origin main

git checkout develop
git merge main   # should be "Already up to date" if identical
git push origin develop
```

### Verify

```bash
git rev-parse main
git rev-parse develop
```

Both commands should print the **same commit SHA**. In GitHub → **Branches**, you should see `main` and `develop` at the same commit.

---

## 4) What’s next

| Guide | Purpose |
|-------|---------|
| [RAILWAY.md](RAILWAY.md) | Deploy on Railway and run the setup script |
| [USAGE.md](USAGE.md) | Run the stack locally with Docker Compose |
| [README.md](README.md) | Railway manual setup reference (services, env vars) |

The Railway setup script runs only from **your** forked repo — not from `Larza-Intelligence-Inc/mvp-scaffold`.
