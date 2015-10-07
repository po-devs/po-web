module.exports = function(grunt) {

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
    './app/assets/javascript/backend.js'
  ];

  var js_frontend = [
    './bower_components/jquery/dist/jquery.js',
    './bower_components/bootstrap/dist/js/bootstrap.js',
    './bower_components/bootstrap-contextmenu/bootstrap-contextmenu.js',
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
              "./public/assets/stylesheets/backend.css":"./app/assets/stylesheets/backend.less"
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
        src: js_backend,
        dest: './public/assets/javascript/backend.js',
      },
      simple_copy: {
        src: ['./views/index.kiwi'],
        dest: './index.html'
      }
    },
    copy: {
      fonts: {
        files: [
          {expand: true, src: ['bower_components/bootstrap/dist/fonts/*'], dest: './public/assets/fonts/', filter: 'isFile', flatten: true}
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
