#!/bin/sh

DIVIDER="------------------------------------------"

THIS_PATH=${PL_CYPRESS_SCRIPTS_DIR:-"."}
JS_YAML=${THIS_PATH}/node_modules/js-yaml/bin/js-yaml.js

echo "================================"
echo "             USERS...           "
echo "================================"
echo

if [ -z ${CY_SUITE} ];
then
  YAML_FILE=${YAML_FILE:-"bsd.yaml"};
  declare -a USERS=(
    "provider-slp"
    "provider-ot"
    "provider-mhp"
    "provider-pa"
    "cam_user"
    "cam_billing_user"
    "service-and-support"
    "customer_admin"
  )
else
  YAML_FILE=suite-${CY_SUITE}.yaml
  USERS_FILE="${PL_FOUNDRY_DIR}/scripts/suite-${CY_SUITE}-users.txt"

  echo "USERS_FILE       : "$USERS_FILE

  USERS=()
  while IFS= read -r line; do
    USERS+=("$line")
  done < $USERS_FILE
fi

echo
for u in "${USERS[@]}"
do
  if [ "$u" == "" ]; then
    continue
  fi
  echo "[$u]"
done
echo

YAML_OUTPUT_COUNTER=${YAML_OUTPUT_COUNTER:-""};

DEFAULT_FILE_PATH="${PL_FOUNDRY_DIR}/.output${YAML_OUTPUT_COUNTER}--${YAML_FILE}"
FILE_PATH=${FILE_PATH:-${DEFAULT_FILE_PATH}}

echo "================================"
echo "       INGESTING USERS...       "
echo "================================"
echo

echo "FILE_PATH        : "$FILE_PATH
echo

# add yaml object prefix hypen where needed
sed -i '' 's/^  assignments: \[\]$/- assignments: \[\]/g' $FILE_PATH

for u in "${USERS[@]}"
do
  if [ "$u" == "" ]; then
    continue
  fi

  FILE=${THIS_PATH}/transient/${u}.json
  name=$(basename $FILE)
  echo "${name}"

  if [ "$u" == "OTHER" ]; then
    grep -A 4 ^\$$u\: $FILE_PATH | tail -4 | $JS_YAML | jq .[0] > $FILE
  else
    grep -A 7 ^\$$u\: $FILE_PATH | tail -7 | $JS_YAML | jq .[0] > $FILE
  fi
  if [ -x "$(command -v jq)" ]; then
    jq . $FILE
    echo
  else
    cat $FILE
  fi
done

echo -e "\n$DIVIDER\n   🎉   Finished cy-ingest \n$DIVIDER\n"
echo
