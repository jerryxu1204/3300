var battle = (()=>{

  var userPokemon;

  var opponentPokemon;

  var map = {}

  var userBonus = 1
  var opponentBonus = 1
  function genStat(pokemon){
    var abilities = JSON.parse(pokemon.abilities.replace(/'/g,'"'));
    return {Src: getImgName(pokemon.name), 
                Name:pokemon.name, 
                Type: pokemon.type1.substring(0,1).toUpperCase()+pokemon.type1.substring(1),
                hp: pokemon.hp, 
                Abilities: abilities,
                Attack: pokemon.attack,
                Defense: pokemon.defense,
                spAttack: pokemon.sp_attack,
                spDefense: pokemon.sp_defense
      };
  }
  function initStatuses(typesjson, allPokemons){
    var classes = typesjson;
    var pikachu = allPokemons.find(e=>e.name==="Pikachu");
    userPokemon = genStat(pikachu);
    var gen1 = allPokemons.filter(p=>p.generation===1);
    let target = gen1[Math.floor(Math.random()*gen1.length)];
    opponentPokemon = genStat(target);
    for (var i in classes) {
      var subMap = {}
      var ele = classes[i]
      if (ele.immunes.length != 0) {
        for (var j in ele.immunes) {
          subMap[ele.immunes[j]] = 0
        }
      }

      if (ele.weaknesses.length != 0) {
        for (var j in ele.weaknesses) {
          subMap[ele.weaknesses[j]] = 0.5
        }
      }

      if (ele.strengths.length != 0) {
        for (var j in ele.strengths) {
          subMap[ele.strengths[j]] = 2
        }
      }

      map[ele.name] = subMap
    }
  
}

function changeUserPokemon(userPokemonNew){
  userPokemon = genStat(userPokemonNew);
  if (opponentPokemon.Type in map[userPokemon.Type]) {
    userBonus = map[userPokemon.Type][opponentPokemon.Type]
  }

  if (userPokemon.Type in map[opponentPokemon.Type]) {
    opponentBonus = map[opponentPokemon.Type][userPokemon.Type]
  }

  genBattle();
}

var generatedBattle = false;

function genBattle(){
  if(generatedBattle)return;
  generatedBattle = true;
  
  var app = new Vue({
    el: '#app',
    data: {
       userPokemonSrc: userPokemon.Src,
       opponentPokemonSrc: opponentPokemon.Src,
       userPokemon: userPokemon.Name,
       opponentPokemon: opponentPokemon.Name,
       userType: userPokemon.Type,
       opponentType: opponentPokemon.Type,
       userAlive: true,
       opponentAlive: true,
       userFill: userPokemon.hp,
       opponentFill: opponentPokemon.hp,
       userHP: userPokemon.hp,
       opponentHP: opponentPokemon.hp,
       battleText: userPokemon.Name + ", I choose you!",
       battleOptions: ["Attack", "Potion", "Special Attack", "Flee"],
       userAttack: userPokemon.Attack,
       opponentAttack: opponentPokemon.Attack,
       userDefense: userPokemon.Defense,
       opponentDefense: opponentPokemon.Defense,
       defenseCount: 3,
       userSpAttack: userPokemon.spAttack,
       opponentSpAttack: opponentPokemon.spAttack,
       userSpDefense: userPokemon.spDefense,
       opponentSpDefense: opponentPokemon.spDefense,
       fightOptions: userPokemon.Abilities,
       opponentSpecialAttackOptions: opponentPokemon.Abilities,
       specialAttackBonus: [1.1, 1.3, 1.6, 2],
       userBonus: userBonus,
       opponentBonus: opponentBonus,
       endOptions: ["Play again","Choose another Pokemon"],
       fightOn: false,
       optionsOn: true,
       endOn: false,
       waitChoose: false,
       userHpBar: {width: "100%"},
       opponentHpBar: {width: "100%"}
   },
    methods:{
      processCheckOpponentHp: function(){
        if(this.checkOpponentHp()){
          setTimeout(() => this.battleText = "Nicely done! " + this.opponentPokemon + " is fainted! Play again?", 2000);
          this.processFaint(1)
        } else if(this.checkOpponentHp() === false) {
            setTimeout(() => {
            this.processOpponentAttack()
            }, 2000);
        
            setTimeout(() => { 
              if(this.userAlive){
                setTimeout(() => {this.battleText = "What will " + this.userPokemon + " do?"
                }, 2000);
              }
            }, 2000);
        }
      },

      processNormalAttack: function(attack, defense, fill, pokemonName){
        var damage = attack / defense * attack * (0.15 + Math.random() * 0.05)
        fill -= Math.floor(damage)
        this.battleText = pokemonName + " dealt " + Math.floor(damage) + " damage"
        return fill
      },
      processSpecialAttack: function(attack, defense, spAttack, spDefense, optionNum, fill, pokemonName, options){
        //uses an ability
        
        var damage = attack / defense * attack * (0.05 + Math.random() * 0.02) + spAttack / spDefense * this.specialAttackBonus[optionNum] * spAttack * (0.1 + 0.03 * Math.random())

        fill -= Math.floor(damage)
        this.battleText = pokemonName + " used " + options[optionNum] + ", dealing " + Math.floor(damage) + " damage"
        return fill
      },
      processHpBar: function(fill, HP, HpBar){
        //edit HP bar
        if(fill <= 0){
          HpBar.width = "0%"
        } else{
          HpBar.width = Math.floor(fill / HP * 100) + "%"
        }
      },

      processOption: function(option){
        //this.updateBonus()
        switch(option){
          case 1:
            //handle attack
            this.opponentFill = this.processNormalAttack(this.userAttack, this.opponentDefense, this.opponentFill, this.userPokemon)

            this.processHpBar(this.opponentFill, this.opponentHP, this.opponentHpBar)

            // check if opponent is fainted
            this.processCheckOpponentHp()

          break;
          case 2:
            //handle defense          
            var baseHpRecover = this.userHP / (this.userDefense + this.userSpDefense) * this.userHP
            var randomHpRecover = Math.random() * baseHpRecover * 0.25
            this.userFill += Math.floor(baseHpRecover + randomHpRecover)
            if (this.userFill > this.userHP) {
              this.userFill = this.userHP
            }

            this.processHpBar(this.userFill, this.userHP, this.userHpBar)

            this.userDefense += Math.floor(this.userDefense * 0.1 * ( 1 + Math.random() * 0.5))
            this.userSpDefense += Math.floor(this.userSpDefense * 0.1 * ( 1 + Math.random() * 0.5))

            this.battleText = this.userPokemon + " restores " + Math.floor(baseHpRecover + randomHpRecover) + "  HP, and its Defense and Special Defense increase"

            
            setTimeout(() => {
            this.processOpponentAttack()
            }, 2500);
        
            setTimeout(() => { 
              if(this.userAlive){
                setTimeout(() => {this.battleText = "What will " + this.userPokemon + " do?"
                }, 2000);
              }
            }, 3000);
          break;
          case 3:
            //handle special attack
            this.optionsOn = false
            this.fightOn = true
          break;
          case 4:
            //handle flee
            var bool = Math.random()
            if (bool >= 0.5) {
              this.battleText = "Escape succeeds!"
              setTimeout(() => this.battleText = "Play again?", 1500);
              this.processFaint(1)
            } else {
              this.battleText = "Oh, no! Escape fails!"
              setTimeout(() => {
              this.processOpponentAttack()
              }, 3000);
          
              setTimeout(() => { 
                if(this.userAlive){
                  setTimeout(() => {this.battleText = "What will " + this.userPokemon + " do?"
                  }, 2000);
                }
              }, 4000);
            }
          break;
        }
      },
      processAttack: function(optionNum){
        //handle special attack
        this.opponentFill = this.processSpecialAttack(this.userAttack, this.opponentDefense, this.userSpAttack * this.userBonus, this.opponentSpDefense, optionNum - 1, this.opponentFill, this.userPokemon, this.fightOptions)
        this.processHpBar(this.opponentFill, this.opponentHP, this.opponentHpBar)
        this.processCheckOpponentHp()
      },
      checkOpponentHp: function(){
        if(this.opponentFill <= 0){
          //fainted

          return true
          
        } else{
          //battle continues
          return false
        }
      },
      processFaint: function(bool){
        this.optionsOn = false
        this.fightOn = false
        this.endOn = true
        this.waitChoose = false
        if(bool === 1){
          this.opponentAlive = false
        } else {
          this.userAlive = false
        }
      },
      processOpponentAttack: function(){
        var bool = Math.random()
        if (bool >= 0.5) {
          //handle attack
          this.userFill = this.processNormalAttack(this.opponentAttack, this.userDefense, this.userFill, this.opponentPokemon)
        } else {
          //opponent randomly uses an ability
          var maxAbilityNum = this.opponentSpecialAttackOptions.length
          if (maxAbilityNum > 4) {
            maxAbilityNum = 4
          }
          var random = Math.floor((Math.random() * maxAbilityNum))
          this.userFill = this.processSpecialAttack(this.opponentAttack, this.userDefense, this.opponentSpAttack * this.opponentBonus, this.userSpDefense, random, this.userFill, this.opponentPokemon, this.opponentSpecialAttackOptions)
        }

        this.processHpBar(this.userFill, this.userHP, this.userHpBar)


         if(this.checkUserHp()){
           //add battle text
           setTimeout(() => this.battleText = "Ops! Your " + this.userPokemon + " is fainted! Play again?", 1500);
           this.processFaint(2)
         } else if(this.checkOpponentHp() === false) {
           this.fightOn = false
           this.optionsOn = true
         }
      },
      checkUserHp: function(){
         if(this.userFill <= 0){
          //fainted
          this.userFill = 0
          return true
        } else{
          //battle continues
          return false
        }
      },
      resetBattle: function(){
        this.resetPokemons();
        //reset data to start new game
        this.endOn = false
        this.fightOn = false
        this.waitChoose = false
        this.optionsOn = true
        this.battleText = this.battleText
        this.userAlive = true
        this.opponentAlive = true
        this.userFill = userPokemon.hp
        this.opponentFill = opponentPokemon.hp
        this.userDefense = userPokemon.Defense
        this.userSpDefense = userPokemon.spDefense
        this.battleText = userPokemon.Name + ", I choose you!",
        this.userHpBar.width = "100%"
        this.opponentHpBar.width = "100%"

      },
      resetPokemons: function(){
        this.userPokemonSrc = userPokemon.Src;
        this.opponentPokemonSrc = opponentPokemon.Src;
        this.userPokemon = userPokemon.Name
        this.opponentPokemon= opponentPokemon.Name
        this.userType= userPokemon.Type
        this.opponentType= opponentPokemon.Type
        this.userFill= userPokemon.hp
        this.opponentFill= opponentPokemon.hp,
        this.userHP= userPokemon.hp,
        this.opponentHP= opponentPokemon.hp,
        this.userAttack= userPokemon.Attack,
        this.opponentAttack= opponentPokemon.Attack,
        this.userDefense= userPokemon.Defense,
        this.opponentDefense= opponentPokemon.Defense,
        this.userSpAttack= userPokemon.spAttack,
        this.opponentSpAttack= opponentPokemon.spAttack,
        this.userSpDefense= userPokemon.spDefense,
        this.opponentSpDefense= opponentPokemon.spDefense,
        this.fightOptions= userPokemon.Abilities,
        this.opponentSpecialAttackOptions= opponentPokemon.Abilities;
      },
      endBattle: function(){
        this.endOn = false
        this.fightOn = false
        this.optionsOn = false
        this.waitChoose = true
        document.getElementById('small').scrollIntoView({behavior: "smooth"});
        this.battleText = "Click start when you've done choosing!"
      },
      chooseDone: function(){
        this.resetPokemons();
        this.resetBattle();
      }
    }
    
  })
}

return {
  changeUserPokemon,
  initStatuses
}

})()