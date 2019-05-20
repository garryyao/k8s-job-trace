#!/usr/bin/env bash

kubectl replace --force -f test/jobspecs/fail.yaml
k8s-job-trace fail
