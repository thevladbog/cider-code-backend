<p align="center">
  <a href="https://github.com/thevladbog/cider-code-backend" target="blank"><img src="./public/img/BOTTLE-CODE-LOGO.png" width="600" alt="BOTTLE [CODE] Backend Logo" /></a>
</p>

## Description

Backend for web app BOTTLE [CODE]

## Project setup

1. Install dependencies

```sh
npm install
```

2. Install local certificates

- Unix

```sh
LOCAL='api.test.in.bottlecode.app' npm run cert:create:local
```

- Windows

```sh
$env:LOCAL='api.test.in.bottlecode.app'
npm run cert:create:local
```

3.Install jwt certificates

```sh
npm run cert:create:jwt
```

## Compile and run the project

- development

```sh
npm run start
```

- watch mode

```sh
npm run start:dev
```

- production mode

```sh
npm run start:prod
```
