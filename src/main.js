// @flow

import { spawn, exec } from 'child_process';
import path from 'path';
import commandExists from 'command-exists'

type STDResponse = {
  stdout: string,
  stderr: string
}

type ServiceOptions = {
  // _required_ Path to the compose yaml file
  composePath: string,
  // _optional_ default is true. recreate containers "docker-compose up --force-recreate ..."
  forceRecreate: bool,
  // _optional_ default is false. Place timestamps in log output. "docker-compose logs -t ..."
  timeStamps: bool,
  // _optional_ directory to execute docker-compose in, default is the directory with the compose yaml file
  workingDirectory: string
}

type RequiredServiceOptions = {
  composePath: string,
  forceRecreate?: bool,
  timeStamps?: bool,
  workingDirectory?: string
}

const defaultOptions: ServiceOptions = {
  forceRecreate: true,
  timeStamps: false,
  composePath: '',
  workingDirectory: ''
}

/*
 * Manages docker-compose commands
 */
export class DockerCompose {

  options: ServiceOptions
  composeCheck: Promise<bool>

  constructor(options: RequiredServiceOptions) {
    this.options = { ...defaultOptions, ...options }
    const opts = this.options
    if (!opts.workingDirectory) {
      opts.workingDirectory = path.dirname(path.resolve(opts.composePath))
    }

    // check for docker-compose command in system
    this.composeCheck = new Promise((resolve, reject) => {
      commandExists("docker-compose", (err, exists) => {
        if (err) return reject(err)
        if (!exists) return reject("docker-compose not found on PATH")
        return resolve(true)
      })
    })
  }

  /**
   * Performs a "docker-compose down" on one or more services.
   */
  async down(services: ?string|Array<string>, options: ?ServiceOptions): Promise<STDResponse> {
    await this.composeCheck
    if (!services) {
      return await this._downAllServices(options)
    } else if (typeof services === 'string') {
      return await this._downService(services, options)
    } else if (typeof services === 'object') {
      return await this._downService(services.join(' '), options)
    }
    throw new Error(`Invalid input parameter to "docker-compose down": ${services}`)
  }

  /**
   * Performs a "docker-compose kill" on one or more services.
   */
  async kill(services: ?string|Array<string>, options: ?ServiceOptions): Promise<STDResponse> {
    await this.composeCheck
    if (!services) {
      return await this._killService('', options)
    } else if (typeof services === 'string') {
      return await this._killService(services, options)
    } else if (typeof services === 'object') {
      return await this._killService(services.join(' '), options)
    }
    throw new Error(`Invalid input parameter to "docker-compose down": ${services}`)
  }

  /**
   * Performs a "docker-compose up" on one or more services.
   * @type {[type]}
   */
  async up(services: ?string|Array<string>, options: ?ServiceOptions): Promise<STDResponse> {
    await this.composeCheck
    if (!services) {
      return await this._upAllServices(options)
    } else if (typeof services === 'string') {
      return await this._upService(services, options)
    } else if (typeof services === 'object') {
      return await this._upService(services.join(' '), options)
    }
    throw new Error(`Invalid input parameter to "docker-compose up": ${services}`)
  }

  /*
   * Performs "docker-compose logs -f [service]" on specified service and
   * sends any messages received to onMessage
   */
  async logs(serviceName: string, onMessage: Function, options: ?ServiceOptions): Promise<*> {
    await this.composeCheck
    const { composePath, workingDirectory, timeStamps } = { ...this.options, ...options }

    const flags = [
      timeStamps ? '-t' : ''
    ]

    const proc = spawn('docker-compose',
      ['-f', composePath, 'logs', '-f']
      .concat(flags.filter(flag => flag !== ''))
      .concat([serviceName]), {
        cwd: workingDirectory
      })

    // Split data chunks into new lines, then send each new line to the
    // onMessage handler
    function onData(data: Buffer) {
      const strData = data.toString()
      strData.split('\n').forEach(str => onMessage(str))
    }

    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
  }

  async _killService(services: string, options: ?ServiceOptions): Promise<STDResponse> {
    return await this._execDockerComposeCommand(`kill ${services}`, options)
  }

  async _downAllServices(options: ?ServiceOptions): Promise<STDResponse> {
    return await this._execDockerComposeCommand('down', options)
  }

  async _downService(serviceName: string, options: ?ServiceOptions): Promise<STDResponse> {
    return await this._execDockerComposeCommand(`down ${serviceName}`, options)
  }

  async _upAllServices(options: ?ServiceOptions): Promise<STDResponse> {
    return await this._upService('', options)
  }

  async _upService(serviceName: string, options: ?ServiceOptions): Promise<STDResponse> {
    const { forceRecreate, timeStamps } = { ...this.options, ...options }
    const flags = [
      forceRecreate ? '--force-recreate ' : '',
      '-d ',
    ].join('').trim()
    return await this._execDockerComposeCommand(`up ${flags} ${serviceName}`, options)
  }

  async _execDockerComposeCommand(command: string, options: ?ServiceOptions): Promise<STDResponse> {
    const { composePath, workingDirectory } = { ...this.options, ...options }
    return new Promise((resolve, reject) => {
      exec(`docker-compose -f ${composePath} ${command}`, {
        cwd: workingDirectory
      }, (err, stdout, stderr) => {
        if (err) return reject(err)
        return resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString()
        })
      })
    })
  }

}

export default { DockerCompose }
