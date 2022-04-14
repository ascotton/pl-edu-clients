#!/bin/sh

DIVIDER="------------------------------------------"

# cypress-scripts dir
THIS_PATH=${PL_CYPRESS_SCRIPTS_DIR:-"."}
YAML_FILE_PATH=$PL_FOUNDRY_DIR/scripts/$1
OUTPUT_FILE_PATH="${PL_FOUNDRY_DIR}/.output--$1"

if [ -f "${OUTPUT_FILE_PATH}" ]; then
  mv $OUTPUT_FILE_PATH $OUTPUT_FILE_PATH"-BAK"
fi

echo -e "\n$DIVIDER\n        Starting foundry-yaml \n$DIVIDER\n"
$PL_FOUNDRY_DIR/foundry.py run $YAML_FILE_PATH > $OUTPUT_FILE_PATH
echo -e "\n$DIVIDER\n   🎉   Finished foundry-yaml \n$DIVIDER\n"
