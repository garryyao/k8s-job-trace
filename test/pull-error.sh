#!/usr/bin/env bash

kubectl replace --force -f test/jobspecs/pull-error.yaml
k8s-job-trace pull-error
