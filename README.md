# po-web

A simple webclient for Pokemon Online written in javascript. You can try it [online](http://web.pokemon-online.eu).

### Requirements

On Linux:

```
sudo apt-get install nodejs npm

sudo npm install -g bower
sudo npm install -g grunt-cli
```

On Windows, install `chocolatey` and then in administrative command line:
```
choco install nodejs.install git

npm install -g bower
npm install -g grunt-cli
```

### Setup

In your project's directory:

```
git submodule init
git submodule update
npm install
bower install

grunt copy
grunt concat
grunt less
```

**Follow** the instructions in the [battle window folder](https://github.com/po-devs/po-battle-window) as well! Afterwards, as well as each time the battle window is rebuilt, do:

```
grunt copy
```

You may need to run the terminal in administrative mode (Windows) or do commands with sudo (Linux).

Open a terminal in the project directory and type the `grunt` command. It'll update automatically when `css` and `js` files are changed.

Basic explanation of the commmands:

* `npm install`: To run when nodejs dependencies are updated, aka `package.json` is changed
* `bower install`: To run when new libraries are downloaded via bower, aka `bower.json` is changed
* `grunt less`: To run when `.less` files are changed, generates the `.css` files.
* `grunt concat`: To run when the `.js` files are updated. Generates the aggregated `.js` files as well as the `.html` files
* `grunt copy`: To run once after `bower install` to copy bootstrap fonts to the `public/` folder. Also copies animated battle window files to `public/battle`.

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
