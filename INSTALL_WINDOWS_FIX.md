# Windows install fix

This project lockfiles now point to the public npm registry.

If you extracted an older zip and saw URLs like `packages.applied-caas-gateway1.internal.api.openai.org`, use this cleaned copy instead.

## Clean reinstall

In PowerShell from the project root:

```powershell
npm config set registry https://registry.npmjs.org/
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force client\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force server\node_modules -ErrorAction SilentlyContinue
npm install
npm --prefix client install
npm --prefix server install
```

Then run:

```powershell
npm run dev
```
