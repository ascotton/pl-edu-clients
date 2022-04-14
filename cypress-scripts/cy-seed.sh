#!/bin/sh

cypress-scripts/foundry-seed.sh

if [ -z ${YAML_OUTPUT_COUNTER} ];
then
  cypress-scripts/ingest-users.sh
fi

echo
