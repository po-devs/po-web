# po-web
[![Build Status](https://travis-ci.org/po-devs/po-web.png)](https://travis-ci.org/po-devs/po-web)

A simple webclient for Pokemon Online written in javascript. You can try it [online](http://web.pokemon-online.eu).

### Requirements

On Linux:

```
sudo apt-get install nodejs npm

sudo npm install -g webpack
```

On Windows, install `chocolatey` and then in administrative command line:
```
choco install nodejs.install git

npm install -g webpack
```

### Setup

In your project's directory:

```
git submodule init
git submodule update
npm install

webpack
```

**Follow** the instructions in the [battle window folder](https://github.com/po-devs/po-battle-window) as well! Afterwards, as well as each time the battle window is rebuilt, do:

```
grunt copy
```

You may need to run the terminal in administrative mode (Windows) or do commands with sudo (Linux).

### Updating

You may need to do `npm install` and `webpack` after updating.

### Running

Run `node server.js` and open your browser at http://localhost:7070.

### Run locally

```bash

sudo npm install -g electron

electron main.js
```

### Configuration

You can edit `serverconfig.js`.

### Deploy 

```bash
sudo npm install electron-packager -g

electron-packager . --all --out=build/Release --ignore="animated-battle-window" --ignore="app/assets" --ignore="build" --ignore="bower_components" --ignore="scripts"
```

### Additional Setup

You may want to install other things in order to run the scripts: `python3` and `imagemagick`. They can be both installed in a similar fashion with `apt-get` / `choco`.
