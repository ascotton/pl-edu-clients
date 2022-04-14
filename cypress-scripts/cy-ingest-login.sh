#!/bin/sh

export YAML_OUTPUT_COUNTER=$1;
npm run cy-ingest;
npm run cy-login;
