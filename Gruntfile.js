module.exports = function(grunt) {

  var poke_base_db = [
    './db/moves/moves.js',
    './db/moves/move_message.js',
    './db/moves/type.js',
    './db/pokes/pokemons.js',
    './db/generations.js',
    './db/generations.options.js',
    './db/abilities/abilities.js',
    './db/abilities/ability_messages.js',
    './db/items/items.js',
    './db/items/berries.js',
    './db/items/item_messages.js',
    './db/items/berry_messages.js',
    './db/status/stats.js',
    './db/status/status.js',
    './db/types/types.js'
  ];

  var js_backend = [
    './app/assets/javascript/config.js',
    './app/assets/javascript/libs/riot.js',
    './app/assets/javascript/libs/md5.js',
    './app/assets/javascript/postorage.js',
    './app/assets/javascript/network.js',
    './app/assets/javascript/serverconnect.js',
    './app/assets/javascript/players.js',
    './app/assets/javascript/channels.js',
    './app/assets/javascript/pms.js',
    './app/assets/javascript/battles/battledata.js',
    './app/assets/javascript/battles/battles.js',    
    './app/assets/javascript/battles/commandhandling.js', 
    './app/assets/javascript/pokeinfo.js',
    './app/assets/javascript/backend.js'
  ];

  var js_frontend = [
    './bower_components/jquery/dist/jquery.js',
    './bower_components/bootstrap/dist/js/bootstrap.min.js',
    './bower_components/bootstrap3-dialog/dist/js/bootstrap-dialog.min.js',
    './bower_components/bootstrap-contextmenu/bootstrap-contextmenu.js',
    './bower_components/mjolnic-bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js',
    './app/assets/javascript/libs/vex.combined.min.js',
    './app/assets/javascript/utils.js',
    './app/assets/javascript/basetab.js',
    './app/assets/javascript/chat.js',
    './app/assets/javascript/channeltab.js',
    './app/assets/javascript/pmtab.js',
    './app/assets/javascript/battles/battletab.js',
    './app/assets/javascript/playerlistui.js',
    './app/assets/javascript/channellistui.js',
    './app/assets/javascript/battles/battlelistui.js',
    './app/assets/javascript/pmlistui.js',
    './app/assets/javascript/frontend.js'
  ];

  var js_teambuilder = [
    './bower_components/typeahead.js/dist/typeahead.jquery.min.js',
    './app/assets/javascript/teambuilder.js'
  ];

  //Initializing the configuration object
    grunt.initConfig({

      // Task configuration
    less: {
        development: {
            options: {
              compress: true,  //minifying the result
            },
            files: {
              //compiling frontend.less into frontend.css
              "./public/assets/stylesheets/frontend.css":"./app/assets/stylesheets/frontend.less",
              //compiling backend.less into backend.css
              "./public/assets/stylesheets/backend.css":"./app/assets/stylesheets/backend.less",
              "./public/assets/stylesheets/teambuilder.css":"./app/assets/stylesheets/teambuilder.less"
            }
        }
    },
    concat: {
      options: {
        separator: ';',
      },
      js_frontend: {
        src: js_frontend,
        dest: './public/assets/javascript/frontend.js',
      },
      js_backend: {
        src: js_backend.concat(poke_base_db),
        dest: './public/assets/javascript/backend.js',
      },
      js_teambuilder: {
        src: js_teambuilder,
        dest: './public/assets/javascript/teambuilder.js',
      },
      simple_copy: {
        src: ['./views/index.kiwi'],
        dest: './index.html'
      },
      simple_copy_battle: {
        src: ['./views/battle-canvas.kiwi'],
        dest: './battle-canvas.html'
      },
      simple_copy_settings: {
        src: ['./views/settings.kiwi'],
        dest: './settings.html'
      },
      simple_copy_colors: {
        src: ['./bower_components/mjolnic-bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css'],
        dest: './app/assets/stylesheets/bootstrap-colorpicker.less'
      }
    },
    copy: {
      files: {
        files: [
          {expand: true, src: ['bower_components/bootstrap/dist/fonts/*'], dest: './public/assets/fonts/', filter: 'isFile', flatten: true},
          {expand: true, cwd: 'animated-battle-window/html/build/dist/html/', src: ['**'], dest: './public/battle/html/'},
          {expand: true, cwd: 'animated-battle-window/assets/', src: ['**'], dest: './public/battle/'},
          {expand: true, cwd: 'bower_components/mjolnic-bootstrap-colorpicker/dist/img/', src: ['**'], dest: './public/assets/img/'}
        ]
      }
    },
    uglify: {
      options: {
        mangle: false  // Use if you want the names of your functions and variables unchanged
      },
      frontend: {
        files: {
          './public/assets/javascript/frontend.js': './public/assets/javascript/frontend.js',
        }
      },
      backend: {
        files: {
          './public/assets/javascript/backend.js': './public/assets/javascript/backend.js',
        }
      },
    },
    phpunit: {
        classes: {
        },
        options: {
        }
    },
    watch: {
        js_frontend: {
          files: js_frontend,   
          tasks: ['concat:js_frontend'/*,'uglify:frontend'*/],     //tasks to run
          options: {
            livereload: true                        //reloads the browser
          }
        },
        js_backend: {
          files: js_backend,   
          tasks: ['concat:js_backend','uglify:backend'],     //tasks to run
          options: {
            livereload: true                        //reloads the browser
          }
        },
        simple_copy: {
          files: ['./views/index.kiwi'],   
          tasks: ['concat:simple_copy'],     //tasks to run
          options: {
            livereload: true                        //reloads the browser
          }
        },
        less: {
          files: ['./app/assets/stylesheets/*.less'],  //watched files
          tasks: ['less'],                          //tasks to run
          options: {
            livereload: true                        //reloads the browser
          }
        },
 /*       tests: {
          files: ['app/controllers/*.php','app/models/*.php'],  //the task will run only when you save files in this location
          tasks: ['phpunit']
        }*/
      }
    });

  // Plugin loading
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  //grunt.loadNpmTasks('grunt-phpunit');

  // Task definition
  grunt.registerTask('default', ['watch']);

};
