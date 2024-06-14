import { ToadScheduler, CronJob, AsyncTask } from 'toad-scheduler'

const initScheduler = () => {
  const scheduler = new ToadScheduler()

  const schedule = (callback, interval) => {
    if (!callback.name) throw Error('callback should be named function')
    const task = new AsyncTask(callback.name, callback, (err) => {
      console.error(err)
    })
    const job = new CronJob({ cronExpression: interval }, task, {
      preventOverrun: true,
    })

    scheduler.addCronJob(job)
  }

  const clear = () => {
    for (const job of scheduler.getAllJobs()) {
      scheduler.removeById(job.id)
    }
  }

  const stop = () => {
    console.log('Stop scheduler')
    scheduler.stop()
  }

  return { schedule, stop, clear }
}

export default initScheduler
