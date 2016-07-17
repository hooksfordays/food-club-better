// ==UserScript==
// @name         r/neopets Food Club Better
// @namespace    https://www.reddit.com/u/hooksfordays
// @version      1.0.0
// @description  Turns reddit-formatted tables into food club bets
// @author       /u/hooksfordays
// @match        https://www.reddit.com/r/neopets/comments/*
// @match        http://www.neopets.com/pirates/foodclub.phtml?type=bet
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @copyright    2016+, /u/hooksfordays
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

// Mapping of shorthand pirate names to full names in drop down lists
var pirateMap = {
  'Crossblades': 'Captain Crossblades',
  'Sproggie': 'Young Sproggie',
  'Edmund': 'Sir Edmund Ogletree',
  'Squire': 'Squire Venable',
  'Federismo': 'Federismo Corvallio',
  'Lucky': 'Lucky McKyriggan',
  'Dan': 'Scurvy Dan the Blade',
  'Fairfax': 'Fairfax the Deckhand',
  'Buck': 'Buck Cutlass',
  'Orvinn': 'Orvinn the First Mate',
  'Tailhook': 'The Tailhook Kid',
  'Bonnie': 'Bonnie Pip Culliford',
  'Pip': 'Bonnie Pip Culliford',
  'Stuff': 'Stuff-A-Roo',
  'Blackbeard': 'Admiral Blackbeard',
  'Franchisco': 'Franchisco Corvallio',
  'Puffo': 'Puffo the Waister',
  'Gooblah': 'Gooblah the Grarrl',
  'Peg': 'Peg Leg Percival',
  'Peg Leg': 'Peg Leg Percival',
  'Ned': 'Ned the Skipper',
  'Stripey': 'Ol\' Stripey',
};

// List of arenas in most common order
var arenas = [
  'Shipwreck',
  'Lagoon',
  'Treasure Island',
  'Hidden Cove',
  'Harpoon Harry\'s',
];

// URL for placing bets
var bettingURL = 'http://www.neopets.com/pirates/foodclub.phtml?type=bet';

// Identifier for preferences created by this script
var preferenceID = 'u.hooksfordays.foodclub';
// Preference to indicate if the script is currently being used to place a bet
var prefPlacingBet = preferenceID + '.placingBets';
// Preference for storing bet to be placed
var prefBet = preferenceID + '.bet';

// Matches table headers for betting tables
var reBettingTable = new RegExp('\\s*<th align="center">\\d+</th>\\s*<th>Shipwreck</th>\\s*<th>Lagoon</th>\\s*<th>Treasure</th>\\s*<th>Hidden</th>\\s*<th>Harpoon</th>\\s*<th align="right">Odds</th>\\s*', 'g');

// Deletes data stored
var clearPreferences = function() {
  GM_deleteValue(prefPlacingBet);
  GM_deleteValue(prefBet);
}

var parseTables = function($) {
  var allTables = $('table');
  var totalBets = 0;

  allTables.each(function() {
    var tableHeader = $(this).children('thead').first().children('tr').first();

    // Find tables that have the betting header
    // For some reason, only testing once doesn't get all the tables......
    if (reBettingTable.test(tableHeader.html()) || reBettingTable.test(tableHeader.html())) {
      tableHeader.append('<th>FCB</th>');
      $(this).children('tbody').first().children('tr').each(function() {
        totalBets++;
        $(this).append('<td><button id="bet' + totalBets + '">Bet</button></td>');
        $('#bet' + totalBets).on('click', prepareBet.bind(this, $, $(this)));
      });
    }
  });
};

var prepareBet = function($, tr) {
  var pirates = {};
  tr.children('td').each(function(index) {
    if (index === 0) {
      // Skip the Bet # column
      return;
    }

    // Set the pirate chosen for the arena
    if ($(this).html() in pirateMap) {
      pirates[arenas[index - 1]] = pirateMap[$(this).html()];
    }
  });

  GM_setValue(prefPlacingBet, 'true');
  GM_setValue(prefBet, JSON.stringify(pirates));
  open(bettingURL, '_blank');
};

// Attempts to setup a bet on the betting page
var placeBet = function($) {
  var isPlacingBet = GM_getValue(prefPlacingBet, 'false') === 'true';
  console.log(isPlacingBet);
  if (isPlacingBet) {
    // Get the current bet and select the arenas and pirates
    var bet = JSON.parse(GM_getValue(prefBet, '{}'));
    if (bet != {}) {
      console.log(bet);
      var bettingForm = $('form[name="bet_form"]');
      bettingForm.find('b').each(function() {
        var arenaName = $(this).html();

        // Found a table row that is in the bet
        if (arenaName in bet) {
          // Set the pirate
          $(this).parent().parent().find('select').first().find('option').each(function() {
            var optionHTML = $(this).html();
            if (optionHTML.indexOf(bet[arenaName]) === 0) {
              $(this).parent().val($(this).attr('value')).change();
            }
          });

          // Select the checkbox for this bet
          $(this).siblings('input').first().attr('checked', true)[0].onclick();
        }
      });

      // Get the maximum betting amount (knowing that you can only win 1 million in a bet)
      var oddsInputVal = $('input[name="total_odds"]').val();
      var odds = parseInt(oddsInputVal.substring(0, oddsInputVal.indexOf(':')));
      var maximumBetAmount = Math.min(Math.ceil(1000000 / odds), max_bet);
      console.log(maximumBetAmount);

      // Input the maximum betting amount
      var betAmountInput = $('input[name="bet_amount"]');
      betAmountInput.focus();
      betAmountInput.val(maximumBetAmount.toString());
      betAmountInput.blur();
      clearPreferences();
    }
  }
};

window.addEventListener('load', (function($) {
  if (window.location.href === bettingURL) {
    // Try to place bets when the betting screen is loaded
    placeBet($);
  } else if (document.title.indexOf('Food Club Bets') >= 0) {
    // Add 'Bet' buttons to the table
    parseTables($);
  }
})(jQuery), false);