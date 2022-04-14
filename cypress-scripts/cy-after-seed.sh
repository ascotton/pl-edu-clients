#!/bin/sh

echo
echo "================================"
echo "           AFTER SEED           "
echo "================================"
echo

if [ $CY_SUITE == "basic-smoke" ];
then
  echo "RUNNING assignment_machine_auto_assign.yaml"
  cypress-scripts/foundry-yaml.sh assignment_machine_auto_assign.yaml
fi
