#!/bin/sh

YAML_OUTPUT_COUNTER_START=${YAML_OUTPUT_COUNTER_START:-"1"};

for COUNT in `seq ${YAML_OUTPUT_COUNTER_START} $1`; do
    export YAML_OUTPUT_COUNTER=$COUNT;
    npm run cy-seed;
done
