#!/bin/sh

echo "--- test suite (${CY_SUITE})"
echo

cypress run --spec "${PL_CYPRESS_DIR}/integration/pl/suites/${CY_SUITE}/**/*.spec.js"