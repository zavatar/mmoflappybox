//Gruntfile
module.exports = function(grunt) {

//Initializing the configuration object
    grunt.initConfig({
        // Task configuration
        copy: {
            main: {
                expand: true,
                src: [
                    './assets/*.png',
                    './assets/*.wav',
                ],
                dest: './static/',
                flatten: true,
                filter: 'isFile'
            }
        },
        less: {
            development: {
                options: {
                    compress: true,
                },
                files: {
                    "./static/stylesheets/styles.css": "./assets/stylesheets/styles.less",
                }
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            js: {
                src: [
                    './bower_components/jquery/dist/jquery.js',
                    './bower_components/alertify.js/lib/alertify.js',
                    './assets/flappy.js'
                ],
                dest: './static/flappy.js',
            },
        },
        watch: {
            js: {
                files: [
                    './bower_components/jquery/dist/jquery.js',
                    './bower_components/alertify.js/lib/alertify.js',
                    './assets/flappy.js'
                ],
                tasks: ['concat:js']
            },
            less: {
                files: ['./assets/stylesheets/*.less'],
                tasks: ['less']
            },
            copy: {
                files: [
                    './assets/*.png',
                    './assets/*.wav'
                ],
                tasks: ['copy']
            },
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Define tasks
    grunt.registerTask('default', ['concat:js', 'less', 'copy']);

};