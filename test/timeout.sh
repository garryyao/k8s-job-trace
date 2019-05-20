#!/usr/bin/env bash

kubectl replace --force -f test/jobspecs/repeat.yaml
k8s-job-trace repeat
