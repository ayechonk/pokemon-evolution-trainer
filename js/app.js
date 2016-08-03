(function() {
  new Vue({
    el: '#app',

    data: {
      hidden: true,
      pokemon: [],
      candies: {},
      selected: {},
      inserting: [],
    },

    ready: function() {
      var _this = this;
      this.loadPokemon();
      setInterval(function() {
        // _this.savePokemon();
      }, 5000);
      this.hidden = false;
    },

    methods: {

      hasCount: function(poke) {
        return poke.count > 0;
      },

      hasNone: function(poke) {
        return poke.count == 0;
      },

      clearInserting: function() {
        this.inserting = [];
        this.selected = {};
      },

      editPokemon: function(poke) {

        poke.edit = !poke.edit;
      },

      addToInsert: function(poke) {

        this.inserting.push(poke);
      },

      savePokemon: function() {
        localStorage.setItem('pokemon', JSON.stringify(this.pokemon));
        localStorage.setItem('candies', JSON.stringify(this.candies));
      },

      loadPokemon: function() {
        var _this = this;
        if (localStorage.getItem('pokemon') != null)
          this.pokemon = JSON.parse(localStorage.getItem('pokemon'));
        else {
          $.get('data/pokemon.json', function(data) {
            localStorage.setItem('pokemon', JSON.stringify(data));
            _this.pokemon = data;
          });
        }

        if (localStorage.getItem('candies') != null)
          this.candies = JSON.parse(localStorage.getItem('candies'));
        else {
          $.get('data/candies.json', function(data) {
            localStorage.setItem('candies', JSON.stringify(data));
            _this.candies = data;
          });
        }
      },

      scrapePokemon: function() {
        var _this = this;
        $.get('pokecharts.html', function(data) {
          $('body').append(data);
          var list = $('#pokedex tbody tr');
          var evolvesList = $('#evolve-chart tbody tr')
          var dex = [];
          var candies = {};

          $.each(list, function(i, o) {
            var row = $(o);
            var poke = {};
            var candiesToEvolve = row.find('td')[4].innerHTML;
            poke.number = row.find('td')[0].innerHTML.slice(1, 4);
            poke.name = row.find('td')[1].innerHTML;
            poke.count = 0;
            poke.candiesToEvolve = candiesToEvolve == "None" ? 0 : parseInt(row.find('td')[4].innerHTML);
            poke.edit = false;

            //Find evolution id
            if (poke.name == "Eevee")
              poke.evolvesTo = [134, 135, 136];
            else if ($($(evolvesList[i + 1]).find('td')[4]).length > 0)
              poke.evolvesTo = parseInt(poke.number) + 1;
            else
              poke.evolvesTo = 0;

            // Insert into pokedex array by poke number.
            dex[i + 1] = poke;


            // Build candies object
            if (i + 1 == 134 || i + 1 == 135 || i + 1 == 136)
              poke.candyId = '133';
            else {
              successor = _.filter(dex, function(p) {
                return p.evolvesTo == i + 1;
              });

              if (successor.length == 0) {
                candies[poke.number] = 0;
                poke.candyId = poke.number;
              } else {
                preSuccessor = _.filter(dex, function(p) {
                  return p.evolvesTo == parseInt(successor[0].number);
                });
                if (preSuccessor.length == 0) {
                  poke.candyId = successor[0].number;
                } else {
                  poke.candyId = preSuccessor[0].number;
                }
              }
            }
          });
          $.post('saveEmptyCandies.php', JSON.stringify(candies));
          $.post('saveEmptyPokemon.php', JSON.stringify(dex));
          _this.candies = candies;
          _this.pokemon = dex;
        });
      },

      caught: function(poke) {
        poke.count++;
        this.candies[poke.candyId] += 3;
      },

      pokeEvolutions: function(poke) {
        if (poke.candiesToEvolve == 0)
          return 0;
        else {
          var possibleEvolutions = Math.floor(this.candies[poke.candyId] / poke.candiesToEvolve);
          return (poke.count < possibleEvolutions ? poke.count : possibleEvolutions);
        }
      },

      totalEvolutions: function() {
        var total = 0;
        var _self = this;
        $.each(this.candies, function(i, o) {
          //get the pokemon of that candy type
          var pokemon = _.filter(_self.pokemon, function(p) {
            if (p.candyId == i)
              return true;
            else return false;
          });
          var mostEvoByFamily = _.maxBy(pokemon, function(p) {
            return _self.pokeEvolutions(p);
          });
          total += _self.pokeEvolutions(mostEvoByFamily);
        });
        return total;
      },

      transferPokemon: function(poke) {
        poke.count--;
        this.candies[poke.candyId]++;
      },

      evolve: function(poke) {
        poke.count--;
        this.pokemon[poke.evolveId].count++;
        this.candies[poke.candyId] -= poke.candiesToEvolve;
      },

      catchesForNextEvolution: function(poke) {

        return Math.ceil(this.candiesForNextEvolution(poke) / 4);
      },

      candiesForNextEvolution: function(poke) {
        if (poke.candiesToEvolve == 0)
          return 0;
        else {
          return poke.candiesToEvolve - (this.candies[poke.candyId] % poke.candiesToEvolve);
        }
      }
    },
  })
})();
