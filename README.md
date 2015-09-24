# po-web
A simple webclient for Pokemon Online written in javascript

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
npm install
bower install
grunt less
grunt concat
```

You may need to run the terminal in administrative mode (Windows) or do commands with sudo (Linux).

Open a terminal in the project directory and type the `grunt` command. It'll update automatically when files are changed.

### Running

Open `index.html` with your browser. 

You can instead run `nodejs server.js` and open your browser at http://localhost:7070.

### Configuration

You can edit `serverconfig.js`.