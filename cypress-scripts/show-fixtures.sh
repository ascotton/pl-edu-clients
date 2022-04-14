#!/bin/sh

DIVIDER="--------------------------------"

clear

declare -a FILES="${PL_CYPRESS_DIR}/fixtures/transient"

echo -e "\n$DIVIDER\nUser Status Fixtures\n$DIVIDER\n"
for FILE in "${FILES[@]}"/*.json
do
  echo $(basename $FILE)
  if [ -x "$(command -v jq)" ]; then
     jq . $FILE
  else
     cat $FILE
  fi
  echo -e "$DIVIDER\n"
done