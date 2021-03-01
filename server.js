const path=require('path') // __dirname
const fs= require('fs');
const express=require('express')
const app=express()
const PORT=3000
app.listen(PORT, ()=>console.log(`Listerning on localhost:${PORT}`))

// app.use('/www', express.static(path.join(__dirname, 'www')))
app.use(express.static(__dirname))

const getAllFiles=function(dirPath, arrayOfFiles) {
  var files=fs.readdirSync(dirPath)
  arrayOfFiles=arrayOfFiles || []
  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles=getAllFiles(path.join(dirPath, file), arrayOfFiles)
    } else {
      // arrayOfFiles.push(path.join(__dirname, dirPath, file)) // abs
      arrayOfFiles.push(path.join(dirPath, file)) // rel
    }
  })
  return arrayOfFiles
}
const all_files=getAllFiles('.');
const ext_img=[".jpg",".png",".gif"]
const ext_csv=[".csv"]
const ext_htm=[".htm"]
const ext_all=[... new Set([...ext_img,...ext_csv,...ext_htm])];
const filter_ext=function(files, exts) {
  exts=exts || ext_all;
  res=[];
  files.forEach( (f) => {
    ext=path.extname(f)
    if (exts.includes(ext)) res.push(f);
  });
  return res;
}

const html_head=function(title){ return(/*html*/`
<!DOCTYPE html/>
<html>
<head>
  <title>${title}</title>
  <link rel="shortcut icon" href="" >
  <link rel="stylesheet" href="www/bootstrap400.min.css"/>
  <link rel="stylesheet" href="www/bootstrap-toc.css"/>
  <script src="www/jquery-3.2.1.slim.min.js"></script>
  <script src="www/d3.v3.min.js"></script>
  <script src="www/bootstrap400.min.js"></script>
  <script src="www/bootstrap-toc.js"></script>
  <script>
    const topN=10; // only show first few rows for the data table
  </script>
</head>
<body data-spy="scroll" data-target="#toc">
  <div class="container">
  <div class="row">
  <div class="col-sm-3">
    <nav id="toc" data-toggle="toc" class="sticky-top"></nav>
  </div>
  <div class="col-sm-9">
  <caption>${title}</caption>
`)};

const html_foot=function(){ return(/*html*/`
  </div>
  <script type="text/javascript">
    $('img[data-enlargeable]').addClass('img-enlargeable').click(function(){
      var src = $(this).attr('src');
      var modal;
      function removeModal(){ modal.remove(); $('body').off('keyup.modal-close'); }
      modal = $('<div>').css({
        background: 'RGBA(0,0,0,.5) url('+src+') no-repeat center',
        backgroundSize: 'contain',
        width:'100%', height:'100%',
        position:'fixed',
        zIndex:'10000',
        top:'0', left:'0',
        cursor: 'zoom-out'
      }).click(function(){ removeModal(); }).appendTo('body');
      $('body').on('keyup.modal-close', function(e){ if(e.key==='Escape'){ removeModal(); } });
    });
  </script>
  <script type="text/javascript">
    function load_table(path) {
      var eid=path.replace(/[/\.]/g,"-")
      d3.text(path, function(data){
        var rows = d3.csv.parseRows(data);
        var tab=d3.select("#"+eid);
        if (tab.select("tr").empty()) { // if empty, add
          tab.append("caption").text(path+" Top "+topN)
          tab.append("thead").append("tr")
          .selectAll("th")
          .data(rows[0])
          .enter().append("th")
          .text(function(d) { return d; });
          tab.append("tbody")
          .selectAll("tr").data(rows.slice(1,1+topN))
          .enter().append("tr")
          .selectAll("td")
          .data(function(d){ return d; })
          .enter().append("td")
          .text(function(d){ return d; })
        } else {
          tab.selectAll("*").remove(); // if exist, clean
        }
      })
    }
  </script>
</body>
</html>
`)};

const html_sec=function(depth,file){
  return(/*html*/`<h${depth}>${file}</h${depth}>`)
};
const html_img=function(file){
  return(/*html*/`
  <img data-enlargeable style="cursor:zoom-in; max-width:100%" src="${file}"/>
`)};
const html_csv=function(file){
  return(/*html*/`
  <a href="${file}">${file}</a>
  <input type="button" value="load/hide" onclick="load_table('${file}')"/>
  <table id="${file.replace(/[/\.]/g,"-")}" class="table table-striped table-bordered"></table>
`)};
const html_htm=function(file){
  return(/*html*/`
  <a href="${file}" target="_blank">${file}</a>
`)};

var comp=[];
comp.push(html_head("hahaha!"))
filter_ext(all_files).forEach( (f)=>{
  const ff=f.split(path.sep);
  const d=ff.length; // depth
  const fv=ff.join("/"); // file valid
  console.log(fv);
  comp.push(html_sec(d,fv));
  if (ext_img.includes(path.extname(f))) {
    comp.push(html_img(fv));
  } else if (ext_csv.includes(path.extname(f))) {
    comp.push(html_csv(fv));
  } else if (ext_htm.includes(path.extname(f))) {
    comp.push(html_htm(fv));
  }
});
comp.push(html_foot());

// console.log(comp);

app.get('/',(req,res)=>res.send(comp.join(''))) // also default

