/* globals jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';
  
	var Game = {
		init: function () {
      this.apiEndpoint = 'http://az-mastermind.herokuapp.com';
      this.themes = ['default', 'lego', 'mario', 'pokemon'];
      this.clearGame();
      this.loadTheme(this.themes[0]);
      this.renderThemes();
      this.bindEvents();
		},
    
    loadTheme: function(theme) {
      var css_id = 'theme-style';
      $('#' + css_id).remove();
      $('head').append(
        '<link id="' + css_id + '" rel="stylesheet" type="text/css" href="themes/' + theme + '/css/theme.css" media="all">'
      );
    },
    
    renderThemes: function() {
      var themes = '', theme;
      for(var i=this.themes.length; i--;) {
        theme = this.themes[i];
        themes = '<li class="theme-icon" data-theme="' + theme + 
          '" style="background-image:url(themes/' + theme + 
          '/img/icon.png);background-repeat:no-repeat;background-size:cover;"></li>' +
          themes;
      }
      $('#themes').append(themes);
    },
    
    bindEvents: function () {
      var that = this;
			$('#game-container')
				.on('click', '#new-game', this.createGame.bind(that))
        .on('click', '.colors-list > li', function() {
          var color = $(this).data('color');
          that.guessCode(color);
        })
        .on('click', '.theme-icon', function() {
          var theme = $(this).data('theme');
          that.loadTheme(theme);
        });
        
		},
    
    createGame: function() {
      var user = prompt("What's your name?");
      this.game_data = null;
      $.post(
        this.apiEndpoint + '/new_game', {user: user}
      ).done(function(data) {
          this.game_data = data;
          this.game_data.guess_code = [];
          this.startGame();
          this.renderGame();
        }.bind(this)
      ).fail(function(err){
          alert('The game cannot be created. Try again please.');
          console.log(err);
        }
      );
    },
    
    startGame: function() {
      var colors_list = $('.colors-list'), color;
      colors_list.empty();
      for(var i=this.game_data.colors.length; i--;) {
        color = this.game_data.colors[i];
        colors_list.prepend('<li class="color' + color + '" data-color="' + color + '"></li>');
      }
      
      $('#guesses, #guesses-results').empty();
      
      $('#start-screen').hide();
      $('#game-board').show();
    },
    
    guessCode: function(color) {
      if(!this.game_data) {
        return;
      }
      
      this.game_data.guess_code.push(color);
      if(this.game_data.guess_code.length == this.game_data.code_length) {
        var code = this.game_data.guess_code.join('');
                
        $.post(
          this.apiEndpoint + '/guess', 
          { game_key: this.game_data.game_key,
            code: code }
        ).done(function(data) {
            if($.type(data.result) === "string") {
              if(data.solved === "true") {
                this.game_data = data;
                this.renderGame();
                this.game_data = null;
              }
              else {
                this.clearGame();
              }
              alert(data.result);
            }
            else {
              this.game_data = data;
              this.game_data.guess_code = [];
              this.renderGame();
            }
          }.bind(this)
        ).fail(function(err){
            this.clearGame();
            console.log(err);
          }.bind(this)
        );
      }
      else {
        $('.guess-code:first').html(
          '<li class="color' + 
          this.game_data.guess_code.join('"></li><li class="color') + 
          '"></li>' + 
          '<li></li>'.repeat(this.game_data.code_length - this.game_data.guess_code.length)
        );
      }
    },
    
    clearGame: function() {
      $('#game-board').hide();
      $('#start-screen').show();
      this.game_data = null;
    },
    
		renderGame: function () {
      var guess_code, guess_result, result,
          guesses = '<ul class="guess-code">' + '<li></li>'.repeat(this.game_data.code_length) + '</ul>', 
          guesses_results = '<ul class="guess-result">' + '<li></li>'.repeat(this.game_data.code_length) + '</ul>';
      
      for(var i=this.game_data.past_results.length; i--;) {
        result = this.game_data.past_results[i];
        
        guess_code = '<ul class="guess-code"><li class="color' + 
          result.guess.split('').join('"></li><li class="color') + 
          '"></li></ul>';
          
        guess_result = '<ul class="guess-result">' + 
          '<li class="exact"></li>'.repeat(result.exact) + 
          '<li class="near"></li>'.repeat(result.near) + 
          '<li></li>'.repeat(this.game_data.code_length - result.near - result.exact) + 
          '</ul>';
        
        guesses += guess_code;
        guesses_results += guess_result;
      }
      
      $('#guesses').html(guesses);
      $('#guesses-results').html(guesses_results);
      $('#game-attempts').html(this.game_data.past_results.length);
		}
	};

	Game.init();
});