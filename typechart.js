function getImgName (pokemonName){
  return 'pokemon_images/'+pokemonName.replace('.','-').replace(/\s|'/,'')
  .replace('♀','-m').replace('♂','-f').replace('é','e').toLowerCase()+'.png';

}

(()=>{
  // console.log(battle)
var chooseBtn = document.getElementById('choosebtn'),
  battleScene = document.getElementById('app').setAttribute('style','visibility:hidden; height:0;');

var svg = d3.select("svg#small")
  .attr("width", 800)
  .attr("height", 700)
.append("g")
  .attr("transform", "translate(" + radius + "," + radius + ")");

var bottomChart = document.getElementById('bottom');
bottomChart.setAttribute('style','display:none');

var immune = svg.append("g").selectAll(".immune"),
    weak = svg.append("g").selectAll(".weak"),
    strong = svg.append("g").selectAll(".strong"),
    node = svg.append("g").selectAll(".node"),
    nodecircle = node;

var expandTypeDetail;

d3.json("types.json", function(error, classes) {
  
  var nodes = cluster.nodes(packageHierarchy(classes)),
      immunes = typeImmune(nodes),
      strengths = typeStrong(nodes),
      weaknesses = typeWeak(nodes);

  immune = immune
      .data(bundle(immunes))
    .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "immune")
      .attr("d", line);

  weak = weak
      .data(bundle(weaknesses))
      .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "weak")
      .attr("d", line);

  strong = strong
      .data(bundle(strengths))
      .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "strong")
      .attr("d", line)
      .attr("data-is-effective-against-self", function(d) { return (d[0] === d[d.length - 1]) });
      
   nodecircle = nodecircle
      .data(nodes.filter(function(n) { return !n.children; }))
      .enter()
      .append('circle')
      .attr({fill:'rgba(0,0,0,0)',r: 35})
      .attr("cx",d=>(d.x<180?35:-35))
      .attr("cy",0)
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")" + (d.x < 180 ? "" : "rotate(180)"); })

    node = node
      .data(nodes.filter(function(n) { return !n.children; }))
      .enter()
      // .append("text")
      // .attr("class", function(n) {
      //   return 'node ';
      // })
      // .attr('fill',n=>n.color)
      .append('image')
      .attr('xlink:href',d=>'types/'+d.name.toLowerCase()+'.gif')
      .attr("x",-25)//d=>(d.x<180?0:-52)
      .attr("y",-10)

      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" +( d.y+25 )+ ")" + "rotate("+(90-d.x)+")"; })
      // .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      // .text(function(d) { return d.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted)
      .on("click", (d)=>{
        var colors = {};
        for(let i=0;i<classes.length;i++){
          colors[classes[i].name.toLowerCase()] = classes[i].color;
        }
        if(expandTypeDetail===undefined){
          showBottom(colors)
          .then(res=>{
            expandTypeDetail = res.fn;
            expandTypeDetail(d.name.toLowerCase());
            battle.initStatuses(classes,res.allPokemons);
          })
        }
        else{
          expandTypeDetail(d.name.toLowerCase());
        }
        
      });
  
});

function mouseovered(d) {
  node
      .each(function(n) { n.target = n.source = false; });

  immune
      .classed("is-immune", function(l) { if (l.source === d) return l.target.target = true; })
      .filter(function(l) { return l.source === d; })
      .each(function(d) { this.parentNode.appendChild(this); });

  weak
      .classed("weak-effectiveness", function(l) { if (l.source === d) return l.target.target = true; })
      .filter(function(l) { return l.source === d })
      .each(function() { this.parentNode.appendChild(this); });

  strong
      .classed("strong-effectiveness", function(l) { if (l.source === d) { return l.target.target = true;} })
      .filter(function(l) { return l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });


  node
      .classed("node--target", function(n) { return n.target; });

  nodecircle
      .style('stroke', function(l) { 
        // if(d.immunes.indexOf(l.name) != -1) {
        //   return 'rgba(0, 0, 0, 1)';//black
        // }
        // if(d.weaknesses.indexOf(l.name) != -1) {
        //   return 'rgba(180, 30, 30,1)';//red
        // }
        // if(d.strengths.indexOf(l.name) != -1) {
        //   return 'rgba(72, 185, 57,1)';//green
        // }
        return "rgba(0,0,0,0)";
      })
      .style('stroke-width','2px');
}

function mouseouted(d) {
  immune
      .classed("is-immune", false);

  weak
      .classed("weak-effectiveness", false);

  strong
      .classed("strong-effectiveness", false);

  node
      .classed("node--target", false)
      .attr('fill',n=>n.color);
  
  nodecircle.style('stroke',"rgba(0,0,0,0)")

}

d3.select(self.frameElement).style("height", diameter + "px");

function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }
  classes.forEach(function(d) {
    find(d.name, d);
  });

  return map[""];
}

function typeImmune(nodes) {
  var map = {},
      immunes = [];

  nodes.forEach(function(d) {
    map[d.name] = d;
  });

  nodes.forEach(function(d) {
    if (d.immunes) d.immunes.forEach(function(i) {
      immunes.push({source: map[d.name], target: map[i]});
    });
  });

  return immunes;
}

function typeWeak(nodes) {
  var map = {},
      weaknesses = [];

  nodes.forEach(function(d) {
    map[d.name] = d;
  });

  nodes.forEach(function(d) {
    if (d.weaknesses) d.weaknesses.forEach(function(i) {
      weaknesses.push({source: map[d.name], target: map[i]});
    });
  });

  return weaknesses;
}
function typeStrong(nodes) {
  var map = {},
      strengths = [];

  nodes.forEach(function(d) {
    map[d.name] = d;
  });

  nodes.forEach(function(d) {
    if (d.strengths) d.strengths.forEach(function(i) {
      strengths.push({source: map[d.name], target: map[i]});
    });
  });

  return strengths;
}



// bottom
function showBottom(colors){

  bottomChart.setAttribute('style','display:true');
    
  const radius = 35,
  toppadding = 25,
  spacebetween = 10,
  dimension = 700,
  sliderWidth = 200,
  sliderPadding = 80;

  var svg2 = d3.select('svg#large').attr('transform','translate('+radius+',0)');

  var canvas = svg2.attr("width", dimension+sliderWidth)
  .attr("height", dimension)
  .append("g").attr("transform", "translate(" +(innerRadiusLarge+radius) + "," + (innerRadiusLarge+radius) + ")");

  canvas.append('circle')
  .attr('r',innerRadiusLarge)
  .attr('fill','#f7f7f7');

  canvas.append('circle')
  .attr('r',innerRadiusLarge*0.6)
  .attr('fill','white');

  svg2.append('filter')
  .attr('id','desaturate')
  .append('feColorMatrix')
  .attr('type','matrix')
  .attr('values',"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0");

  var nameArea = document.getElementById('pokemonname'),
  idArea = document.getElementById('pokemonid'),
  stats = d3.select('svg#stats')
    .attr('width',270)
    .attr('height',100)
    .append('g'),
  imgArea = document.getElementById('pokemonimg'),
  resistances = document.getElementById('resistances'),
  weaknesses = document.getElementById('weaknesses');

  stats.attr('transform',"translate("+radius+","+(radius+toppadding)+")");

  //table

  var images = [
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image'),
    canvas.append('image')
  ]
  var donutCharts = [
    stats.append('path'),
    stats.append('path'),
    stats.append('path'),

    stats.append('path'),
    stats.append('path'),
    stats.append('path')];
  
  var chartLabels = [
    stats.append('text'),
    stats.append('text'),
    stats.append('text')
  ]

  var chartValueLabels = [
    stats.append('text'),
    stats.append('text'),
    stats.append('text')
  ]

  var sliderCanvases = [
    svg2.append('g')
    .attr("transform", "translate(" + dimension + "," + (toppadding+sliderPadding) + ")"),
    svg2.append('g')
    .attr("transform", "translate(" + dimension + "," + (toppadding +2*sliderPadding)+ ")"),
    svg2.append('g')
    .attr("transform", "translate(" + dimension + "," + (toppadding +3*sliderPadding)+ ")"),
    svg2.append('text').text('Attack')
    .attr({"x":dimension,"y":(sliderPadding)}),//text-on-chart class
    svg2.append('text').text('Defense')
    .attr({"x":dimension,"y":(2*sliderPadding)}),
    svg2.append('text').text('HP')
    .attr({"x":dimension,"y":(3*sliderPadding)})
  ]

  var sliders = sliderCanvases.map(canvas=>canvas.append("g")
    .attr("class", "x axis"))

  var brushg = sliderCanvases.map(canvas=>canvas.append("g")
    .attr("class", "brush"))

  var paginaion = [
    canvas.append('text').text('→').style('font-size','5em').attr('fill','black')
    .attr('transform','translate('+innerRadiusLarge*0.8+','+innerRadiusLarge+')')
    .attr({"text-anchor":"middle","alignment-baseline":"middle"}),
    canvas.append('text').text('←').style('font-size','5em').attr('fill','#ccc')
    .attr('transform','translate('+(-innerRadiusLarge*0.8)+','+innerRadiusLarge+')')
    .attr({"text-anchor":"middle","alignment-baseline":"middle"})
  ];

  return fetch('pokemontypes.json')
  .then(res=>{
    return res.json();
  })
  .then(res=>{
    var allPokemons = res;

    var pokemonsByType = {};
    var lowestGenOfType = {};
    for(let gen = 1;gen<=6;gen++){
      var pokemonsInGen = allPokemons.filter(p=>p.generation == gen);
      pokemonsInGen.forEach(p=>{
        let type = p.type1.toLowerCase();
        if(lowestGenOfType[type]===undefined)lowestGenOfType[type] = gen;
        if(gen>lowestGenOfType[gen]){
          return;
        }
        pokemonsByType[p.type1] = pokemonsByType[p.type1]||[];
        pokemonsByType[p.type1].push(p);
      })
    }

    function showType(typeName,filters){
      var pokemons = [...pokemonsByType[typeName]];
      if(filters){
        pokemons = pokemons.filter(p=>(filters.attack&&p.attack>=filters.attack[0]&&p.attack<=filters.attack[1])
        ||(filters.defense&&p.defense>=filters.defense[0]&&p.defense<=filters.defense[1])
        ||(filters.hp && p.hp>=filters.hp[0]&&p.hp<=filters.hp[1]));
      }

      //pagination
      const imgPerPage = 8;
      var pagedPokemons = [];
      var id = -1;
      for(let i=0;i<pokemons.length;i++){
        if(i%imgPerPage===0){
          id++;
          pagedPokemons[id] = [];
        }
        pagedPokemons[id].push(pokemons[i]);
      }

      makeSlider('attack',pokemons,0, typeName)
      makeSlider('defense',pokemons,1, typeName)
      makeSlider('hp',pokemons,2, typeName)
      
      const positionsOnCircle = [
        [0,innerRadiusLarge*0.8],
        [innerRadiusLarge*0.56,innerRadiusLarge*0.56],
        [innerRadiusLarge*0.8,0],
        [innerRadiusLarge*0.56,-innerRadiusLarge*0.56],
        [0,-innerRadiusLarge*0.8],
        [-innerRadiusLarge*0.56,-innerRadiusLarge*0.56],
        [-innerRadiusLarge*0.8,0],
        [-innerRadiusLarge*0.56,innerRadiusLarge*0.56],
      ];
      const imgSize = 96;
      var firstPokemonOnPage;
      var currPage = 0;
      showPokemons(0);
      paginaion[0].on('click',()=>{
        currPage++;
        if(currPage>pagedPokemons.length-1){
          currPage--;
          return;
        }
        changePaginationColor(currPage,pagedPokemons.length-1,paginaion);
        showPokemons(currPage);
      });
      paginaion[1].on('click',()=>{
        currPage--;
        if(currPage<0){
          currPage++;
          return;
        }
        changePaginationColor(currPage,pagedPokemons.length-1,paginaion);
        showPokemons(currPage);
      });

      function changePaginationColor(currPage,maxPage,paginaion){
        paginaion[0].attr('fill','black')
        paginaion[1].attr('fill','black')
        if(currPage === 0){
          paginaion[1].attr('fill','#ccc')
        }
        if(currPage === maxPage){
          paginaion[0].attr('fill','#ccc')
        }
      }
      
      function showPokemons(page){
        if(pagedPokemons[page]===undefined)return;
        pagedPokemons[page].forEach((pokemon,i)=>{
          if(i==0)showSinglePokemon(pokemon,typeName)();
          
          var img = images[i]
          .attr('xlink:href', getImgName(pokemon.name))
          .attr('x',positionsOnCircle[i][0]-imgSize/2)
          .attr('y',positionsOnCircle[i][1]-imgSize/2)
          .style("filter","url(#desaturate)")
          
          img.on("mouseover",()=>{
            img.style("filter","none")
          })
          img.on("mouseout",()=>{
            img.style("filter","url(#desaturate)")
          })
          img.on("click",showSinglePokemon(pokemon,typeName))
            
          
        })
        changePaginationColor(page,pagedPokemons.length-1,paginaion);
        
      }
        
    }

    function genBattleScene(pokemon){
      battle.changeUserPokemon(pokemon);
    }

    function showSinglePokemon(pokemon,typeName){
      
      return ()=>{
        
        chooseBtn.onclick = ()=>{
          var battleScene = document.getElementById('app');
          battleScene.setAttribute('style','visibility:visible; height:auto;');
          battleScene.scrollIntoView({behavior: "smooth"});
          genBattleScene(pokemon)
        }

        nameArea.innerHTML = pokemon.name;
        idArea.innerHTML = pokemon.pokedex_number;
        imgArea.setAttribute('src', getImgName(pokemon.name));
        
        drawDonut(pokemon.attack,250,colors[typeName],0,'Attack');
        drawDonut(pokemon.defense,250,colors[typeName],1,'Defense');
        drawDonut(pokemon.hp,250,colors[typeName],2,'HP');

        resistances.innerHTML = '';
        weaknesses.innerHTML = '';
        
        var types = Object.keys(colors);
        for(let i=0;i<types.length;i++){
          let value = pokemon["against_"+types[i]];
          if(value<1){
            let node = document.createElement('li');
            node.innerHTML = '<span style="color:'+colors[types[i]]+'">'+types[i]+'</span> '+(value*100)+'% Damage'
            weaknesses.appendChild(node);
          }else if(value>1){
            let node = document.createElement('li');
            node.innerHTML = '<span style="color:'+colors[types[i]]+'">'+types[i]+'</span> '+(value*100)+'% Damage'
            resistances.appendChild(node);
          }
        }

      }
    }

    function drawDonut(val, maxVal, color, index, title){
      
      var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius*3/4)
      .startAngle(0)
      .endAngle(2*3.14*(val/maxVal));

      var arcbg = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius*3/4)
      .startAngle(0)
      .endAngle(2*3.14);

      donutCharts[index]
      .attr('d',arcbg)
      .style('fill','#f7f7f7')
      .attr('transform',"translate("+((2*radius+spacebetween)*index)+",0)");

      donutCharts[index+3]
      .attr('d',arc)
      .style('fill',color)
      .attr('transform',"translate("+((2*radius+spacebetween)*index)+",0)");

      chartLabels[index]
      .attr('x',(2*radius+spacebetween)*index)
      .attr('y',-radius*1.5)
      .attr('fill','black')
      .attr({"text-anchor":"middle","alignment-baseline":"middle"})
      .text(title);

      chartValueLabels[index]
      .attr('x',(2*radius+spacebetween)*index)
      .attr('y',0)
      .attr('fill','black')
      .attr({"text-anchor":"middle","alignment-baseline":"middle"})
      .text(val);

    }

    function makeSlider(property, pokemons,index,typeName) {
      var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = sliderWidth - margin.left - margin.right,
        height = 20;
      
      var minmax = d3.extent(pokemons.map(p=>p[property]));
      var x = d3.scale.linear()
        .domain([0,250])
        .range([0, width]);

      var brush = d3.svg.brush()
        .x(x)
        .extent(minmax);

      sliders[index]
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5)
          .tickFormat(d3.format("")));

      brushg[index]
          .call(brush)
          .attr({'fill':colors[typeName]});

      brushg[index].selectAll("rect")
          .attr("height", height);

      brush.on('brushend', function() {brushed()})

      // d3.select('#start-number')
      //   .append('text')
      //   .text(brush.extent()[0]);

      // d3.select('#end-number')
      //   .append('text')
      //   .text(brush.extent()[1]);

      function brushed() {
        // let range = [Math.max(minmax[0],brush.extent()[0]),Math.min(minmax[1],brush.extent()[1])]
        showType(typeName,{
          [property]:brush.extent()
        })
      }
    }


    return {
      fn: (typeName)=>{
        showType(typeName);
        bottomChart.scrollIntoView({behavior: "smooth"})
      },
      allPokemons: res
    }
  })
  
}


})()
