#!/bin/sh

if [ -z ${CY_SUITE} ];
then
  SPECS=cypress/integration/pl/**/$1.spec.js
else
  SPECS=cypress/integration/pl/suites/$CY_SUITE/**/$1*.spec.js
fi

time(cypress run --record --reporter mochawesome --spec $SPECS)