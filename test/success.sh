#!/usr/bin/env bash

kubectl replace --force -f test/jobspecs/success.yaml
k8s-job-trace pi
