/** @flow */

import path from 'path'
import { DockerCompose } from '../src/main';

describe('docker-compose tests', () => {
  let compose
  beforeAll(() => {
    compose = new DockerCompose({
      composePath: path.resolve(__dirname, 'sample-compose.yml'),
      timeStamps: true
    })
  })

  it('should run a service', async () => {
    await compose.up('hello_world')
    return await new Promise((resolve, reject) => {
      let gotHelloWorld = false
      let gotExit = false
      compose.logs('hello_world', (message) => {
        gotHelloWorld = gotHelloWorld || message.includes('hello world')
        gotExit = gotExit || message.includes('exited with code 0')
        if (gotHelloWorld && gotExit) resolve()
      })
    })
  })

  it('should be able to run all containers', async () => {
    let gotHelloWorld = false
    let gotMorning = false

    await compose.up()
    return await new Promise((resolve, reject) => {
      compose.logs('hello_world', (message) => {
        if (message.includes('hello world')) {
          gotHelloWorld = true
        }
        if (gotHelloWorld && gotMorning) {
          resolve()
        }
      })
      compose.logs('sleeper_hello', (message) => {
        if (message.includes('morning')) {
          gotMorning = true
        }
        if (gotHelloWorld && gotMorning) {
          resolve()
        }
      })
    })
  })

  /*
   * Runs the "sleeper_hello" service which outputs "morning" after 2 seconds. If "morning"
   * is not output and after down is called then the test is successful, because the
   * container had been killed.
   */
  it('should be able to kill services', async () => {
    await compose.up()
    return await new Promise((resolve, reject) => {
      compose.logs('sleeper_hello', (message) => {
        if (message.includes('morning')) {
          reject("kill() did not successfully stop the service")
        }
      })
      setTimeout(() => {
        resolve()
      }, 2500)
      compose.kill()
    })
  })
})
