#!/bin/sh

SCRIPTS="${PL_FOUNDRY_DIR}/scripts"
FRAGMENTS="${SCRIPTS}/fragments"
OUTPUT="${SCRIPTS}/suite-regression.yaml"
NOW=`date`

echo "##### -------- THIS FILE IS GENERATED. DO NOT EDIT --------- #####" > $OUTPUT
echo "##### SEE edu-clients/cypress-scripts/combine-regression-yamls.sh #####" >> $OUTPUT
echo "##### last generated ${NOW} #####" >> $OUTPUT
cat $FRAGMENTS/suite-regression-base.yaml >> $OUTPUT
