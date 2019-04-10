(()=>{

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
      .on("click", (d,index)=>{
        colors = classes.map(e=>e.color);
        if(expandTypeDetail === undefined) expandTypeDetail = showBottom(colors);
        expandTypeDetail(index);
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

  var colors = colors
  const radius = 35,
  toppadding = 25,
  spacebetween = 10,
  dimension = 700;

  var svg2 = d3.select('svg#large').attr('transform','translate('+2*radius+',0)');

  var canvas = svg2.attr("width", dimension)
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

  var paginaion = [
    canvas.append('text').text('→').style('font-size','5em').attr('fill','black')
    .attr('transform','translate('+innerRadiusLarge*0.8+','+innerRadiusLarge+')')
    .attr({"text-anchor":"middle","alignment-baseline":"middle"}),
    canvas.append('text').text('←').style('font-size','5em').attr('fill','#ccc')
    .attr('transform','translate('+(-innerRadiusLarge*0.8)+','+innerRadiusLarge+')')
    .attr({"text-anchor":"middle","alignment-baseline":"middle"})
  ];

function showType(typeId){
  d3.json('https://pokeapi.co/api/v2/type/'+typeId+'/',type=>{
    
    var pokemons = type.pokemon;

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
      if(currPage === 0){
        paginaion[1].attr('fill','#ccc')
        paginaion[0].attr('fill','black')
      }else if(currPage === maxPage){
        paginaion[1].attr('fill','black')
        paginaion[0].attr('fill','#ccc')
      }else{
        paginaion[1].attr('fill','black')
        paginaion[0].attr('fill','black')
      }
    }
    
    function showPokemons(page){
      pagedPokemons[page].forEach((p,i)=>{
        d3.json(p.pokemon.url,pokemon=>{
          if(i==0)showSinglePokemon(pokemon,typeId)();

          var img = images[i]
          .attr('xlink:href', pokemon.sprites.front_default)
          .attr('x',positionsOnCircle[i][0]-imgSize/2)
          .attr('y',positionsOnCircle[i][1]-imgSize/2)
          .style("filter","url(#desaturate)")
          
          img.on("mouseover",()=>{
            img.style("filter","none")
          })
          img.on("mouseout",()=>{
            img.style("filter","url(#desaturate)")
          })
          img.on("click",showSinglePokemon(pokemon,typeId))
          
        })
      })
      
    }
    
  })
}

function showSinglePokemon(pokemon,typeId){
  return ()=>{
    nameArea.innerHTML = pokemon.name.substring(0,1).toUpperCase()+pokemon.name.substring(1);
    idArea.innerHTML = pokemon.order;
    imgArea.setAttribute('src',pokemon.sprites.front_default);
    imgArea.onmouseover = ()=>{
      imgArea.setAttribute('src',pokemon.sprites.back_default);
    }
    imgArea.onmouseleave = ()=>{
      imgArea.setAttribute('src',pokemon.sprites.front_default);
    }
    
    drawDonut(pokemon.stats[3].base_stat,100,colors[typeId],0);
    drawDonut(pokemon.stats[4].base_stat,100,colors[typeId],1);
    drawDonut(pokemon.stats[5].base_stat,100,colors[typeId],2);

  }
}

function drawDonut(val, maxVal, color, index){
  
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
  .attr('y',0)
  .attr('fill','black')
  .attr({"text-anchor":"middle","alignment-baseline":"middle"})
  .text(val);

}

  return (typeId)=>{
    showType(typeId);
    bottomChart.scrollIntoView({behavior: "smooth"});
  }
}


})()
