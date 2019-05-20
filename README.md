# k8s-job-trace

This script tracks the execution of [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/) and report their completion success/failure. It requires `kubectl` to communicate with k8s cluster and wait for the job to complete. Logs generated from pod(s) running the job are piped to stdout/stderr in the current process, it's mean to shield off the details of which pods are running this job. When all you care about is a run to completion process.   

### Installing

```
npm install k8s-job-trace
```

### Prerequisites

You will need to [install] `kubectl` [on the system](https://kubernetes.io/docs/tasks/tools/install-kubectl/) where this script is to run. 

Also make sure your `kubectl` have been setup to [access](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/) the desired cluster(s), this might need contacting the admin of your cluster if it's not managed by you.

You should have at least the permissions to view the jobs running in the cluster, verify by `kubectl get jobs -n <namespace>`, it should give a list of jobs (if any has created) like the following example:

```
$ kubectl get jobs
NAME        DESIRED   SUCCESSFUL   AGE
my-job           1             0            5s
```

## Getting Started

First, we should have a deployment of the job desired to run in someway, being it's deployed via `kubectl` or installed via [helm](https://helm.sh) isn't really important. As soon as you have permission to run the deploy and is acknowledged about it's successful deployment.

Generally you should run this script immediately following the deployment/helm install/helm upgrade, specifying the job name as argument:

```bash
# This is the command that deploys the job to cluster... 

# Trace job run to completion 
k8s-job-trace $YOUR_JOB_NAME

# The exit code should reflect success/failure
if [ $? -eq 0 ]
then
  echo "The job ran ok"
  exit 0
else
  echo "The job failed" >&2
  exit 1
fi
``` 

## Running the tests
To run test you need a (local) Kubernetes cluster where you have permission to deploy arbitrary job.

```
npm run test
```

This has been tested by running the script against different types of [job specs](./test/jobspecs), currently tested with the following cases: 

 - success job run
 - failed job run
 - job pod timed out (specified in `activeDeadlineSeconds`)
 - job pod has image pull-error: (either `ImagePullBackOff` or `ErrImagePull`)  

If you find a case not working for you, create an new issue and leave comments on how to reproduce it. 

### Code Style

JavaScript source are lint checked with [ESLint](https://eslint.org) & formatted by [Prettier](http://prettier.io)

`npm run lint`

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
