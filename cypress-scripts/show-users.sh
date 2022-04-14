#!/bin/sh

DIVIDER="--------------------------------"

THIS_PATH=${PL_CYPRESS_SCRIPTS_DIR:-"."}

clear

if [ -z ${CY_SUITE} ];
then
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
  USERS=()
  while IFS= read -r line; do
    if [ "$line" == "" ]; then
      continue
    fi
    USERS+=("$line")
  done < $USERS_FILE
fi

echo -e "\n$DIVIDER\nUsers\n$DIVIDER\n"
for u in "${USERS[@]}"
do
  FILE=${THIS_PATH}/transient/${u}.json
  name=$(basename $FILE)
  echo "${name}"
  if [ -x "$(command -v jq)" ]; then
     jq . $FILE
  else
     cat $FILE
  fi
  echo -e "$DIVIDER\n"
done

