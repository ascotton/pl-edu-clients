#!/bin/sh

DIVIDER="------------------------------------------"

# cypress-scripts dir
THIS_PATH=${PL_CYPRESS_SCRIPTS_DIR:-"."}

# BASE yaml file for default data seeds
# OR
# SUITE yaml file (basic-smoke | full-regression)
if [ -z ${CY_SUITE} ];
then
  YAML_FILE=${YAML_FILE:-"bsd.yaml"};
else
  YAML_FILE=suite-${CY_SUITE}.yaml
fi

YAML_OUTPUT_COUNTER=${YAML_OUTPUT_COUNTER:-""};

YAML_FILE_PATH=$PL_FOUNDRY_DIR/scripts/$YAML_FILE

DEFAULT_OUTPUT="${PL_FOUNDRY_DIR}/.output${YAML_OUTPUT_COUNTER}--${YAML_FILE}"
OUTPUT_FILE_PATH=${FILE_PATH:-${DEFAULT_OUTPUT}}

clear

echo
echo "================================"
echo "      Running Foundry SEED      "
echo "================================"
echo

node ${THIS_PATH}/print-env-vars.js

if [ -f "${OUTPUT_FILE_PATH}" ]; then
  mv $OUTPUT_FILE_PATH $OUTPUT_FILE_PATH"-BAK"
fi

$PL_FOUNDRY_DIR/foundry.py run $YAML_FILE_PATH > $OUTPUT_FILE_PATH

echo -e "\n$DIVIDER\n   🎉   Finished cy-seed \n$DIVIDER\n"
