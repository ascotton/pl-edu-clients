#!/bin/sh

SCRIPTS="${PL_FOUNDRY_DIR}/scripts"
FRAGMENTS="${SCRIPTS}/fragments"
OUTPUT="${SCRIPTS}/suite-basic-smoke.yaml"
NOW=`date`

echo "##### -------- THIS FILE IS GENERATED. DO NOT EDIT --------- #####" > $OUTPUT
echo "##### SEE edu-clients/cypress-scripts/combine-basic-yamls.sh #####" >> $OUTPUT
echo "##### last generated ${NOW} #####" >> $OUTPUT
cat $FRAGMENTS/suite-basic-smoke-base.yaml >> $OUTPUT
cat $FRAGMENTS/provider-qualifications.yaml >> $OUTPUT
