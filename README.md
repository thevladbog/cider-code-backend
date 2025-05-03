<p align="center">
  <a href="https://github.com/thevladbog/cider-code-backend" target="blank"><img src="./public/img/BOTTLE-CODE-LOGO.png" width="600" alt="BOTTLE [CODE] Logo" /></a>
</p>

## Description

Backend for web app BOTTLE [CODE]

## Project setup

1. Install dependencies

```bash
npm install
```

2. Install local certificates

- Unix

```bash
LOCAL='api.test.in.bottlecode.app' npm run cert:create:local
```

- Windows

```bash
$env:LOCAL='api.test.in.bottlecode.app'
npm run cert:create:local
```

3.Install jwt certificates

```bash
npm run cert:create:jwt
```

## Compile and run the project

- development

```bash
npm run start
```

- watch mode

```bash
npm run start:dev
```

- production mode

```bash
npm run start:prod
```
