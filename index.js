#!/usr/bin/env node

/**
 * @overview
 * This script follows a kubernetes job util it's run to completion:
 *  - exit with 0 if job succeed
 *  - exit with 1 if job has failed or timed out
 *
 * The `kubectl` commands have to be available for this to work.
 *
 * See [Kubernetes Jobs]{@link https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion}
 */
const { execSync, spawn } = require('child_process');

const run = (cmd, options = {}) => {
  return execSync(cmd, {
    encoding: 'utf8',
    ...options
  });
};

const sub = (cmd, args, options = {}) => {
  return spawn(cmd, args, {
    encoding: 'utf8',
    ...options
  });
};

const getJobInfo = jobName => {
  let jobOutput;
  try {
    jobOutput = run(`kubectl get jobs/${jobName} -o json`);
  } catch (e) {
    // job doesn't exists
    process.exit(1);
  }

  return JSON.parse(jobOutput);
};

/**
 * Report job status based on it's pods' completion
 * @param jobName
 * @returns {string}
 */
const getJobStatus = jobName => {
  const { status, spec } = getJobInfo(jobName);
  if (status.succeeded >= spec.completions) return 'Completed';
  if (status.failed >= spec.backoffLimit) return 'Failed';
  if (
    status.conditions &&
    status.conditions.find(
      cond => cond.type === 'Failed' && cond.reason === 'DeadlineExceeded'
    )
  ) {
    return 'DeadlineExceeded';
  }

  if (status.active) return 'Running';
  return 'Unknown';
};

/**
 * Poll the job status for it's completion/error/timeout, report the status
 * @param jobName
 * @param logJobOutput
 * @throws JobTimeoutError
 * @returns {Promise<{'Completed' | 'Failed' | 'Running'}>} eventual job status
 */
const runToCompletion = (jobName, logJobOutput = false) => {
  let logger = null;
  let containerStatus = null;

  const stopLogging = () => {
    logger && logger.kill('SIGKILL');
  };

  const startLogging = () => {
    if (!logger) {
      logger = followJobLogs(jobName);
    }
  };

  return new Promise(resolve => {
    const checkJobCompletion = () => {
      const status = getJobStatus(jobName);

      switch (status) {
        case 'Running':
          if (containerStatus !== 'Running') {
            containerStatus = getContainerStatus(jobName);
          }

          if (containerStatus === 'ErrImagePull') {
            clearInterval(task);
            resolve(containerStatus);
            return;
          }

          // job is really running
          if (containerStatus === 'Running' && logJobOutput) {
            startLogging();
          }

          return;
        case 'Failed':
        case 'DeadlineExceeded':
        case 'Completed':
          clearInterval(task);
          if (logJobOutput) stopLogging();
          resolve(status);
          break;
        case 'Unknown':
          return;
      }
    };

    // keep polling every 1s until it's completed
    const task = setInterval(checkJobCompletion, 1e3);

    checkJobCompletion();
  });
};

/**
 * Output logs from first container of a job named hello
 * @param jobName
 */
const followJobLogs = jobName =>
  sub('kubectl', ['logs', '-f', `job/${jobName}`], { stdio: 'inherit' });

const getContainerStatus = jobName => {
  try {
    // cheaper way to pull container state
    run(`kubectl logs --tail=1 job/${jobName}`, { stdio: 'pipe' });
    return 'Running';
  } catch ({ stderr }) {
    // Image pull error
    if (/image can't be pulled/.test(stderr)) return 'ErrImagePull';
    if (/ContainerCreating/.test(stderr)) {
      return 'Creating';
    }
  }
};

async function main() {
  const jobName = process.argv[2];
  if (!jobName) {
    console.error('job release name not specified');
    process.exit(1);
  }

  const status = await runToCompletion(jobName, true);

  console.log(`job/${jobName} status: ${status}\n`);

  process.exit(status === 'Completed' ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  runToCompletion
};
