/* globals jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';
  
  var GameApi = {
    azmastermind: {
      endpoint: 'http://az-mastermind.herokuapp.com',
      actions: {
        start: '/new_game',
        guess: function(game_key){
          return '/guess'
        }
      }
    },
    masterhuemind: {
      endpoint: 'http://159.203.40.35',
      actions: {
        start: '/games',
        guess: function(game_key){
          return '/games'+game_key+'/guess'
        }
      }
    },
    getApi: function(option){
      if(option == 'masterhuemind'){
        return this.masterhuemind;
      }

      return this.azmastermind;
    }
  };

	var Game = {
    api: GameApi.masterhuemind,
	  init: function () {
      this.apiEndpoint = this.api.endpoint;
      this.themes = ['default', 'mario', 'lego', 'pokemon', 'birds'];
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
          '/img/theme.jpg);background-repeat:no-repeat;background-size:cover;"></li>' +
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
          that.clearGuessButton();
        })
        .on('click', '.theme-icon', function() {
          var theme = $(this).data('theme');
          that.loadTheme(theme);
        })
        .on('click', '.guess-code:first .checked:last', function() {
          that.clearGuess($(this));
        })
        .on('click', '#guess-check', function() {
          that.postGuess();
        })
        ;        
		},
    
    createGame: function() {
      var user = prompt("What's your name?");
      this.game_data = null;
      $.post(
        this.apiEndpoint + this.api.actions.start, {user: user}
      ).done(function(data) {
          this.game_data = data;
          this.game_data.guess_code = [];
          this.game_data.username = (user)? user : 'User';
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
      
      $('#username').show();
      $('#username span').html(this.game_data.username);
      $('.glyphicon-refresh').show();
    },
    
    guessCode: function(color) {
      if(!this.game_data) {
        return;
      }
      this.game_data.guess_code.push(color);   
      if(this.game_data.guess_code.length <= this.game_data.code_length) {
        $('.guess-code:first').html(
          '<li class="checked color' + 
          this.game_data.guess_code.join('"></li><li class="checked color') + 
          '"></li>' + 
          '<li></li>'.repeat(this.game_data.code_length - this.game_data.guess_code.length)
        );
        if(this.game_data.guess_code.length == this.game_data.code_length){
          $('#guess-check').prop("disabled", false);
        }
      } 
    },
    
    clearGuess: function (item) {
      item.removeClass();
      this.game_data.guess_code.pop();  
      this.clearGuessButton();
    },
    
    clearGuessButton: function(){
      $('.guess-code:first li').attr('data-content','');
      $('.guess-code:first li.checked:last').attr('data-content','x').css('cursor','pointer');
    },
    
    postGuess: function(){
      this.game_data.guess_code = this.game_data.guess_code.slice(0,this.game_data.code_length);
      if(this.game_data.guess_code.length == this.game_data.code_length) {
        var code = this.game_data.guess_code.join('');
                
        $.post(
          this.apiEndpoint + this.api.actions.guess(this.game_data.game_key), 
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
            $('#guess-check').prop("disabled", true);
          }.bind(this)
        ).fail(function(err){
            this.clearGame();
            console.log(err);
          }.bind(this)
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
			$('#game-attempts').html((this.game_data.past_results.length <= 9)? '0' + this.game_data.past_results.length: this.game_data.past_results.length );
		}
	};

	Game.init();
});