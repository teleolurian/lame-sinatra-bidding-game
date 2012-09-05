// put project specific code here
$init.add('*', function(){
  var pros = new Prospector();
  pros.start();
  
});


Prospector = function(){
  this.biddableCards = {};
  this.ownedCards = {};
  this.phases = ['next-turn', 'add-card-to-market', 'wait-for-bid', 'roll-for-production', 'end-turn'];
  this.phase = -1;
  this.cards_generated = 0;
  this.userCash = 100;
  this.turnsLeft = 25;
  this.statsBar = $('#stats-list');
  this.dieResult = null;
  
  // UTILITY FUNCTIONS  
  this.d6 = function(){
    return parseInt(Math.random() * 6 + 1);
  }
  
  this.updateStats = function(){
    this.statsBar.find('.turn-count').text(25-this.turnsLeft);
    this.statsBar.find('.cash').text('$' + this.userCash);
    this.statsBar.find('.phase').text(this.phases[this.phase]); 
  }
  
  this.createCard = function(){
    var card = {}
    ;
    card.id = ++this.cards_generated;
    card.target = (this.d6() + this.d6());
    card.payoff = parseInt(this.d6() + this.d6() / 2);
    card.broken = (this.d6() + this.d6());
    card.bid_price = Math.max(parseInt(this.estimateBidPrice(card) * (Math.random()+0.5)), 2);
    return card;
  };
  
  this.estimateBidPrice = function(card){
    var target_value =  Math.abs(8 - card.target)
      , broken_penalty = Math.abs(8 - card.broken)
      , result
    ;
    result = Math.max(1,
      Math.sqrt(Math.max(4, Math.pow(target_value, 2) - Math.pow(broken_penalty, 2))) * (0.5 * card.payoff)
    );
    return result;
  };
  
  this.cardForDiv = function($d, key){
    var i = this.idForDiv($d);
    if (typeof i == "undefined") return false;
    return this[key][i];
  }
  
  this.idForDiv = function($d){
    var ids = $d.attr('id').match(/\-(\d+)/);
    return (typeof ids == "undefined") ? undefined : ids[1];
  }
    

  this.rollTheDice = function(){
    // yes this can probably be done more DRY. pft
    var d1 = this.d6()
      , d2 = this.d6()
    ;
    $('#die-1').removeClasses(/side/).addClass('side-'+d1);
    $('#die-2').removeClasses(/side/).addClass('side-'+d2);
    return d1+d2;
  }
  
  this.start = function(){
    for (var i = 0; i < 5; i++) this.addCardToMarket(true);
    this.advancePhase();
  }
  
  this.addCardToMarket = function(skip_advance){
    var newcard = this.createCard()
      , gthis = this
    ;
    this.biddableCards[newcard.id] = newcard;
    $('#template-mine').tmpl(newcard).appendTo('#market');
    this.makeBiddableCardsSelectable();
    if (!skip_advance) this.advancePhase();
  }
  
  this.makeBiddableCardsSelectable = function(){
    var gthis = this;
    $('#market .mine').each(function(){
      var $this = $(this);
      $this.toggleClass('selectable', function(){
        return this.cardForDiv($this, 'biddableCards').bid_price <= this.userCash;
      });
    });
    $('#market .mine.selectable').click(function(){
      gthis.selectMine($(this));
    });
  }
  
  this.clearControlButtons = function(){
    this.statsBar.find('.controls').html('');
  }
  
  this.makeControlButton = function(args){
    var gthis = this;
    return $('#template-control-button').tmpl(args).appendTo(this.statsBar.find('.controls')).click(function(){
      var $this = $(this);
      gthis.handleControlClick($this.data('control'), $this.data('value'));
    });
  }
  
  /* for turn advancement, we will just use advancePhase
  * to start preparations for the next turn.
  *
  */
  
  this.advancePhase = function(){
    this.phase = (this.phase + 1) % this.phases.length;
    this.updateStats();
    this.preparePhase();
  }
  
  this.nextTurn = function(){
    this.turnsLeft--;
    if (this.turnsLeft < 1){
      this.endGame();
    } else {
      this.advancePhase();
    }
  }
  
  this.waitForBid = function(){
    this.clearControlButtons();
    this.redraw('biddableCards');
    this.makeControlButton({control: 'next-phase', value: '', title: 'Skip Bid'});
    this.makeBiddableCardsSelectable();
  }
  
  this.handleControlClick = function(control, value){
    if (control == 'next-phase') this.advancePhase();
  }
  
  this.selectMine = function($mine){
    if (this.phases[this.phase] != 'wait-for-bid' || !$mine.hasClass('selectable')) return;
    var i = this.idForDiv($mine);
    if (i){
      this.ownedCards[i] = this.biddableCards[i];
      this.userCash -= this.ownedCards[i].bid_price;
      delete this.biddableCards[i];
      $mine.remove();
      this.redraw('ownedCards');
      this.advancePhase();
    }
  }
  
  this.clearTheDice = function(){
    $('.dice').removeClasses(/side/);
  }
  
  this.rollForProduction = function(){
    this.dieResult = this.rollTheDice();
    this.clearControlButtons();
    this.makeControlButton({control: 'next-phase', title: 'Next Phase'}).addClass('i-am-the-only-way');
    $('#market .mine.selectable').removeClass('selectable');
    console.info(this.dieResult);
    // produce all owned cards that produced, mark for deletion all cards that are going to be deleted
    for (i in this.ownedCards){
      var card = this.ownedCards[i];
      if (card.target == this.dieResult){
        this.userCash += card.payoff;
        $('#mine-'+card.id).addClass('jackpot');
      }
      if (card.broken == this.dieResult){
        var card = this.ownedCards[i];
        $('#mine-'+card.id).addClass('slated-for-destruction');
        delete this.ownedCards[i];
      } 
    }
  }
  
  this.redraw = function(field){
    var $target;
    $target = (field == 'ownedCards') ? $('#owned') : $('#market');
    $target.html('');
    for (i in this[field]){
      var bidprice = this[field][i].bid_price
        , cash = this.userCash
      ;
      $('#template-mine').tmpl(this[field][i]).appendTo($target);
    }
  }
  
  this.endTurn = function(){
    this.clearControlButtons();
    this.clearTheDice();
    $('.slated-for-destruction').remove();
    this.redraw('ownedCards');
    this.advancePhase();
  }
  
  this.preparePhase = function(){
    var phase = this.phases[this.phase];
    if (phase == 'next-turn') this.nextTurn();
    if (phase == 'add-card-to-market') this.addCardToMarket();
    if (phase == 'wait-for-bid') this.waitForBid();
    if (phase == 'roll-for-production') this.rollForProduction();
    if (phase == 'end-turn') this.endTurn();
  }
  
  this.endGame = function(){
    $('body').addClass('gameover'); 
  }
}