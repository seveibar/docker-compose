# docker-compose for nodejs

*Note: This is still a very early stage project*

This is a simple library for controlling docker-compose from node.

## Why

Controlling `docker-compose` from node allows for multi-container integration
tests and automation of command line tasks from node.

## Getting States

### Quick Example

```javascript
import { DockerCompose } from 'docker-compose'
// let DockerCompose = require('docker-compose').DockerCompose

let compose = new DockerCompose({
  composePath: './docker-compose.yml'
})

compose.up('hello_world_service').then(() => {
  compose.logs('hello_world_service', (message) => {
    console.log(`received ${message} from container stdout`)
  })
})
```

### new DockerCompose(options)

Create a new `DockerCompose` instance. Each `DockerCompose` instance has a
set of options associated with it that link it to a docker compose file or
default options for output, container creation, etc.

```javascript
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
```

### compose.up(services: ?string|Array<string>, options: ?ServiceOptions): Promise

Start one or more services. Equivalent to `docker-compose up [services]`.

Promise resolves when `up` is complete, which is not necessarily when the
container finishes (the -d flag is used by default, running `up` as a daemon.
Use compose.logs to watch for the exit.

### compose.down(services: ?string|Array<string>, options: ?ServiceOptions): Promise

Down one or more services. Equivalent to `docker-compose down [services]`.

Promise resolves when `down` is complete.

### compose.kill(services: ?string|Array<string>, options: ?ServiceOptions): Promise

Kill one or more services. Equivalent to `docker-compose kill [services]`.

Promise resolves when `kill` is complete.

### compose.logs(services: ?string|Array<string>, onMessage:Function, options: ?ServiceOptions): Promise

Watch the logs on one or more services. Equivalent to `docker-compose logs [services]`.

Promise resolves after spawning command (basically instantly).

`onMessage` will receive a string line from `docker-compose logs`. Each line will be returned
individually.

## Contributing

Contributions via pull requests are welcome. If you find a problem please [file an issue](http://github.com/seveibar/docker-compose/issues).

### Running Tests

Just run `npm test` or `yarn test`.
