# Edu-clients

## Setup / Running

First time here?
See: https://presencelearning.atlassian.net/wiki/spaces/SEP/pages/1282179091/FE+dev+first+time+setup

### Environments

To allow dynamic configs that support environment variables, we default to configs,
 but environment variables override.
See: https://medium.com/@natchiketa/angular-cli-and-os-environment-variables-4cfa3b849659

Configs live in `config/env` and the script is in `node-scripts/set-env.js`.

- `npm run env-local` to set up the local environment.
- `npm run env-test` or `npm run env-live` for test and live environments.

You MUST run one of the above commands first as all future commands depend on the generate environment file.

- `npm install`
- `npm start`
- open browser to `http://localhost:3010`
- (prod) build for deploy: `npm run build`
    - stag deploy: `npm run env-stag && npm run build-stag`
    - live deploy: `npm run env-live && npm run build-live`

### Tests (Unit)
 - `npm run setup && npm test`

### Tests (Cypress)

- Install Cypress `npm install -g cypress-cli`
- For GUI (locally)
    - for localhost currently webpack dev server does not work - get a 404.
     So use `npm run build` then `node node-server-webpack.js` first.
    - `cypress open` then use the GUI to run tests.
    - optional: `npm run test-data-setup` (optionally with `loglevel` and `filepath` arguments)
- Headless (CI)
    - `cypress run --env ENVKEY=test`

## Common Tasks

- Add new svg (that is _not_ already in `pl-components-ng2`)
    - Optimize it first
        - https://jakearchibald.github.io/svgomg/
        - Add proper closing tags, e.g. `<path>...</path>` instead of just `<path ... />`
        - Remove any fixed widths, heights, id's or fills. SVG should fill full box and be centered.
    - Just add the new svg to the `build/assets/svg` folder
- Run `npm run svg`, then the `src/build/svg-inline-ng-plugin.service.ts` file will include your new svg


## Purposefully outdated dependencies:

- typescript <3.6.0 (angular limitation)
- ng2-charts (& chart.js & chartjs-plugin-datalabels)
- Had to revert target to es5 for build to work: https://github.com/angular/angular-cli/issues/15493#issuecomment-531281335
