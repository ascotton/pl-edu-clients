# Documentation for cypress-scripts

> `cypress-scripts` is used to create users and fixtures to support automated cypress tests


# 1. Overview

At the time a Cypress test runs, it will require a pre-defined user (generated in the appropriate presencek8s env) suitable for the tests being run.

This requirement corresponds to the need for particular foundry yaml files. They can be found in the foundry project in the `scripts` directory.

Also, QA has developed a [stash of scripts](https://drive.google.com/drive/u/1/folders/1GrBOR8fE0lRtbSt8sy7uKLPqHeYaAjir).

Make sure you have `cypress` and `foundry` and the `app` (e.g. edu-clients) setup locally before running cypress-scripts.

NOTE: this guide was written and tested for dev on a mac.

# 2. Installation and configuration

> Pre-requisites

  * Node, nvm, git
  * git ssh keys
  * App (edu-clients)
  * clone [Foundry](https://github.com/presencelearning/foundry)
     * Python info from BE team for intel macs
        * ![image](https://user-images.githubusercontent.com/2761400/128556854-ced86032-5d04-42aa-a30b-7557a372d5ac.png)
     * For M1 macs, use python 3.7 or higher
  * Cypress gets installed automatically as a dependency of edu-clients

> If you are going to run foundry locally (recommended)
  * install jq: `brew install jq`
  * install python (3.7 or higher for m1 macs) if needed
     * check your version of python: `python --version`
     * install pyenv: `brew install pyenv`
     * find a 3.7+ version of python: `pyenv install --list`
     * install, e.g.: `pyenv install 3.9.1 && pyenv global 3.9.1`
     * configure PATH (`.bash_profile`): `export PATH=~/.pyenv/shims:/usr/local/bin:$PATH`
     * source changes: `source ~/.bash_profile`
  * upgrade pip: `python -m pip install --upgrade pip`
  * install foundry from `~/projects/foundry`
     * `python -m pip install -r requirements.txt`

> Required ENV config. The order is important.

```sh

    # change these values as needed
    export PL_ENV=___                               # your env name
    export PL_PROJECTS_DIR=~/projects

    export PL_USERNAME=qauser
    export PL_PASSWORD=___                          # qauser password

    export PL_APP_DIR=$PL_PROJECTS_DIR/edu-clients
    export PL_FOUNDRY_DIR=$PL_PROJECTS_DIR/foundry

    export YAML_FILE=bsd.yaml

    #----------------------------------------------
    export CYPRESS_BASE_URL=https://env16-apps.presencek8s.com
    export CYPRESS_BASE_URL=https://dev.presencek8s.com:3010
    #----------------------------------------------
    export CYPRESS_PL_CYPRESS_DEBUG=false
    export CYPRESS_PL_API_DEBUG=true
    #----------------------------------------------
    export CYPRESS_RECORD_KEY=79caa089-f8c7-479a-8a36-c9711834abfd
    export CYPRESS_numTestsKeptInMemory=500
    export CYPRESS_videoRecording=false
    #----------------------------------------------

    # don't change these values
    export PL_HOST=presencek8s.com
    export PL_CYPRESS_DIR=$PL_APP_DIR/cypress
    export PL_CYPRESS_SCRIPTS_DIR=$PL_APP_DIR/cypress-scripts

    setenv ()
    {
        export AUTH_URL=https://$PL_ENV-login.presencek8s.com
        export APIWORKPLACE_URL=https://$PL_ENV-workplace.presencek8s.com
        export PLATFORM_URL=https://$PL_ENV-platform.presencek8s.com
        export APOLLO_URL=https://$PL_ENV-workplace.presencek8s.com/graphql/v1/;
        export APPS_URL=https://$PL_ENV-apps.presencek8s.com
        export PL_APPS=$APPS_URL
        export PL_LOGIN=$AUTH_URL
        export PL_WORKPLACE=$APIWORKPLACE_URL
        export PL_PLATFORM=$PLATFORM_URL
    }

    setenv

    alias cypress='npx cypress'

```

> Optional ENV variables

```sh

    # Our default cypress base url in cypress.json is the local dev url `https://dev.presencek8s.com:3010`
    # Override CYPRESS_BASE_URL to target a remote env, e.g.
    export CYPRESS_BASE_URL=https://$PL_ENV-apps.presencek8s.com

    # After running cy-multi-seed to pre-generate multiple data sets,
    # ingest a numbered output file (e.g. .output2--suite-basic-smoke.yaml)
    # by first setting the YAML_OUTPUT_COUNTER to the desired index
    export YAML_OUTPUT_COUNTER=2; npm run cy-ingest
```

> One time setup

```sh

    npm completion >> ~/.bash_profile       # tab completion for npm run cy-* scripts
    npm run cy-install                      # install script support packages

```

# 3. Scripts

> Base scripts

```sh

    npm run cy-seed                         # run foundry seed and ingest users
    npm run cy-test                         # login, run tests, and display report
    npm run cy-all                          # cy-seed and cy-test

```

> Helper scripts

```sh

    npm run cy-login                        # login and save status fixtures
    npm run cy-ingest                       # ingest user files
    npm run cy-users                        # display ingested users
    npm run cy-fixtures                     # display status fixtures
    npm run cy-list-env                     # display env variables
    npm run cy-tester                       # run tests
    npm run cy-reporter                     # display test report
    npm run cy-help                         # display this readme in github
    npm run cy-dashboard                    # open the cypress dashboard test results for our project

    npm run cy-multi-seed                   # run a seed file multiple times to numbered output files
                                            # for example, to create 5 output files:
                                            #   npm run cy-multi-seed 5
   # helpers
   npm run cy-basic-multi-seed
   npm run cy-regression-multi-seed

```

> QA test automation suites

```sh

    # (A) run seed for a suite
    export CY_SUITE=basic-smoke;\
        npm run cy-seed

    # (B) run a suite
    export CY_SUITE=basic-smoke;\
        npm run cy-suite

    # helpers for basic-smoke, regression
    npm run cy-basic-seed                   # runs the seed for the basic-smoke suite - shortcut for (A)
    npm run cy-basic-smoke                  # login, run suite, record to dashboard - shortcut for (B)
    npm run qa-basic-smoke                  # run seed, login, run suite, record to dashboard - shortcut for (A+B)

    npm run cy-regression-seed
    npm run cy-regression
    npm run qa-regression

    # run one or more named tests
    npm run cy-single-test                  # specify an exact spec name OR a pattern
    npm run cy-basic-single                 # e.g. npm run cy-basic-single provider-slp*
    npm run cy-regression-single            # e.g. npm run cy-regression-single provider-profile*

    # other variants, but better to use ENV vars
    CY_SUITE= npm run cy-single-test
    CY_SUITE=basic-smoke npm run cy-single-test
    CY_SUITE=regression npm run cy-regression

    # open the cypress GUI
    npm run cy-open                         # opens cypress GUI at cypress/integration/pl/
    npm run cy-open-suites                  # opens cypress GUI at cypress/integration/pl/suites/
    npm run cy-open-basic-smoke             # opens cypress GUI at cypress/integration/pl/suites/basic-smoke/
    npm run cy-open-regression              # opens cypress GUI at cypress/integration/pl/suites/regression/

```

> Developer ergonomics

## Use text-expansion snippets (e.g. Alfred snippets) that you can invoke and alter as desired

```sh
    # Base Case snippet
    export CY_SUITE=basic-smoke; npm run cy-login && time (cypress run --record --reporter mochawesome --spec cypress/integration/pl/suites/basic-smoke/**/*.spec.js)

    # Single Test variation
    export CY_SUITE=basic-smoke; npm run cy-login && time (cypress run --record --reporter mochawesome --spec cypress/integration/pl/suites/basic-smoke/provider-slp-onboarding.spec.js)

    # NOTE: cy-basic-single is a simpler way of doing the single test variation, but snippets can be handy
    # - Supply an exact name for single spec or a pattern to run a set of a particular type
    npm run cy-basic-single provider-slp*

```

> Overriding shell environment variables
```sh
    export PL_ENV=___ && setenv; npm run cy-seed
    export CYPRESS_BASE_URL=https://$PL_ENV-apps.presencek8s.com; npm run cy-seed
```

# 4. Getting users and running tests

> For local foundry...

```sh
    npm run cy-seed && npm run cy-test
```

> For remote foundry...

Copy the output to a local file in your foundry directory, e.g. `~/projects/pl/foundry/.output--bsd.yaml`

```sh
    npm run cy-ingest && npm run cy-test
```

## Starting cypress

> open cypress locally (default)

```sh
  cypress open
```

> open cypress remotely (override default configuration)

```sh
  CYPRESS_BASE_URL=https://$PL_ENV-apps.presencek8s.com cypress open
```
